from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.exceptions import DomainError
from apps.common.permissions import IsPlatformAdmin
from apps.orders.repositories import OrderRepository
from apps.payments import services
from apps.payments.repositories import PaymentRepository
from apps.payments.serializers import (
    InitiatePaymentSerializer,
    PaymentSerializer,
    VerifyPaymentSerializer,
)


def _get_order_or_404(order_id, user):
    order = OrderRepository.get_for_user(user, order_id)
    if not order:
        raise DomainError("Order not found.")
    return order


class PaymentMethodsView(APIView):
    """GET /api/payments/methods/ — what checkout should offer for a given shop/order."""

    permission_classes = (AllowAny,)

    def get(self, request):
        methods = [{"code": "ONLINE", "label": "Pay online (Razorpay)"}]
        methods.append({"code": "COD", "label": "Cash on Delivery"})
        return Response({
            "methods": methods,
            "razorpay_key_id": settings.RAZORPAY_KEY_ID or None,
            "sandbox_mode": not bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET),
        })


class InitiatePaymentView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_scope = "payments"

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = _get_order_or_404(serializer.validated_data["order_id"], request.user)
        payment, gateway_result = services.initiate_payment(order=order, actor=request.user)

        data = {"payment": PaymentSerializer(payment).data}
        if gateway_result:
            data["checkout"] = {
                "gateway": gateway_result.gateway,
                "gateway_order_id": gateway_result.gateway_order_id,
                "amount": gateway_result.amount,
                "currency": gateway_result.currency,
                "key_id": gateway_result.key_id,
                **gateway_result.extra,
            }
        return Response(data, status=status.HTTP_201_CREATED)


class VerifyPaymentView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_scope = "payments"

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        order = _get_order_or_404(data["order_id"], request.user)
        payment = services.verify_payment(order=order, actor=request.user, verification_data=data)
        return Response({
            "detail": "Payment verified successfully.",
            "payment": PaymentSerializer(payment).data,
        })


class OrderPaymentStatusView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, order_id):
        order = _get_order_or_404(order_id, request.user)
        payments = PaymentRepository.for_order(order)
        return Response({
            "payment_status": order.payment_status,
            "payment_method": order.payment_method,
            "payments": PaymentSerializer(payments, many=True).data,
        })


class AdminPaymentListView(APIView):
    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        payments = PaymentRepository.admin_recent(limit=200)
        return Response(PaymentSerializer(payments, many=True).data)


class RazorpayWebhookView(APIView):
    """POST /api/payments/webhook/razorpay/ — optional async confirmation channel."""

    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        from apps.payments.registry import get_gateway

        gateway = get_gateway("RAZORPAY")
        try:
            gateway.verify_webhook(headers=request.headers, body=request.body)
        except Exception as exc:  # noqa: BLE001
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        # Order status is already updated via the synchronous /verify/ call in the MVP;
        # the webhook exists as a safety net for missed client callbacks.
        return Response({"detail": "ok"})
