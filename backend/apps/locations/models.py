from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.common.validators import phone_validator, pincode_validator


class AddressLabel(models.TextChoices):
    HOME = "HOME", "Home"
    WORK = "WORK", "Work"
    OTHER = "OTHER", "Other"


class Address(TimeStampedModel):
    """A customer delivery address with coordinates picked on Google Maps."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses"
    )
    label = models.CharField(max_length=10, choices=AddressLabel.choices,
                             default=AddressLabel.HOME)
    name = models.CharField(max_length=120, help_text="Receiver name.")
    phone = models.CharField(max_length=10, validators=[phone_validator])
    address_line = models.CharField(max_length=255)
    landmark = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    pincode = models.CharField(max_length=6, validators=[pincode_validator])
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_default = models.BooleanField(default=False)

    class Meta(TimeStampedModel.Meta):
        ordering = ("-is_default", "-created_at")
        indexes = [models.Index(fields=["user", "is_default"])]

    def __str__(self):
        return f"{self.name}, {self.address_line}, {self.city} - {self.pincode}"

    @property
    def full_address(self):
        """Pure string formatting — not a database call, safe to keep on the model."""
        parts = [self.address_line, self.landmark, self.city, self.state, self.pincode]
        return ", ".join(part for part in parts if part)

    # Default-address bookkeeping (clearing other defaults, auto-defaulting the first
    # saved address) is business logic and lives in apps.locations.services, backed by
    # apps.locations.repositories.AddressRepository — not here.
