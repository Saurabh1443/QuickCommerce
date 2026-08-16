"""Subscriber registry (observer pattern).

Handlers register themselves with ``@subscribe(EventType.X)``; the bus/worker only
calls ``dispatch``. A failing handler is logged and never breaks its siblings or the
request that produced the event.
"""
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

_HANDLERS = defaultdict(list)


def subscribe(*event_types):
    def decorator(func):
        for event_type in event_types:
            if func not in _HANDLERS[event_type]:
                _HANDLERS[event_type].append(func)
        return func

    return decorator


def handlers_for(event_type):
    return list(_HANDLERS.get(event_type, []))


def dispatch(event):
    """Run every handler subscribed to ``event.name``. Returns handlers executed."""
    executed = 0
    for handler in handlers_for(event.name):
        try:
            handler(event)
            executed += 1
        except Exception:  # noqa: BLE001 - one bad subscriber must not stop the rest
            logger.exception("Event handler %s failed for %s", handler.__name__, event.name)
    if not executed:
        logger.debug("No handlers registered for event %s", event.name)
    return executed


def clear_handlers():
    """Test helper."""
    _HANDLERS.clear()
