from django.db import models


class Role(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    SHOPKEEPER = "SHOPKEEPER", "Shopkeeper"
    DELIVERY_PARTNER = "DELIVERY_PARTNER", "Delivery partner"
    ADMIN = "ADMIN", "Admin"


SELF_SERVICE_ROLES = (Role.CUSTOMER, Role.SHOPKEEPER, Role.DELIVERY_PARTNER)

# Where the frontend should land after login, per role.
ROLE_HOME = {
    Role.CUSTOMER: "/customer",
    Role.SHOPKEEPER: "/shopkeeper/dashboard",
    Role.DELIVERY_PARTNER: "/delivery/dashboard",
    Role.ADMIN: "/admin/dashboard",
}
