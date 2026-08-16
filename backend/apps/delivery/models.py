from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.orders.constants import OrderStatus


class DeliveryPartnerProfile(TimeStampedModel):
    """Everything specific to a delivery partner that a plain User doesn't need."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="delivery_profile"
    )
    vehicle_type = models.CharField(max_length=30, default="bike")
    vehicle_number = models.CharField(max_length=20, blank=True)
    licence_number = models.CharField(max_length=30, blank=True)
    is_approved = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    total_deliveries = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    class Meta(TimeStampedModel.Meta):
        indexes = [models.Index(fields=["is_online", "is_approved"])]

    def __str__(self):
        return f"DeliveryPartner({self.user.email})"


class DeliveryQuerySet(models.QuerySet):
    def for_partner(self, user):
        return self.filter(partner=user)

    def active(self):
        return self.exclude(
            status__in=(DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED)
        )


class DeliveryStatus(models.TextChoices):
    ASSIGNED = "ASSIGNED", "Assigned"
    ACCEPTED = "ACCEPTED", "Accepted"
    PICKED_UP = "PICKED_UP", "Picked up"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for delivery"
    DELIVERED = "DELIVERED", "Delivered"
    CANCELLED = "CANCELLED", "Cancelled"


# Maps a Delivery.status change onto the matching Order.status, keeping both in sync.
DELIVERY_TO_ORDER_STATUS = {
    DeliveryStatus.PICKED_UP: OrderStatus.PICKED_UP,
    DeliveryStatus.OUT_FOR_DELIVERY: OrderStatus.OUT_FOR_DELIVERY,
    DeliveryStatus.DELIVERED: OrderStatus.DELIVERED,
}


class Delivery(TimeStampedModel):
    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="delivery"
    )
    partner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="deliveries",
    )
    status = models.CharField(
        max_length=20, choices=DeliveryStatus.choices, default=DeliveryStatus.ASSIGNED
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    pickup_time = models.DateTimeField(null=True, blank=True)
    delivery_time = models.DateTimeField(null=True, blank=True)

    objects = DeliveryQuerySet.as_manager()

    class Meta(TimeStampedModel.Meta):
        indexes = [models.Index(fields=["partner", "status"])]

    def __str__(self):
        return f"Delivery({self.order.order_number}, {self.status})"
