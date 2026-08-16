"""All direct ORM access for DeliveryPartnerProfile/Delivery lives here."""
from django.db.models import Sum

from apps.common.repositories import BaseRepository
from apps.delivery.models import Delivery, DeliveryPartnerProfile


class DeliveryPartnerProfileRepository(BaseRepository):
    model = DeliveryPartnerProfile

    @classmethod
    def base_queryset(cls):
        return cls.model.objects.select_related("user")

    @classmethod
    def get_by_user(cls, user):
        return cls.model.objects.filter(user=user).first()

    @classmethod
    def get_or_create_for_user(cls, user):
        profile, _ = cls.model.objects.get_or_create(user=user)
        return profile

    @classmethod
    def admin_queryset(cls):
        return cls.base_queryset().order_by("-created_at")

    @classmethod
    def online_and_approved(cls):
        return cls.base_queryset().filter(is_online=True, is_approved=True)


class DeliveryRepository(BaseRepository):
    model = Delivery

    @classmethod
    def base_queryset(cls):
        return cls.model.objects.select_related("order", "order__shop", "order__customer", "partner")

    @classmethod
    def for_partner(cls, user):
        return cls.base_queryset().filter(partner=user).order_by("-created_at")

    @classmethod
    def active(cls, queryset):
        """Filter an existing Delivery queryset down to non-terminal deliveries."""
        return queryset.active()

    @classmethod
    def active_queryset(cls):
        return cls.base_queryset().active().order_by("-created_at")

    @classmethod
    def count_active_for_partner(cls, user):
        return cls.model.objects.for_partner(user).active().count()

    @classmethod
    def get_with_relations(cls, pk):
        return cls.base_queryset().filter(pk=pk).first()

    @classmethod
    def create_delivery(cls, **fields):
        return cls.model.objects.create(**fields)

    @classmethod
    def sum_order_delivery_fee(cls, **filters):
        return cls.model.objects.filter(**filters).aggregate(
            total=Sum("order__delivery_fee")
        )["total"] or 0
