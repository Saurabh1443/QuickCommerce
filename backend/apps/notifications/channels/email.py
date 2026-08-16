from django.conf import settings
from django.core.mail import send_mail

from apps.notifications.channels.base import NotificationChannel


class EmailChannel(NotificationChannel):
    name = "EMAIL"

    def resolve_address(self, user):
        return getattr(user, "email", "") or ""

    def send(self, message):
        address = self.resolve_address(message.to_user) if message.to_user else \
            message.payload.get("email", "")
        if not address:
            raise ValueError("No email address available for this notification.")
        send_mail(
            subject=message.subject,
            message=message.body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[address],
            fail_silently=False,
        )
