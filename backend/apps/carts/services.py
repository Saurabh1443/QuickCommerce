"""Cart business rules. No ORM calls here — everything goes through the repositories."""
from django.db import transaction

from apps.carts import pricing
from apps.carts.repositories import CartItemRepository, CartRepository
from apps.common.exceptions import ConflictError, DomainError
from apps.products.repositories import ProductRepository


class DifferentShopError(ConflictError):
    """Raised when the customer adds a product from a shop other than the cart's shop."""

    default_code = "different_shop"


def get_or_create_cart(customer):
    return CartRepository.get_or_create_for_customer(customer)


def _validate_orderable(product, quantity):
    if not product.shop.is_approved:
        raise DomainError("This shop is not currently accepting orders.")
    if not product.is_available:
        raise DomainError(f"{product.name} is currently unavailable.")
    if quantity < 1:
        raise DomainError("Quantity must be at least 1.")
    if quantity > product.stock_quantity:
        raise DomainError(
            f"Only {product.stock_quantity} unit(s) of {product.name} left in stock."
        )


@transaction.atomic
def add_item(*, customer, product_id, quantity=1, replace_cart=False):
    """Add/increment a cart line, enforcing the one-shop-per-cart rule."""
    product = ProductRepository.get_with_shop(product_id)
    if not product:
        raise DomainError("Product not found.")

    cart = get_or_create_cart(customer)
    if cart.shop_id and cart.shop_id != product.shop_id and CartItemRepository.exists_for_cart(cart):
        if not replace_cart:
            raise DifferentShopError(
                "Your cart contains products from another shop. Clear the cart to add "
                "this product."
            )
        cart = CartRepository.clear(cart)

    item = CartItemRepository.get_by_product(cart, product)
    new_quantity = (item.quantity if item else 0) + quantity
    _validate_orderable(product, new_quantity)

    if item:
        CartItemRepository.update(item, quantity=new_quantity)
    else:
        CartItemRepository.create_item(cart, product, new_quantity)

    if cart.shop_id != product.shop_id:
        cart = CartRepository.update(cart, shop=product.shop)
    return cart


@transaction.atomic
def set_item_quantity(*, customer, item_id, quantity):
    cart = get_or_create_cart(customer)
    item = CartItemRepository.get_for_cart(cart, item_id)
    if not item:
        raise DomainError("Cart item not found.")

    if quantity <= 0:
        CartItemRepository.delete(item)
    else:
        _validate_orderable(item.product, quantity)
        CartItemRepository.update(item, quantity=quantity)

    if not CartItemRepository.exists_for_cart(cart):
        cart = CartRepository.clear(cart)
    return cart


def remove_item(*, customer, item_id):
    return set_item_quantity(customer=customer, item_id=item_id, quantity=0)


def clear_cart(customer):
    return CartRepository.clear(get_or_create_cart(customer))


def validate_cart_for_checkout(cart):
    """Re-check availability and stock at checkout time, not just at add-to-cart time."""
    if not cart.shop_id or not CartItemRepository.exists_for_cart(cart):
        raise DomainError("Your cart is empty.")
    if not cart.shop.is_approved:
        raise DomainError("This shop is no longer available.")
    if not cart.shop.is_accepting_orders:
        raise DomainError("This shop has paused new orders.")

    problems = []
    for item in CartItemRepository.for_cart_with_products(cart):
        product = item.product
        if not product.is_available:
            problems.append(f"{product.name} is no longer available.")
        elif item.quantity > product.stock_quantity:
            problems.append(
                f"Only {product.stock_quantity} unit(s) of {product.name} left."
            )
    if problems:
        raise DomainError(" ".join(problems))
    return cart


def line_items_from_cart(cart):
    """Snapshot of a cart's lines with server-trusted prices, for pricing/checkout."""
    return [
        {
            "product": item.product,
            "quantity": item.quantity,
            "unit_price": pricing.money(item.unit_price),
            "total_price": pricing.money(item.total_price),
        }
        for item in CartItemRepository.for_cart_with_products(cart)
    ]


def get_cart_totals(cart, discount=0):
    if not cart.shop_id:
        return pricing.calculate([], None, discount)
    return pricing.calculate(line_items_from_cart(cart), cart.shop, discount)
