"""Push notification channel stub — swap the body of `send()` for FCM/APNs later."""
import logging

from apps.notifications.channels.base import NotificationChannel

logger = logging.getLogger(__name__)


class PushChannel(NotificationChannel):
    name = "PUSH"

    def resolve_address(self, user):
        return getattr(user, "device_token", "") or ""

    def send(self, message):
        logger.info(
            "[PUSH stub] Would notify %s: %s — %s",
            self.resolve_address(message.to_user), message.subject, message.body,
        )
