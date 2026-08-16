"""Shop onboarding, approval and discovery business logic.

No module here calls ``Shop.objects``/``ShopKyc.objects`` directly — everything goes
through ``apps.shops.repositories``.
"""
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.accounts.constants import Role
from apps.accounts.services import register_user
from apps.common.exceptions import ConflictError, DomainError, NotFoundError
from apps.common.geo import haversine_km
from apps.events.bus import publish
from apps.events.event_types import EventType
from apps.shops.constants import ShopStatus
from apps.shops.repositories import ShopKycRepository, ShopRepository


@transaction.atomic
def register_shopkeeper(*, owner_data, shop_data, kyc_data=None):
    """Create the shopkeeper account, their shop (PENDING) and KYC record together."""
    owner = register_user(role=Role.SHOPKEEPER, **owner_data)
    shop = ShopRepository.create_shop(owner=owner, status=ShopStatus.PENDING, **shop_data)
    ShopKycRepository.create_for_shop(shop, **(kyc_data or {}))

    transaction.on_commit(
        lambda: publish(
            EventType.SHOP_SUBMITTED,
            shop_id=shop.id,
            shop_name=shop.name,
            owner_id=owner.id,
            owner_name=owner.name,
            owner_email=owner.email,
            city=shop.city,
        )
    )
    return shop


def get_shop_for_customer(slug):
    shop = ShopRepository.get_visible_by_slug(slug)
    if not shop:
        raise NotFoundError("Shop not found or not active.")
    return shop


def get_my_shop(user):
    shop = ShopRepository.get_by_owner(user)
    if not shop:
        raise DomainError("No shop is linked to this account.")
    return shop


def update_shop_profile(shop, validated_data):
    kyc_data = validated_data.pop("kyc", None)
    if validated_data:
        shop = ShopRepository.update(shop, **validated_data)
    if kyc_data:
        kyc, _ = ShopKycRepository.get_or_create_for_shop(shop)
        ShopKycRepository.update(kyc, **kyc_data)
    return shop


def search_nearby_shops(*, category=None, search=None, city=None,
                        latitude=None, longitude=None, radius_km=None):
    """Compose the repository filters and apply distance sorting.

    ``latitude``/``longitude``/``radius_km`` are expected to already be validated
    floats (or ``None``) — parsing/validating raw query params is the controller's job.
    """
    queryset = ShopRepository.customer_visible()
    if category:
        queryset = ShopRepository.by_category(queryset, category)
    if search:
        queryset = ShopRepository.search(queryset, search)
    if city:
        queryset = ShopRepository.by_city(queryset, city)

    radius_km = radius_km or settings.SHOP_DISCOVERY_RADIUS_KM

    if latitude is not None and longitude is not None:
        shops = list(ShopRepository.within_radius(queryset, latitude, longitude, radius_km))
        for shop in shops:
            shop.distance_km = haversine_km(latitude, longitude, shop.latitude, shop.longitude)
        shops = [s for s in shops if s.distance_km is not None and s.distance_km <= radius_km]
        shops.sort(key=lambda s: s.distance_km)
    else:
        shops = list(queryset)
        shops.sort(key=lambda s: (-float(s.rating), s.name))

    return shops, radius_km


def _transition(shop, *, status, reason="", event, actor=None):
    if shop.status == status:
        raise ConflictError(f"Shop is already {status.lower()}.")

    fields = {"status": status, "status_reason": reason}
    if status == ShopStatus.APPROVED:
        fields["approved_at"] = timezone.now()
    shop = ShopRepository.update(shop, **fields)

    publish(
        event,
        shop_id=shop.id,
        shop_name=shop.name,
        owner_id=shop.owner_id,
        owner_email=shop.owner.email,
        owner_name=shop.owner.name,
        reason=reason,
        actor_id=getattr(actor, "id", None),
    )
    return shop


def approve_shop(shop, *, actor=None, note=""):
    return _transition(shop, status=ShopStatus.APPROVED, reason=note,
                       event=EventType.SHOP_APPROVED, actor=actor)


def reject_shop(shop, *, reason, actor=None):
    if not reason:
        raise ConflictError("A rejection reason is required.")
    return _transition(shop, status=ShopStatus.REJECTED, reason=reason,
                       event=EventType.SHOP_REJECTED, actor=actor)


def suspend_shop(shop, *, reason, actor=None):
    return _transition(shop, status=ShopStatus.SUSPENDED, reason=reason,
                       event=EventType.SHOP_SUSPENDED, actor=actor)
