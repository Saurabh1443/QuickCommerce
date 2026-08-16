from functools import lru_cache

from django.conf import settings
from django.utils.module_loading import import_string


@lru_cache(maxsize=None)
def _load_channel_class(dotted_path):
    return import_string(dotted_path)


def get_channel(key):
    key = (key or "").upper()
    mapping = settings.NOTIFICATION_CHANNELS
    if key not in mapping:
        raise ValueError(f"Unknown notification channel '{key}'.")
    return _load_channel_class(mapping[key])()


def enabled_channels():
    return [get_channel(key) for key in settings.NOTIFICATION_ENABLED_CHANNELS]
