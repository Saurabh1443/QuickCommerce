"""Consumes domain events from the Redis Stream and dispatches them to subscribers.

Run alongside the API server:

    python manage.py run_event_worker
"""
import signal
import time

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.events.bus import DomainEvent
from apps.events.registry import dispatch


class Command(BaseCommand):
    help = "Run the Redis Streams event worker (delivers notifications asynchronously)."

    def add_arguments(self, parser):
        parser.add_argument("--consumer", default="worker-1", help="Consumer name.")
        parser.add_argument("--block", type=int, default=9000, help="Block ms per read.")
        parser.add_argument("--count", type=int, default=20, help="Max events per read.")
        parser.add_argument(
            "--from-start",
            action="store_true",
            help="Create the group from the beginning of the stream (replays backlog).",
        )

    def handle(self, *args, **options):
        import redis

        stream = settings.EVENT_STREAM_NAME
        group = settings.EVENT_CONSUMER_GROUP
        consumer = options["consumer"]
        client = redis.Redis.from_url(settings.REDIS_URL)

        try:
            client.ping()
        except Exception as exc:  # noqa: BLE001
            raise SystemExit(
                f"Cannot reach Redis at {settings.REDIS_URL} ({exc}).\n"
                "Start Redis (`redis-server`) or set EVENT_BUS_BACKEND=sync in .env."
            )

        try:
            client.xgroup_create(
                stream, group, id="0" if options["from_start"] else "$", mkstream=True
            )
            self.stdout.write(self.style.SUCCESS(f"Created consumer group '{group}'."))
        except redis.ResponseError as exc:
            if "BUSYGROUP" not in str(exc):
                raise

        self._running = True

        def stop(*_):
            self._running = False
            self.stdout.write("\nShutting down event worker...")

        signal.signal(signal.SIGINT, stop)
        signal.signal(signal.SIGTERM, stop)

        self.stdout.write(
            self.style.SUCCESS(f"Event worker listening on '{stream}' as '{consumer}'.")
        )

        while self._running:
            try:
                batches = client.xreadgroup(
                    group, consumer, {stream: ">"},
                    count=options["count"], block=options["block"],
                )
            except Exception as exc:  # noqa: BLE001
                self.stderr.write(f"Read error: {exc}; retrying in 2s")
                time.sleep(2)
                continue

            for _stream_name, messages in batches or []:
                for message_id, data in messages:
                    event = DomainEvent.from_wire(data)
                    handled = dispatch(event)
                    client.xack(stream, group, message_id)
                    self.stdout.write(f"  {event.name} -> {handled} handler(s)")

        self.stdout.write(self.style.SUCCESS("Event worker stopped."))
