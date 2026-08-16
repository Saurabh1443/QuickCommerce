from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class NotificationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    SENT = "SENT", "Sent"
    FAILED = "FAILED", "Failed"
    SKIPPED = "SKIPPED", "Skipped"


class Notification(TimeStampedModel):
    """One row per (recipient, channel) attempt — an audit trail, not a queue."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications",
        null=True, blank=True,
    )
    recipient_address = models.CharField(
        max_length=255, blank=True, help_text="Email/phone/token actually used."
    )
    channel = models.CharField(max_length=20, help_text="EMAIL, PUSH, WHATSAPP, SMS")
    event_type = models.CharField(max_length=60, db_index=True)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    status = models.CharField(
        max_length=10, choices=NotificationStatus.choices, default=NotificationStatus.PENDING
    )
    error = models.CharField(max_length=255, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta(TimeStampedModel.Meta):
        indexes = [models.Index(fields=["channel", "status"])]

    def __str__(self):
        return f"{self.channel}:{self.event_type} -> {self.recipient_address} ({self.status})"
