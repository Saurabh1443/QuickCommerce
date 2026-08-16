"""Payment orchestration: the only place order.payment_status is mutated."""
from django.db import transaction

from apps.common.exceptions import DomainError, PaymentError
from apps.events.bus import publish
from apps.events.event_types import EventType
from apps.orders.constants import PaymentStatus
from apps.orders.repositories import OrderRepository
from apps.payments.constants import PaymentTransactionStatus
from apps.payments.registry import gateway_for_method
from apps.payments.repositories import PaymentRepository


@transaction.atomic
def initiate_payment(*, order, actor):
    """Create (or reuse) a payment attempt and ask the gateway for checkout data."""
    if order.customer_id != actor.id and actor.role != "ADMIN":
        raise DomainError("You cannot pay for another customer's order.")
    if order.payment_status == PaymentStatus.PAID:
        raise DomainError("This order has already been paid for.")

    gateway = gateway_for_method(order.payment_method)
    payment = PaymentRepository.get_pending_for_order(
        order, (PaymentTransactionStatus.CREATED, PaymentTransactionStatus.PENDING)
    )
    if not payment:
        payment = PaymentRepository.create(
            order=order, gateway=gateway.name, method=order.payment_method,
            amount=order.total_amount,
        )

    result = gateway.create_order(payment=payment)
    payment = PaymentRepository.update(
        payment,
        gateway_order_id=result.gateway_order_id,
        status=PaymentTransactionStatus.PENDING,
    )

    transaction.on_commit(
        lambda: publish(
            EventType.PAYMENT_INITIATED,
            order_id=order.id, order_number=order.order_number,
            gateway=gateway.name, amount=str(order.total_amount),
        )
    )

    if order.payment_method == "COD":
        # COD has nothing for the frontend to render; verify immediately so the order
        # simply proceeds with PAYMENT_STATUS=PENDING until delivery.
        return payment, None

    return payment, result


@transaction.atomic
def verify_payment(*, order, actor, verification_data):
    if order.customer_id != actor.id and actor.role != "ADMIN":
        raise DomainError("You cannot verify payment for another customer's order.")

    payment = PaymentRepository.latest_for_order(order)
    if not payment:
        raise DomainError("No payment attempt found for this order. Initiate payment first.")

    gateway = gateway_for_method(order.payment_method)
    result = gateway.verify_payment(payment=payment, verification_data=verification_data)

    if result.success:
        payment = PaymentRepository.update(
            payment,
            gateway_payment_id=result.gateway_payment_id,
            status=PaymentTransactionStatus.SUCCESS,
            raw_response=result.raw_response,
        )
        order = OrderRepository.update(order, payment_status=PaymentStatus.PAID)
        transaction.on_commit(
            lambda: publish(
                EventType.PAYMENT_SUCCEEDED,
                order_id=order.id, order_number=order.order_number,
                customer_email=order.customer.email, amount=str(order.total_amount),
            )
        )
        return payment

    payment = PaymentRepository.update(
        payment,
        status=PaymentTransactionStatus.FAILED,
        error_description=result.error_description,
        raw_response=result.raw_response,
    )
    order = OrderRepository.update(order, payment_status=PaymentStatus.FAILED)
    transaction.on_commit(
        lambda: publish(
            EventType.PAYMENT_FAILED,
            order_id=order.id, order_number=order.order_number,
            customer_email=order.customer.email, reason=result.error_description,
        )
    )
    raise PaymentError(result.error_description or "Payment verification failed.")
