from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Cart(TimeStampedModel):
    """One active cart per customer, holding items from a single shop (MVP rule)."""

    customer = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    shop = models.ForeignKey(
        "shops.Shop", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="carts",
    )

    def __str__(self):
        return f"Cart({self.customer.email})"

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())

    # Clearing a cart (deleting items + detaching the shop) is a business operation,
    # not a passive read — it lives in apps.carts.repositories.CartRepository.clear()
    # and is invoked from apps.carts.services, not from here.


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta(TimeStampedModel.Meta):
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="unique_cart_product"),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    @property
    def unit_price(self):
        """Always read live from the product; the client never supplies prices."""
        return self.product.effective_price

    @property
    def total_price(self):
        return self.unit_price * self.quantity
