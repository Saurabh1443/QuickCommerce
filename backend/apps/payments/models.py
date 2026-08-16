from django.db import models

from apps.common.models import TimeStampedModel
from apps.payments.constants import PaymentTransactionStatus


class Payment(TimeStampedModel):
    """One row per payment attempt. COD orders get a single CREATED->SUCCESS record too,
    so payments history stays consistent regardless of the method used.
    """

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="payments"
    )
    gateway = models.CharField(max_length=20, help_text="RAZORPAY, COD, STRIPE, ...")
    method = models.CharField(max_length=10, help_text="ONLINE or COD")

    gateway_order_id = models.CharField(max_length=80, blank=True, db_index=True)
    gateway_payment_id = models.CharField(max_length=80, blank=True, db_index=True)
    signature = models.CharField(max_length=255, blank=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=6, default="INR")
    status = models.CharField(
        max_length=12, choices=PaymentTransactionStatus.choices,
        default=PaymentTransactionStatus.CREATED, db_index=True,
    )
    error_code = models.CharField(max_length=60, blank=True)
    error_description = models.CharField(max_length=255, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)

    class Meta(TimeStampedModel.Meta):
        indexes = [models.Index(fields=["order", "status"])]

    def __str__(self):
        return f"Payment({self.order.order_number}, {self.gateway}, {self.status})"
