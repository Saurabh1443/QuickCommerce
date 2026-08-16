from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"
    verbose_name = "Notifications"

    def ready(self):
        # Registers the domain-event -> notification subscribers (observer pattern).
        from apps.notifications import handlers  # noqa: F401
