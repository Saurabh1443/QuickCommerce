from django.contrib import admin

from apps.delivery.models import Delivery, DeliveryPartnerProfile


@admin.register(DeliveryPartnerProfile)
class DeliveryPartnerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "vehicle_type", "is_approved", "is_online", "total_deliveries",
                    "rating")
    list_filter = ("is_approved", "is_online", "vehicle_type")
    search_fields = ("user__email", "user__name", "vehicle_number")


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ("order", "partner", "status", "assigned_at", "delivery_time")
    list_filter = ("status",)
    search_fields = ("order__order_number", "partner__email")
