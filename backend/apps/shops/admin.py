from django.contrib import admin

from apps.shops.models import Shop, ShopKyc


class ShopKycInline(admin.StackedInline):
    model = ShopKyc
    extra = 0


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "category", "city", "status", "is_accepting_orders",
                    "rating")
    list_filter = ("status", "category", "city", "is_accepting_orders")
    search_fields = ("name", "owner__email", "city", "pincode")
    inlines = (ShopKycInline,)
    readonly_fields = ("slug", "approved_at")
