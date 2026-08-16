"""All direct ORM access for Address lives here."""
from apps.common.repositories import BaseRepository
from apps.locations.models import Address


class AddressRepository(BaseRepository):
    model = Address

    @classmethod
    def for_user(cls, user):
        return cls.model.objects.filter(user=user)

    @classmethod
    def get_for_user(cls, user, pk):
        return cls.for_user(user).filter(pk=pk).first()

    @classmethod
    def has_default(cls, user):
        return cls.for_user(user).filter(is_default=True).exists()

    @classmethod
    def clear_default_except(cls, user, exclude_pk=None):
        queryset = cls.for_user(user).filter(is_default=True)
        if exclude_pk:
            queryset = queryset.exclude(pk=exclude_pk)
        queryset.update(is_default=False)

    @classmethod
    def create_for_user(cls, user, **fields):
        return cls.model.objects.create(user=user, **fields)
