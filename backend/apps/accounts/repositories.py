"""All direct ORM access for the User model lives here. No other module in this
project should call ``User.objects`` — go through ``UserRepository`` instead.
"""
from django.db.models import Q

from apps.accounts.models import User
from apps.common.repositories import BaseRepository


class UserRepository(BaseRepository):
    model = User

    @classmethod
    def get_by_email(cls, email):
        return cls.model.objects.filter(email__iexact=email).first()

    @classmethod
    def get_by_phone(cls, phone):
        return cls.model.objects.filter(phone=phone).first()

    @classmethod
    def get_by_id_and_role(cls, pk, role):
        return cls.model.objects.filter(pk=pk, role=role).first()

    @classmethod
    def exists_by_email(cls, email, exclude_id=None):
        queryset = cls.model.objects.filter(email__iexact=email)
        if exclude_id:
            queryset = queryset.exclude(pk=exclude_id)
        return queryset.exists()

    @classmethod
    def exists_by_phone(cls, phone, exclude_id=None):
        queryset = cls.model.objects.filter(phone=phone)
        if exclude_id:
            queryset = queryset.exclude(pk=exclude_id)
        return queryset.exists()

    @classmethod
    def create_user(cls, *, email, password, name, phone, role, **extra):
        return cls.model.objects.create_user(
            email=email, password=password, name=name, phone=phone, role=role, **extra
        )

    @classmethod
    def create_superuser(cls, *, email, password, name, phone, **extra):
        return cls.model.objects.create_superuser(
            email=email, password=password, name=name, phone=phone, **extra
        )

    @classmethod
    def list_users(cls, role=None, search=None, limit=200):
        queryset = cls.model.objects.all().order_by("-date_joined")
        if role:
            queryset = queryset.filter(role=role)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(email__icontains=search) | Q(phone__icontains=search)
            )
        return queryset[:limit]

    @classmethod
    def set_password(cls, user, raw_password):
        user.set_password(raw_password)
        user.save(update_fields=["password", "updated_at"])
        return user

    @classmethod
    def count_by_role(cls, role):
        return cls.model.objects.filter(role=role).count()
