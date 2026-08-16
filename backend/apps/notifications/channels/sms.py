"""SMS/OTP channel stub — swap the body of `send()` for an SMS gateway later."""
import logging

from apps.notifications.channels.base import NotificationChannel

logger = logging.getLogger(__name__)


class SmsChannel(NotificationChannel):
    name = "SMS"

    def resolve_address(self, user):
        return getattr(user, "phone", "") or ""

    def send(self, message):
        logger.info(
            "[SMS stub] Would text %s: %s",
            self.resolve_address(message.to_user), message.body,
        )
