import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel
from apps.orders.constants import (
    ACTIVE_STATUSES,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
)


def generate_order_number():
    """Short, human-quotable identifier: QC-<yymmdd>-<random>."""
    stamp = timezone.localtime().strftime("%y%m%d")
    for _ in range(10):
        candidate = f"QC-{stamp}-{secrets.randbelow(90000) + 10000}"
        if not Order.objects.filter(order_number=candidate).exists():
            return candidate
    return f"QC-{stamp}-{secrets.token_hex(4).upper()}"


class OrderQuerySet(models.QuerySet):
    def active(self):
        return self.filter(status__in=ACTIVE_STATUSES)

    def for_user(self, user):
        """Row-level scoping used by every order API — never trust client-side filters."""
        from apps.accounts.constants import Role

        if user.role == Role.ADMIN:
            return self
        if user.role == Role.CUSTOMER:
            return self.filter(customer=user)
        if user.role == Role.SHOPKEEPER:
            return self.filter(shop__owner=user)
        if user.role == Role.DELIVERY_PARTNER:
            return self.filter(delivery_partner=user)
        return self.none()

    def with_relations(self):
        return self.select_related(
            "customer", "shop", "shop__owner", "delivery_partner"
        ).prefetch_related("items", "status_events")


class Order(TimeStampedModel):
    order_number = models.CharField(max_length=24, unique=True, default=generate_order_number,
                                    editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders"
    )
    shop = models.ForeignKey("shops.Shop", on_delete=models.PROTECT, related_name="orders")
    delivery_partner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_orders",
    )

    # Address snapshot: the order must stay accurate even if the address is edited later.
    contact_name = models.CharField(max_length=120)
    contact_phone = models.CharField(max_length=10)
    address_line = models.CharField(max_length=255)
    landmark = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    pincode = models.CharField(max_length=6)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PLACED, db_index=True
    )
    payment_status = models.CharField(
        max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING,
        db_index=True,
    )
    payment_method = models.CharField(
        max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.ONLINE
    )

    customer_note = models.CharField(max_length=255, blank=True)
    cancel_reason = models.CharField(max_length=255, blank=True)
    eta_minutes = models.PositiveIntegerField(default=40)
    delivered_at = models.DateTimeField(null=True, blank=True)

    objects = OrderQuerySet.as_manager()

    class Meta(TimeStampedModel.Meta):
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["shop", "status"]),
            models.Index(fields=["customer", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.order_number} ({self.status})"

    @property
    def full_address(self):
        parts = [self.address_line, self.landmark, self.city, self.state, self.pincode]
        return ", ".join(part for part in parts if part)

    @property
    def is_active(self):
        return self.status in ACTIVE_STATUSES

    @property
    def is_cod(self):
        return self.payment_method == PaymentMethod.COD

    @property
    def is_paid(self):
        return self.payment_status == PaymentStatus.PAID

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())


class OrderItem(TimeStampedModel):
    """Price/name snapshot so historical orders stay correct when products change."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="order_items",
    )
    product_name = models.CharField(max_length=180)
    unit = models.CharField(max_length=40, blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta(TimeStampedModel.Meta):
        ordering = ("id",)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"


class OrderStatusEvent(TimeStampedModel):
    """Audit trail powering the order tracking timeline."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_events")
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    changed_by_role = models.CharField(max_length=20, blank=True)
    note = models.CharField(max_length=255, blank=True)

    class Meta(TimeStampedModel.Meta):
        ordering = ("created_at", "id")

    def __str__(self):
        return f"{self.order.order_number}: {self.from_status} -> {self.to_status}"
