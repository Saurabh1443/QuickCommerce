from django.contrib import admin

from apps.locations.models import Address


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "city", "pincode", "is_default")
    list_filter = ("city", "state", "is_default")
    search_fields = ("name", "address_line", "city", "pincode", "user__email")
