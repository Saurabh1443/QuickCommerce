"""Account business logic. No ORM calls here — everything goes through UserRepository."""
from django.db import transaction

from apps.accounts.constants import Role
from apps.accounts.repositories import UserRepository
from apps.events.bus import publish
from apps.events.event_types import EventType


@transaction.atomic
def register_user(*, name, email, phone, password, role=Role.CUSTOMER, **extra):
    """Create a user with a server-decided role and announce it on the event bus."""
    if role not in Role.values:
        raise ValueError(f"Unsupported role: {role}")

    user = UserRepository.create_user(
        email=email, password=password, name=name, phone=phone, role=role, **extra
    )
    transaction.on_commit(
        lambda: publish(
            EventType.USER_REGISTERED,
            user_id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
        )
    )
    return user


def issue_tokens(user):
    """Issue an access/refresh pair for a freshly registered or logged-in user."""
    from apps.accounts.serializers import QuickCommerceTokenObtainSerializer

    refresh = QuickCommerceTokenObtainSerializer.get_token(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def update_profile(user, validated_data):
    """Apply profile edits (name/phone/avatar)."""
    if not validated_data:
        return user
    return UserRepository.update(user, **validated_data)


def change_password(user, new_password):
    return UserRepository.set_password(user, new_password)


def set_user_active(user, is_active):
    return UserRepository.update(user, is_active=is_active)


def list_users(role=None, search=None):
    return UserRepository.list_users(role=role, search=search)
