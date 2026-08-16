"""The order state machine — the only place transitions are defined.

Each edge names the roles allowed to walk it, so "can a shopkeeper cancel a delivered
order?" has exactly one answer in the codebase.
"""
from apps.accounts.constants import Role
from apps.common.exceptions import ConflictError
from apps.orders.constants import OrderStatus as S

CUSTOMER, SHOPKEEPER, PARTNER, ADMIN = (
    Role.CUSTOMER, Role.SHOPKEEPER, Role.DELIVERY_PARTNER, Role.ADMIN,
)

TRANSITIONS = {
    (S.PLACED, S.ACCEPTED): (SHOPKEEPER, ADMIN),
    (S.PLACED, S.REJECTED): (SHOPKEEPER, ADMIN),
    (S.PLACED, S.CANCELLED): (CUSTOMER, ADMIN),
    (S.ACCEPTED, S.PREPARING): (SHOPKEEPER, ADMIN),
    (S.ACCEPTED, S.CANCELLED): (CUSTOMER, ADMIN),
    (S.ACCEPTED, S.REJECTED): (SHOPKEEPER, ADMIN),
    (S.PREPARING, S.READY_FOR_PICKUP): (SHOPKEEPER, ADMIN),
    (S.PREPARING, S.CANCELLED): (ADMIN,),
    (S.READY_FOR_PICKUP, S.ASSIGNED): (ADMIN,),
    (S.READY_FOR_PICKUP, S.CANCELLED): (ADMIN,),
    (S.ASSIGNED, S.PICKED_UP): (PARTNER, ADMIN),
    (S.ASSIGNED, S.CANCELLED): (ADMIN,),
    (S.PICKED_UP, S.OUT_FOR_DELIVERY): (PARTNER, ADMIN),
    (S.OUT_FOR_DELIVERY, S.DELIVERED): (PARTNER, ADMIN),
}

# Human-readable labels for the action buttons the frontend renders.
ACTION_LABELS = {
    S.ACCEPTED: "Accept order",
    S.REJECTED: "Reject order",
    S.PREPARING: "Start preparing",
    S.READY_FOR_PICKUP: "Mark ready for pickup",
    S.ASSIGNED: "Assign delivery partner",
    S.PICKED_UP: "Mark picked up",
    S.OUT_FOR_DELIVERY: "Start delivery",
    S.DELIVERED: "Mark delivered",
    S.CANCELLED: "Cancel order",
}

REASON_REQUIRED = (S.REJECTED, S.CANCELLED)


def allowed_targets(current_status, role):
    """Statuses ``role`` may move an order in ``current_status`` to."""
    return [
        target
        for (source, target), roles in TRANSITIONS.items()
        if source == current_status and role in roles
    ]


def available_actions(current_status, role):
    return [
        {"status": target, "label": ACTION_LABELS.get(target, target),
         "reason_required": target in REASON_REQUIRED}
        for target in allowed_targets(current_status, role)
    ]


def assert_can_transition(current_status, target_status, role):
    """Raise unless this exact (from, to, role) edge exists."""
    if current_status == target_status:
        raise ConflictError(f"Order is already {target_status.replace('_', ' ').lower()}.")
    edge = TRANSITIONS.get((current_status, target_status))
    if edge is None:
        raise ConflictError(
            f"Cannot change an order from {current_status} to {target_status}."
        )
    if role not in edge:
        raise ConflictError("Your role cannot perform this order transition.")
    return True
