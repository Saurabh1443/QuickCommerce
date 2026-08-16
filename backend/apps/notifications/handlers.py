"""Domain event -> notification subscribers (observer pattern).

Each handler is small and declarative: pull a couple of fields out of the event
payload, render a short message, hand off to ``notify()``. None of this code knows or
cares which channels are actually enabled.
"""
import logging

from django.conf import settings

from apps.events.event_types import EventType
from apps.events.registry import subscribe
from apps.notifications.services import notify

logger = logging.getLogger(__name__)


def _user(user_id):
    from apps.accounts.repositories import UserRepository

    return UserRepository.get_by_id(user_id) if user_id else None


@subscribe(EventType.USER_REGISTERED)
def on_user_registered(event):
    payload = event.payload
    notify(
        user=_user(payload.get("user_id")),
        subject="Welcome to QuickCommerce!",
        body=f"Hi {payload.get('name')}, your account has been created successfully.",
        event_type=event.name,
        payload=payload,
    )


@subscribe(EventType.SHOP_SUBMITTED)
def on_shop_submitted(event):
    payload = event.payload
    notify(
        user=_user(payload.get("owner_id")),
        subject="Shop registration received",
        body=(
            f"Thanks for registering '{payload.get('shop_name')}'. Our team will "
            "review your details and approve your shop shortly."
        ),
        event_type=event.name,
        payload=payload,
    )
    notify(
        user=None,
        subject=f"New shop pending approval: {payload.get('shop_name')}",
        body=f"{payload.get('owner_name')} submitted a new shop in {payload.get('city')}.",
        event_type=event.name,
        payload={**payload, "email": settings.ADMIN_NOTIFICATION_EMAIL},
    )


@subscribe(EventType.SHOP_APPROVED)
def on_shop_approved(event):
    payload = event.payload
    notify(
        user=_user(payload.get("owner_id")),
        subject="Your shop has been approved 🎉",
        body=(
            f"'{payload.get('shop_name')}' is now live on QuickCommerce. You can start "
            "adding products right away."
        ),
        event_type=event.name,
        payload=payload,
    )


@subscribe(EventType.SHOP_REJECTED, EventType.SHOP_SUSPENDED)
def on_shop_rejected_or_suspended(event):
    payload = event.payload
    action = "rejected" if event.name == EventType.SHOP_REJECTED else "suspended"
    notify(
        user=_user(payload.get("owner_id")),
        subject=f"Update on your shop '{payload.get('shop_name')}'",
        body=f"Your shop was {action}. Reason: {payload.get('reason') or 'Not specified.'}",
        event_type=event.name,
        payload=payload,
    )


@subscribe(EventType.ORDER_PLACED)
def on_order_placed(event):
    payload = event.payload
    notify(
        user=_user(payload.get("customer_id")),
        subject=f"Order confirmed — {payload.get('order_number')}",
        body=(
            f"Your order at {payload.get('shop_name')} for ₹{payload.get('total_amount')} "
            "has been placed."
        ),
        event_type=event.name,
        payload=payload,
    )
    shop_email = payload.get("shop_owner_email")
    if shop_email:
        notify(
            user=None,
            subject=f"New order — {payload.get('order_number')}",
            body=f"You have a new order from {payload.get('customer_name')}.",
            event_type=event.name,
            payload={**payload, "email": shop_email},
        )


@subscribe(EventType.ORDER_STATUS_CHANGED)
def on_order_status_changed(event):
    payload = event.payload
    notify(
        user=None,
        subject=f"Order {payload.get('order_number')} update",
        body=f"Your order is now: {payload.get('to_status', '').replace('_', ' ').title()}.",
        event_type=event.name,
        payload={**payload, "email": payload.get("customer_email")},
    )


@subscribe(EventType.ORDER_CANCELLED)
def on_order_cancelled(event):
    payload = event.payload
    notify(
        user=None,
        subject=f"Order {payload.get('order_number')} cancelled",
        body=f"Reason: {payload.get('note') or 'Not specified.'}",
        event_type=event.name,
        payload={**payload, "email": payload.get("customer_email")},
    )


@subscribe(EventType.ORDER_DELIVERED)
def on_order_delivered(event):
    payload = event.payload
    notify(
        user=None,
        subject=f"Order {payload.get('order_number')} delivered",
        body=f"Enjoy your order from {payload.get('shop_name')}! Thanks for shopping with us.",
        event_type=event.name,
        payload={**payload, "email": payload.get("customer_email")},
    )


@subscribe(EventType.PAYMENT_SUCCEEDED)
def on_payment_succeeded(event):
    payload = event.payload
    notify(
        user=None,
        subject=f"Payment received — {payload.get('order_number')}",
        body=f"We received your payment of ₹{payload.get('amount')}. Thank you!",
        event_type=event.name,
        payload={**payload, "email": payload.get("customer_email")},
    )


@subscribe(EventType.PAYMENT_FAILED)
def on_payment_failed(event):
    payload = event.payload
    notify(
        user=None,
        subject=f"Payment failed — {payload.get('order_number')}",
        body=f"Your payment could not be verified: {payload.get('reason') or 'unknown error.'}",
        event_type=event.name,
        payload={**payload, "email": payload.get("customer_email")},
    )


@subscribe(EventType.DELIVERY_ASSIGNED)
def on_delivery_assigned(event):
    payload = event.payload
    notify(
        user=_user(payload.get("partner_id")),
        subject=f"New delivery assigned — {payload.get('order_number')}",
        body=f"Pick up an order from {payload.get('shop_name')}.",
        event_type=event.name,
        payload=payload,
    )
