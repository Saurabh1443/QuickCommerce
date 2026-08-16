"""Delivery partner onboarding, availability, assignment and delivery lifecycle."""
from django.db import transaction
from django.utils import timezone

from apps.accounts.constants import Role
from apps.accounts.services import register_user
from apps.common.exceptions import ConflictError, DomainError
from apps.delivery.models import DELIVERY_TO_ORDER_STATUS
from apps.delivery.models import DeliveryStatus as DS
from apps.delivery.repositories import DeliveryPartnerProfileRepository, DeliveryRepository
from apps.events.bus import publish
from apps.events.event_types import EventType
from apps.orders.constants import OrderStatus
from apps.orders.repositories import OrderRepository, OrderStatusEventRepository

# Which role may drive each Delivery.status transition.
_TRANSITIONS = {
    (DS.ASSIGNED, DS.ACCEPTED): (Role.DELIVERY_PARTNER, Role.ADMIN),
    (DS.ASSIGNED, DS.CANCELLED): (Role.ADMIN,),
    (DS.ACCEPTED, DS.PICKED_UP): (Role.DELIVERY_PARTNER, Role.ADMIN),
    (DS.PICKED_UP, DS.OUT_FOR_DELIVERY): (Role.DELIVERY_PARTNER, Role.ADMIN),
    (DS.OUT_FOR_DELIVERY, DS.DELIVERED): (Role.DELIVERY_PARTNER, Role.ADMIN),
}


@transaction.atomic
def register_delivery_partner(*, owner_data, vehicle_type, vehicle_number, licence_number):
    user = register_user(role=Role.DELIVERY_PARTNER, **owner_data)
    profile = DeliveryPartnerProfileRepository.create(
        user=user, vehicle_type=vehicle_type, vehicle_number=vehicle_number,
        licence_number=licence_number, is_approved=False,
    )
    return profile


def set_availability(*, user, is_online, latitude=None, longitude=None):
    profile = DeliveryPartnerProfileRepository.get_or_create_for_user(user)
    if is_online and not profile.is_approved:
        raise DomainError("Your delivery partner account is awaiting admin approval.")
    fields = {"is_online": is_online}
    if latitude is not None:
        fields["current_latitude"] = latitude
    if longitude is not None:
        fields["current_longitude"] = longitude
    return DeliveryPartnerProfileRepository.update(profile, **fields)


def orders_ready_for_assignment():
    """Orders that reached READY_FOR_PICKUP and have no delivery yet."""
    return OrderRepository.ready_for_assignment()


def online_partners():
    return DeliveryPartnerProfileRepository.online_and_approved()


@transaction.atomic
def assign_partner(*, order, partner_user, actor):
    if order.status != OrderStatus.READY_FOR_PICKUP:
        raise ConflictError("Only orders that are ready for pickup can be assigned.")
    if hasattr(order, "delivery"):
        raise ConflictError("This order already has a delivery partner assigned.")

    profile = DeliveryPartnerProfileRepository.get_by_user(partner_user)
    if not profile or not profile.is_approved:
        raise DomainError("This delivery partner is not approved.")

    delivery = DeliveryRepository.create_delivery(
        order=order, partner=partner_user, status=DS.ASSIGNED
    )
    order = OrderRepository.update(
        order, status=OrderStatus.ASSIGNED, delivery_partner=partner_user
    )

    OrderStatusEventRepository.create_event(
        order=order, from_status=OrderStatus.READY_FOR_PICKUP, to_status=OrderStatus.ASSIGNED,
        changed_by=actor, changed_by_role=actor.role,
        note=f"Assigned to {partner_user.name}.",
    )

    transaction.on_commit(
        lambda: publish(
            EventType.DELIVERY_ASSIGNED,
            order_id=order.id, order_number=order.order_number,
            partner_id=partner_user.id, partner_name=partner_user.name,
            partner_email=partner_user.email, shop_name=order.shop.name,
        )
    )
    return delivery


@transaction.atomic
def transition_delivery(*, delivery, target_status, actor):
    if actor.role == Role.DELIVERY_PARTNER and delivery.partner_id != actor.id:
        raise DomainError("This delivery is not assigned to you.")

    edge = _TRANSITIONS.get((delivery.status, target_status))
    if not edge or actor.role not in edge:
        raise ConflictError(f"Cannot move delivery from {delivery.status} to {target_status}.")

    fields = {"status": target_status}
    now = timezone.now()
    if target_status == DS.ACCEPTED:
        fields["accepted_at"] = now
    if target_status == DS.PICKED_UP:
        fields["pickup_time"] = now
    if target_status == DS.DELIVERED:
        fields["delivery_time"] = now
    delivery = DeliveryRepository.update(delivery, **fields)

    order_status = DELIVERY_TO_ORDER_STATUS.get(target_status)
    if order_status:
        from apps.orders.services import transition_order

        # transition_order re-fetches its own row for locking; keep the in-memory
        # delivery.order in sync so the response we serialize isn't stale.
        delivery.order = transition_order(
            order=delivery.order, target_status=order_status, actor=actor
        )

    if target_status == DS.DELIVERED:
        profile = DeliveryPartnerProfileRepository.get_by_user(delivery.partner)
        if profile:
            DeliveryPartnerProfileRepository.update(
                profile, total_deliveries=profile.total_deliveries + 1
            )

    transaction.on_commit(
        lambda: publish(
            EventType.DELIVERY_STATUS_CHANGED,
            order_id=delivery.order_id, order_number=delivery.order.order_number,
            status=target_status, partner_id=delivery.partner_id,
        )
    )
    return delivery
