"""WhatsApp channel stub — swap the body of `send()` for the WhatsApp Business API."""
import logging

from apps.notifications.channels.base import NotificationChannel

logger = logging.getLogger(__name__)


class WhatsAppChannel(NotificationChannel):
    name = "WHATSAPP"

    def resolve_address(self, user):
        return getattr(user, "phone", "") or ""

    def send(self, message):
        logger.info(
            "[WHATSAPP stub] Would message %s: %s",
            self.resolve_address(message.to_user), message.body,
        )
