from django.contrib import admin

from apps.payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "gateway", "method", "amount", "status", "created_at")
    list_filter = ("gateway", "method", "status")
    search_fields = ("order__order_number", "gateway_order_id", "gateway_payment_id")
