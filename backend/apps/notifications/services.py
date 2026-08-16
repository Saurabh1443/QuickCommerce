"""Sends a notification through every enabled channel and records the outcome.

Handlers never import a channel directly — they call ``notify()`` and the enabled
channel list comes from settings, so turning on Push/WhatsApp later needs no handler
changes.
"""
import logging

from django.utils import timezone

from apps.notifications.channels.base import NotificationMessage
from apps.notifications.models import NotificationStatus
from apps.notifications.registry import enabled_channels, get_channel
from apps.notifications.repositories import NotificationRepository

logger = logging.getLogger(__name__)


def notify(*, user=None, subject, body, event_type, payload=None, channels=None):
    """Fan a single logical notification out to every enabled channel."""
    payload = payload or {}
    channel_instances = [get_channel(c) for c in channels] if channels else enabled_channels()
    message = NotificationMessage(
        to_user=user, subject=subject, body=body, event_type=event_type, payload=payload
    )

    records = []
    for channel in channel_instances:
        fields = dict(
            user=user, channel=channel.name, event_type=event_type,
            subject=subject, body=body, payload=payload,
        )
        try:
            fields["recipient_address"] = channel.resolve_address(user) if user else \
                payload.get("email", "")
            channel.send(message)
            fields["status"] = NotificationStatus.SENT
            fields["sent_at"] = timezone.now()
        except Exception as exc:  # noqa: BLE001 - a broken channel must not break others
            logger.warning("Notification via %s failed: %s", channel.name, exc)
            fields["status"] = NotificationStatus.FAILED
            fields["error"] = str(exc)
        records.append(NotificationRepository.create(**fields))
    return records
