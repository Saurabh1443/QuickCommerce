"""Event bus with pluggable backends.

``redis`` is the default: events go onto a Redis Stream and a separate worker process
(``python manage.py run_event_worker``) consumes them, so slow work like sending email
never blocks an API response. If Redis is unreachable the bus degrades to synchronous
dispatch instead of losing the event, which keeps local development friction-free.
"""
import json
import logging
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone

from django.conf import settings
from django.utils.functional import SimpleLazyObject

from apps.events import registry

logger = logging.getLogger(__name__)


@dataclass
class DomainEvent:
    name: str
    payload: dict = field(default_factory=dict)
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    occurred_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_wire(self):
        return {
            "event_id": self.event_id,
            "name": self.name,
            "occurred_at": self.occurred_at,
            "payload": json.dumps(self.payload, default=str),
        }

    @classmethod
    def from_wire(cls, data):
        def decode(value):
            return value.decode() if isinstance(value, bytes) else value

        data = {decode(k): decode(v) for k, v in data.items()}
        return cls(
            name=data.get("name", ""),
            payload=json.loads(data.get("payload") or "{}"),
            event_id=data.get("event_id") or str(uuid.uuid4()),
            occurred_at=data.get("occurred_at") or "",
        )


class BaseEventBus(ABC):
    @abstractmethod
    def publish(self, event: DomainEvent):
        """Hand the event off for processing."""


class SyncEventBus(BaseEventBus):
    """Dispatches in-process. Useful for tests and when Redis is not running."""

    def publish(self, event):
        logger.debug("Dispatching %s synchronously", event.name)
        registry.dispatch(event)
        return event.event_id


class DummyEventBus(BaseEventBus):
    """Drops events (used to silence notifications during data seeding)."""

    def publish(self, event):
        logger.debug("Dropping event %s (dummy bus)", event.name)
        return None


class RedisStreamEventBus(BaseEventBus):
    def __init__(self, url=None, stream=None, fallback_sync=None):
        self.url = url or settings.REDIS_URL
        self.stream = stream or settings.EVENT_STREAM_NAME
        self.fallback_sync = (
            settings.EVENT_BUS_FALLBACK_SYNC if fallback_sync is None else fallback_sync
        )
        self._client = None

    @property
    def client(self):
        if self._client is None:
            import redis  # imported lazily so the app boots without a Redis server

            self._client = redis.Redis.from_url(
                self.url, socket_connect_timeout=2, socket_timeout=2
            )
        return self._client

    def publish(self, event):
        try:
            message_id = self.client.xadd(self.stream, event.to_wire(), maxlen=10000,
                                          approximate=True)
            logger.info("Published %s to %s (%s)", event.name, self.stream, message_id)
            return message_id.decode() if isinstance(message_id, bytes) else message_id
        except Exception as exc:  # noqa: BLE001 - never fail a request because of the bus
            logger.warning("Redis publish failed for %s (%s)", event.name, exc)
            if self.fallback_sync:
                registry.dispatch(event)
            return None


_BACKENDS = {
    "redis": RedisStreamEventBus,
    "sync": SyncEventBus,
    "dummy": DummyEventBus,
}


def build_event_bus():
    backend = str(getattr(settings, "EVENT_BUS_BACKEND", "redis")).lower()
    bus_class = _BACKENDS.get(backend, RedisStreamEventBus)
    logger.debug("Using event bus backend: %s", bus_class.__name__)
    return bus_class()


event_bus = SimpleLazyObject(build_event_bus)


def publish(event_type, **payload):
    """Convenience producer API used across the service layer."""
    return event_bus.publish(DomainEvent(name=event_type, payload=payload))
