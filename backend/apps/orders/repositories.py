"""All direct ORM access for Order/OrderItem/OrderStatusEvent lives here."""
from django.db.models import Count, Sum

from apps.common.repositories import BaseRepository
from apps.orders.constants import OrderStatus
from apps.orders.models import Order, OrderItem, OrderStatusEvent


class OrderRepository(BaseRepository):
    model = Order

    @classmethod
    def for_user(cls, user):
        """Row-level scoping used by every order API — never trust client-side filters."""
        return cls.model.objects.for_user(user).with_relations()

    @classmethod
    def get_for_user(cls, user, pk):
        return cls.for_user(user).filter(pk=pk).first()

    @classmethod
    def get_for_update(cls, pk):
        """Row-locked read used inside atomic status/stock-mutating transactions."""
        return cls.model.objects.select_for_update().get(pk=pk)

    @classmethod
    def get_with_shop(cls, pk):
        return cls.model.objects.select_related("shop").filter(pk=pk).first()

    @classmethod
    def create_order(cls, **fields):
        return cls.model.objects.create(**fields)

    @classmethod
    def ready_for_assignment(cls):
        """READY_FOR_PICKUP orders that don't have a delivery yet."""
        return cls.model.objects.filter(
            status=OrderStatus.READY_FOR_PICKUP, delivery__isnull=True
        ).select_related("shop", "customer")

    @classmethod
    def sum_total_amount(cls, **filters):
        return cls.model.objects.filter(**filters).aggregate(total=Sum("total_amount"))["total"] or 0

    @classmethod
    def status_breakdown(cls):
        return list(
            cls.model.objects.values("status").annotate(count=Count("id")).order_by("status")
        )


class OrderItemRepository(BaseRepository):
    model = OrderItem

    @classmethod
    def create_item(cls, **fields):
        return cls.model.objects.create(**fields)


class OrderStatusEventRepository(BaseRepository):
    model = OrderStatusEvent

    @classmethod
    def create_event(cls, **fields):
        return cls.model.objects.create(**fields)
