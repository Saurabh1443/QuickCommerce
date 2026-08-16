from datetime import time

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.common.models import TimeStampedModel
from apps.common.validators import (
    gst_validator,
    ifsc_validator,
    pan_validator,
    pincode_validator,
    phone_validator,
)
from apps.shops.constants import LicenseType, ShopStatus


class ShopQuerySet(models.QuerySet):
    def customer_visible(self):
        """Approved shops only — the single definition used by every customer API."""
        return self.filter(status=ShopStatus.APPROVED, owner__is_active=True)

    def pending(self):
        return self.filter(status=ShopStatus.PENDING)


class Shop(TimeStampedModel):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shop"
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        "catalog.Category", on_delete=models.PROTECT, related_name="shops"
    )
    phone = models.CharField(max_length=10, validators=[phone_validator])

    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    pincode = models.CharField(max_length=6, validators=[pincode_validator])
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    opening_time = models.TimeField(default=time(9, 0))
    closing_time = models.TimeField(default=time(21, 0))

    image = models.ImageField(upload_to="shops/", blank=True, null=True)

    status = models.CharField(
        max_length=12, choices=ShopStatus.choices, default=ShopStatus.PENDING, db_index=True
    )
    status_reason = models.CharField(max_length=255, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    delivery_fee = models.DecimalField(max_digits=7, decimal_places=2, default=25)
    min_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    avg_prep_minutes = models.PositiveIntegerField(default=15)
    cod_enabled = models.BooleanField(default=True)
    is_accepting_orders = models.BooleanField(default=True)

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)

    objects = ShopQuerySet.as_manager()

    class Meta(TimeStampedModel.Meta):
        indexes = [
            models.Index(fields=["status", "city"]),
            models.Index(fields=["latitude", "longitude"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:150] or "shop"
            slug, counter = base, 1
            while Shop.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f"{base}-{counter}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def full_address(self):
        return f"{self.address_line}, {self.city}, {self.state} - {self.pincode}"

    @property
    def is_approved(self):
        return self.status == ShopStatus.APPROVED

    @property
    def is_open_now(self):
        """Whether the shop is currently within business hours and accepting orders."""
        if not (self.is_approved and self.is_accepting_orders):
            return False
        now = timezone.localtime().time()
        if self.opening_time <= self.closing_time:
            return self.opening_time <= now <= self.closing_time
        # Shops that close after midnight (e.g. 18:00 -> 02:00).
        return now >= self.opening_time or now <= self.closing_time

    def can_accept_orders(self):
        return self.is_open_now


class ShopKyc(TimeStampedModel):
    """Business/KYC details. Fields are optional so requirements stay configurable."""

    shop = models.OneToOneField(Shop, on_delete=models.CASCADE, related_name="kyc")
    business_name = models.CharField(max_length=180, blank=True)
    license_type = models.CharField(
        max_length=24, choices=LicenseType.choices, default=LicenseType.NONE
    )
    license_number = models.CharField(max_length=60, blank=True)
    gst_number = models.CharField(max_length=15, blank=True, validators=[gst_validator])
    pan_number = models.CharField(max_length=10, blank=True, validators=[pan_validator])
    bank_account_name = models.CharField(max_length=120, blank=True)
    bank_account_number = models.CharField(max_length=24, blank=True)
    bank_ifsc = models.CharField(max_length=11, blank=True, validators=[ifsc_validator])
    license_document = models.FileField(upload_to="kyc/", blank=True, null=True)
    extra_details = models.JSONField(
        default=dict, blank=True,
        help_text="Category-specific fields that differ per business type.",
    )
    is_verified = models.BooleanField(default=False)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Shop KYC"
        verbose_name_plural = "Shop KYC"

    def __str__(self):
        return f"KYC for {self.shop.name}"
