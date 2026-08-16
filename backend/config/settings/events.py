"""Redis Streams and event bus settings."""

from .base import env, env_bool


REDIS_URL = env(
    "REDIS_URL",
    "redis://127.0.0.1:6379/0",
)


EVENT_BUS_BACKEND = env(
    "EVENT_BUS_BACKEND",
    "redis",
)
# redis | sync | dummy


EVENT_STREAM_NAME = env(
    "EVENT_STREAM_NAME",
    "quickcommerce.events",
)


EVENT_CONSUMER_GROUP = env(
    "EVENT_CONSUMER_GROUP",
    "quickcommerce-workers",
)


EVENT_BUS_FALLBACK_SYNC = env_bool(
    "EVENT_BUS_FALLBACK_SYNC",
    True,
)