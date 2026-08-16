"""Role-based permission classes. The backend is the authority on roles.

Roles always come from the authenticated database user, never from request payloads
or headers sent by the client.
"""
from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.constants import Role


class RolePermission(BasePermission):
    """Grants access only to users whose stored role is in ``allowed_roles``."""

    allowed_roles = ()
    message = "Your account role is not allowed to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False
        roles = getattr(view, "allowed_roles", None) or self.allowed_roles
        return user.role in roles


class IsCustomer(RolePermission):
    allowed_roles = (Role.CUSTOMER,)
    message = "Only customers can perform this action."


class IsShopkeeper(RolePermission):
    allowed_roles = (Role.SHOPKEEPER,)
    message = "Only shopkeepers can perform this action."


class IsDeliveryPartner(RolePermission):
    allowed_roles = (Role.DELIVERY_PARTNER,)
    message = "Only delivery partners can perform this action."


class IsPlatformAdmin(RolePermission):
    allowed_roles = (Role.ADMIN,)
    message = "Only platform administrators can perform this action."


class IsShopkeeperOrAdmin(RolePermission):
    allowed_roles = (Role.SHOPKEEPER, Role.ADMIN)


class IsCustomerOrAdmin(RolePermission):
    allowed_roles = (Role.CUSTOMER, Role.ADMIN)


class IsDeliveryPartnerOrAdmin(RolePermission):
    allowed_roles = (Role.DELIVERY_PARTNER, Role.ADMIN)


class ReadOnlyOrAdmin(BasePermission):
    """Anyone may read, only admins may write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.role == Role.ADMIN)


class IsOwnerOrAdmin(BasePermission):
    """Object-level ownership check; ``owner_field`` is configurable per view."""

    message = "You do not have access to this resource."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == Role.ADMIN:
            return True
        owner_field = getattr(view, "owner_field", "user")
        owner = obj
        for part in owner_field.split("__"):
            owner = getattr(owner, part, None)
        return owner == user
