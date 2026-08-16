from django.contrib import admin

from apps.products.models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "shop", "category", "price", "discount_price",
                    "stock_quantity", "is_available")
    list_filter = ("is_available", "category", "shop")
    list_editable = ("price", "stock_quantity", "is_available")
    search_fields = ("name", "shop__name")
