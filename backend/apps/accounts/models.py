from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.accounts.constants import Role
from apps.common.validators import phone_validator


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.full_clean(exclude=["password"])
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, role=Role.CUSTOMER, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, role=role, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.update(is_staff=True, is_superuser=True, role=Role.ADMIN)
        return self._create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    """Single user table with a role discriminator.

    The role stored here is the only source of truth for authorisation; values sent by
    a client are always ignored.
    """

    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(
        max_length=10, unique=True, validators=[phone_validator],
        help_text="10-digit mobile number.",
    )
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.CUSTOMER, db_index=True
    )
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "phone"]

    class Meta:
        ordering = ("-date_joined",)
        indexes = [models.Index(fields=["role", "is_active"])]

    def __str__(self):
        return f"{self.name} <{self.email}> ({self.role})"

    def save(self, *args, **kwargs):
        self.email = self.email.lower().strip()
        super().save(*args, **kwargs)

    @property
    def is_customer(self):
        return self.role == Role.CUSTOMER

    @property
    def is_shopkeeper(self):
        return self.role == Role.SHOPKEEPER

    @property
    def is_delivery_partner(self):
        return self.role == Role.DELIVERY_PARTNER

    @property
    def is_platform_admin(self):
        return self.role == Role.ADMIN

    def get_short_name(self):
        return self.name.split(" ")[0] if self.name else self.email
