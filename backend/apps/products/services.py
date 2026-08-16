"""Product business logic. No ORM calls here — everything goes through
``ProductRepository`` (and, for shop resolution, ``ShopRepository``).
"""
from apps.accounts.constants import Role
from apps.common.exceptions import DomainError
from apps.products.repositories import ProductRepository
from apps.shops.repositories import ShopRepository


def list_public_products(*, shop=None, category=None, search=None, in_stock=False):
    queryset = ProductRepository.public_queryset()
    if shop:
        queryset = ProductRepository.by_shop(queryset, shop)
    if category:
        queryset = ProductRepository.by_category(queryset, category)
    if search:
        queryset = ProductRepository.search(queryset, search)
    if in_stock:
        queryset = ProductRepository.in_stock(queryset)
    return queryset.order_by("category__sort_order", "name")


def list_managed_products(user):
    return ProductRepository.managed_queryset_for(user)


def resolve_shop_for_product_write(user, requested_shop_id=None):
    """Decide which shop a create/update should apply to.

    Shopkeepers are always pinned to their own (approved) shop; admins must specify
    a shop explicitly. A forged ``shop`` id in a shopkeeper's payload can never move
    a product into somebody else's shop because this function ignores it entirely.
    """
    if user.role == Role.SHOPKEEPER:
        shop = ShopRepository.get_by_owner(user)
        if not shop:
            raise DomainError("No shop is linked to this account.")
        if not shop.is_approved:
            raise DomainError(
                "Your shop is awaiting approval; you can add products once approved."
            )
        return shop
    if not requested_shop_id:
        raise DomainError("Admins must specify which shop the product belongs to.")
    shop = ShopRepository.get_by_id(requested_shop_id)
    if not shop:
        raise DomainError("Shop not found.")
    return shop


def update_stock(product, stock_quantity):
    if stock_quantity < 0:
        raise DomainError("Stock cannot be negative.")
    return ProductRepository.update(product, stock_quantity=stock_quantity)


def toggle_availability(product):
    return ProductRepository.update(product, is_available=not product.is_available)
