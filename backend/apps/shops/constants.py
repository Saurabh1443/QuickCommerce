from django.db import models


class ShopStatus(models.TextChoices):
    PENDING = "PENDING", "Pending approval"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    SUSPENDED = "SUSPENDED", "Suspended"


class LicenseType(models.TextChoices):
    """Not every shop needs the same paperwork, so the type is part of the data."""

    FSSAI = "FSSAI", "FSSAI (food)"
    SHOP_ESTABLISHMENT = "SHOP_ESTABLISHMENT", "Shop & establishment"
    TRADE_LICENSE = "TRADE_LICENSE", "Trade license"
    DRUG_LICENSE = "DRUG_LICENSE", "Drug license"
    NONE = "NONE", "Not applicable"


# Only shops in this state are discoverable and orderable by customers.
CUSTOMER_VISIBLE_STATUSES = (ShopStatus.APPROVED,)
