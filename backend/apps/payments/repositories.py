"""All direct ORM access for Payment lives here."""
from apps.common.repositories import BaseRepository
from apps.payments.models import Payment


class PaymentRepository(BaseRepository):
    model = Payment

    @classmethod
    def for_order(cls, order):
        return cls.model.objects.filter(order=order).order_by("-created_at")

    @classmethod
    def get_pending_for_order(cls, order, statuses):
        return cls.for_order(order).filter(status__in=statuses).first()

    @classmethod
    def latest_for_order(cls, order):
        return cls.for_order(order).first()

    @classmethod
    def admin_recent(cls, limit=200):
        return cls.model.objects.select_related("order").order_by("-created_at")[:limit]
