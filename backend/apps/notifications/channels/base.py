"""Notification channel strategy contract.

`NotificationService` (in `apps.notifications.services`) depends only on this
interface. Email is implemented today; Push/WhatsApp/SMS are stubs that log instead of
sending, so wiring in FCM/Twilio/WhatsApp Business API later is: implement `send()` in
the matching class, no changes anywhere else.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class NotificationMessage:
    to_user: object
    subject: str
    body: str
    event_type: str
    payload: dict


class NotificationChannel(ABC):
    name: str = "BASE"

    @abstractmethod
    def resolve_address(self, user) -> str:
        """The destination (email address / phone / device token) for this channel."""

    @abstractmethod
    def send(self, message: NotificationMessage) -> None:
        """Deliver the message. Raise on failure; the caller records the outcome."""
