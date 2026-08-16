from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id", "channel", "event_type", "subject", "body", "status", "error",
            "sent_at", "created_at",
        )
