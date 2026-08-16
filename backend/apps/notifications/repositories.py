"""All direct ORM access for Notification lives here."""
from apps.common.repositories import BaseRepository
from apps.notifications.models import Notification


class NotificationRepository(BaseRepository):
    model = Notification

    @classmethod
    def for_user(cls, user):
        return cls.model.objects.filter(user=user)
