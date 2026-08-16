from django.contrib import admin

from apps.notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("event_type", "channel", "recipient_address", "status", "created_at")
    list_filter = ("channel", "status", "event_type")
    search_fields = ("recipient_address", "subject")
