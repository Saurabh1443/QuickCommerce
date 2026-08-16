"""Order placement and lifecycle service layer.

Placement always recomputes prices and stock from the database — the frontend cart
totals are only ever a preview, never the source of truth.
"""
from django.db import transaction
from django.utils import timezone

from apps.accounts.constants import Role
from apps.carts import services as cart_services
from apps.carts.pricing import calculate as calculate_pricing
from apps.carts.repositories import CartRepository
from apps.common.exceptions import ConflictError, DomainError
from apps.events.bus import publish
from apps.events.event_types import EventType
from apps.orders import state_machine
from apps.orders.constants import (
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    STOCK_RELEASING_STATUSES,
)
from apps.orders.repositories import (
    OrderItemRepository,
    OrderRepository,
    OrderStatusEventRepository,
)
from apps.products.repositories import ProductRepository


@transaction.atomic
def place_order(*, customer, address, payment_method, customer_note=""):
    """Convert the customer's validated cart into an Order, reserving stock."""
    cart = cart_services.get_or_create_cart(customer)
    cart_services.validate_cart_for_checkout(cart)

    if payment_method == PaymentMethod.COD and not cart.shop.cod_enabled:
        raise DomainError("This shop does not accept Cash on Delivery.")

    items = list(cart.items.select_related("product").all())
    breakdown = calculate_pricing(
        [
            {"product": i.product, "quantity": i.quantity,
             "unit_price": i.unit_price, "total_price": i.total_price}
            for i in items
        ],
        cart.shop,
    )

    order = OrderRepository.create_order(
        customer=customer,
        shop=cart.shop,
        contact_name=address["name"],
        contact_phone=address["phone"],
        address_line=address["address_line"],
        landmark=address.get("landmark", ""),
        city=address["city"],
        state=address["state"],
        pincode=address["pincode"],
        latitude=address["latitude"],
        longitude=address["longitude"],
        subtotal=breakdown.subtotal,
        delivery_fee=breakdown.delivery_fee,
        discount=breakdown.discount,
        tax=breakdown.tax,
        total_amount=breakdown.total,
        payment_method=payment_method,
        payment_status=PaymentStatus.PENDING,
        customer_note=customer_note,
        eta_minutes=cart.shop.avg_prep_minutes + 25,
    )

    for item in items:
        product = ProductRepository.get_for_update(item.product_id)
        if item.quantity > product.stock_quantity:
            raise DomainError(f"Only {product.stock_quantity} unit(s) of {product.name} left.")
        product = ProductRepository.update(
            product, stock_quantity=product.stock_quantity - item.quantity
        )

        OrderItemRepository.create_item(
            order=order,
            product=product,
            product_name=product.name,
            unit=product.unit,
            image=product.image,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
        )

    OrderStatusEventRepository.create_event(
        order=order, from_status="", to_status=OrderStatus.PLACED,
        changed_by=customer, changed_by_role=Role.CUSTOMER,
        note="Order placed by customer.",
    )

    CartRepository.clear(cart)

    transaction.on_commit(
        lambda: publish(
            EventType.ORDER_PLACED,
            order_id=order.id,
            order_number=order.order_number,
            shop_id=order.shop_id,
            shop_name=order.shop.name,
            shop_owner_email=order.shop.owner.email,
            customer_id=customer.id,
            customer_name=customer.name,
            customer_email=customer.email,
            total_amount=str(order.total_amount),
            payment_method=order.payment_method,
        )
    )
    return order


def _release_stock(order):
    for item in order.items.select_related("product"):
        if item.product is not None:
            product = ProductRepository.get_for_update(item.product_id)
            ProductRepository.update(product, stock_quantity=product.stock_quantity + item.quantity)


@transaction.atomic
def transition_order(*, order, target_status, actor, note=""):
    """Move an order to ``target_status`` if the state machine allows it for actor's role."""
    order = OrderRepository.get_for_update(order.pk)
    state_machine.assert_can_transition(order.status, target_status, actor.role)

    if target_status in state_machine.REASON_REQUIRED and not note:
        raise DomainError("A reason is required for this action.")

    previous_status = order.status
    fields = {"status": target_status}
    if target_status in STOCK_RELEASING_STATUSES:
        _release_stock(order)
        fields["cancel_reason"] = note
    if target_status == OrderStatus.DELIVERED:
        fields["delivered_at"] = timezone.now()
        if order.is_cod:
            fields["payment_status"] = PaymentStatus.PAID

    order = OrderRepository.update(order, **fields)
    OrderStatusEventRepository.create_event(
        order=order, from_status=previous_status, to_status=target_status,
        changed_by=actor, changed_by_role=actor.role, note=note,
    )

    event = EventType.ORDER_DELIVERED if target_status == OrderStatus.DELIVERED \
        else EventType.ORDER_CANCELLED if target_status in (OrderStatus.CANCELLED, OrderStatus.REJECTED) \
        else EventType.ORDER_STATUS_CHANGED
    transaction.on_commit(
        lambda: publish(
            event,
            order_id=order.id,
            order_number=order.order_number,
            from_status=previous_status,
            to_status=target_status,
            customer_email=order.customer.email,
            customer_name=order.customer.name,
            shop_name=order.shop.name,
            note=note,
        )
    )
    return order


def cancel_order(*, order, actor, reason):
    if order.status not in (OrderStatus.PLACED, OrderStatus.ACCEPTED):
        raise ConflictError("This order can no longer be cancelled.")
    return transition_order(
        order=order, target_status=OrderStatus.CANCELLED, actor=actor, note=reason
    )
