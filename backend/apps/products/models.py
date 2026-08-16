from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel

LOW_STOCK_THRESHOLD = 5


class ProductQuerySet(models.QuerySet):
    def orderable(self):
        """Available, in-stock products belonging to approved shops."""
        return self.filter(
            is_available=True, stock_quantity__gt=0, shop__status="APPROVED"
        )


class Product(TimeStampedModel):
    shop = models.ForeignKey("shops.Shop", on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(
        "catalog.Category", on_delete=models.PROTECT, related_name="products"
    )
    name = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Selling price when on offer. Must be lower than price.",
    )
    unit = models.CharField(max_length=40, default="1 pc", help_text="e.g. 500 ml, 1 kg.")
    stock_quantity = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_available = models.BooleanField(default=True)

    objects = ProductQuerySet.as_manager()

    class Meta(TimeStampedModel.Meta):
        constraints = [
            models.UniqueConstraint(fields=["shop", "name", "unit"],
                                    name="unique_product_per_shop"),
        ]
        indexes = [
            models.Index(fields=["shop", "is_available"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.unit}) @ {self.shop.name}"

    @property
    def effective_price(self):
        """The price a customer actually pays — the only price the backend trusts."""
        if self.discount_price and self.discount_price < self.price:
            return self.discount_price
        return self.price

    @property
    def discount_percent(self):
        if self.discount_price and self.discount_price < self.price:
            return int(round((self.price - self.discount_price) / self.price * 100))
        return 0

    @property
    def in_stock(self):
        return self.is_available and self.stock_quantity > 0

    @property
    def is_low_stock(self):
        return 0 < self.stock_quantity <= LOW_STOCK_THRESHOLD
