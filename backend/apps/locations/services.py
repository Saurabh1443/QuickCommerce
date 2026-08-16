"""Address business rules: default-address bookkeeping. No ORM calls here."""
from django.db import transaction

from apps.locations.repositories import AddressRepository


@transaction.atomic
def create_address(user, validated_data):
    make_default = validated_data.pop("is_default", False)
    address = AddressRepository.create_for_user(user, **validated_data)
    if make_default or not AddressRepository.has_default(user):
        address = set_default_address(user, address)
    return address


@transaction.atomic
def update_address(instance, validated_data):
    make_default = validated_data.pop("is_default", None)
    address = AddressRepository.update(instance, **validated_data) if validated_data else instance
    if make_default:
        address = set_default_address(address.user, address)
    return address


@transaction.atomic
def set_default_address(user, address):
    """The single place that guarantees a user has at most one default address."""
    AddressRepository.clear_default_except(user, exclude_pk=address.pk)
    if not address.is_default:
        address = AddressRepository.update(address, is_default=True)
    return address
