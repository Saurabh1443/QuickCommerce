from django.contrib import admin

from apps.carts.models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("customer", "shop", "updated_at")
    inlines = (CartItemInline,)
    search_fields = ("customer__email",)
