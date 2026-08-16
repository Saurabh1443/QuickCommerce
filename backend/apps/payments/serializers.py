from rest_framework import serializers

from apps.payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id", "order", "order_number", "gateway", "method", "gateway_order_id",
            "gateway_payment_id", "amount", "currency", "status", "error_description",
            "created_at",
        )


class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()


class VerifyPaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    razorpay_order_id = serializers.CharField(required=False, allow_blank=True)
    razorpay_payment_id = serializers.CharField(required=False, allow_blank=True)
    razorpay_signature = serializers.CharField(required=False, allow_blank=True)
