"""Notification and email settings."""

from .base import env, env_bool, env_list


NOTIFICATION_CHANNELS = {
    "EMAIL":
        "apps.notifications.channels.email.EmailChannel",

    "PUSH":
        "apps.notifications.channels.push.PushChannel",

    "WHATSAPP":
        "apps.notifications.channels.whatsapp.WhatsAppChannel",

    "SMS":
        "apps.notifications.channels.sms.SmsChannel",
}


NOTIFICATION_ENABLED_CHANNELS = env_list(
    "NOTIFICATION_ENABLED_CHANNELS",
    "EMAIL",
)


# ----------------------------------------------------------------------
# Email
# ----------------------------------------------------------------------

EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)

EMAIL_HOST = env(
    "EMAIL_HOST",
    "smtp.gmail.com",
)

EMAIL_PORT = int(
    env("EMAIL_PORT", "587")
)

EMAIL_USE_TLS = env_bool(
    "EMAIL_USE_TLS",
    True,
)

EMAIL_HOST_USER = env(
    "EMAIL_HOST_USER",
    "",
)

EMAIL_HOST_PASSWORD = env(
    "EMAIL_HOST_PASSWORD",
    "",
)

DEFAULT_FROM_EMAIL = env(
    "DEFAULT_FROM_EMAIL",
    "QuickCommerce <no-reply@quickcommerce.local>",
)

ADMIN_NOTIFICATION_EMAIL = env(
    "ADMIN_NOTIFICATION_EMAIL",
    "admin@quickcommerce.local",
)