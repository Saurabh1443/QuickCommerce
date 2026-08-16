from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsPlatformAdmin
from apps.notifications.repositories import NotificationRepository
from apps.notifications.serializers import NotificationSerializer


class MyNotificationsView(ListAPIView):
    """GET /api/notifications/ — the caller's own notification history."""

    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return NotificationRepository.for_user(self.request.user)


class AdminNotificationListView(ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (IsPlatformAdmin,)
    filterset_fields = ("channel", "status", "event_type")

    def get_queryset(self):
        return NotificationRepository.all()
