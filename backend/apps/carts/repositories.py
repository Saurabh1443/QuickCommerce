"""All direct ORM access for Cart/CartItem lives here."""
from apps.carts.models import Cart, CartItem
from apps.common.repositories import BaseRepository


class CartItemRepository(BaseRepository):
    model = CartItem

    @classmethod
    def for_cart(cls, cart):
        return cls.model.objects.filter(cart=cart)

    @classmethod
    def for_cart_with_products(cls, cart):
        return cls.for_cart(cart).select_related("product")

    @classmethod
    def get_for_cart(cls, cart, item_id):
        return cls.for_cart(cart).select_related("product").filter(pk=item_id).first()

    @classmethod
    def get_by_product(cls, cart, product):
        return cls.for_cart(cart).filter(product=product).first()

    @classmethod
    def create_item(cls, cart, product, quantity):
        return cls.model.objects.create(cart=cart, product=product, quantity=quantity)

    @classmethod
    def delete_all_for_cart(cls, cart):
        cls.for_cart(cart).delete()

    @classmethod
    def exists_for_cart(cls, cart):
        return cls.for_cart(cart).exists()

    @classmethod
    def total_quantity_for_cart(cls, cart):
        return sum(item.quantity for item in cls.for_cart(cart))


class CartRepository(BaseRepository):
    model = Cart

    @classmethod
    def get_or_create_for_customer(cls, customer):
        cart, _ = cls.model.objects.get_or_create(customer=customer)
        return cart

    @classmethod
    def clear(cls, cart):
        """Empty a cart: delete every line item and detach it from its shop."""
        CartItemRepository.delete_all_for_cart(cart)
        return cls.update(cart, shop=None)

    @classmethod
    def refresh(cls, cart):
        cart.refresh_from_db()
        return cart
