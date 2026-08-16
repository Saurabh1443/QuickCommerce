from django_filters import rest_framework as filters
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin

from apps.common.permissions import IsCustomer
from apps.orders import services
from apps.orders.models import Order
from apps.orders.repositories import OrderRepository
from apps.orders.serializers import (
    CheckoutSerializer,
    OrderCancelSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderTransitionSerializer,
)


class OrderFilterSet(filters.FilterSet):
    status = filters.CharFilter(field_name="status")
    payment_status = filters.CharFilter(field_name="payment_status")
    shop = filters.NumberFilter(field_name="shop_id")
    customer = filters.NumberFilter(field_name="customer_id")
    delivery_partner = filters.NumberFilter(field_name="delivery_partner_id")
    date_from = filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Order
        fields = ("status", "payment_status", "shop", "customer", "delivery_partner")


class OrderViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    """Role-scoped order list/detail plus lifecycle actions.

    ``OrderRepository.for_user`` is the single security boundary: customers only ever
    see their own orders, shopkeepers only their shop's orders, partners only assigned
    deliveries, admins see everything.
    """

    permission_classes = (IsAuthenticated,)
    filterset_class = OrderFilterSet
    search_fields = ("order_number", "customer__name", "shop__name")
    ordering_fields = ("created_at", "total_amount")

    def get_queryset(self):
        return OrderRepository.for_user(self.request.user)

    def get_serializer_class(self):
        return OrderDetailSerializer if self.action == "retrieve" else OrderListSerializer

    def create(self, request):
        """POST /api/orders/ — place an order from the customer's cart (customer only)."""
        if request.user.role != "CUSTOMER":
            return Response(
                {"success": False, "error": {"code": "forbidden",
                 "message": "Only customers can place orders."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = CheckoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = services.place_order(
            customer=request.user,
            address=serializer.validated_data["address"],
            payment_method=serializer.validated_data["payment_method"],
            customer_note=serializer.validated_data.get("customer_note", ""),
        )
        return Response(
            OrderDetailSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        """POST /api/orders/<id>/transition/ {status, note} — enforced by the state machine."""
        order = self.get_object()
        serializer = OrderTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.transition_order(
            order=order, target_status=serializer.validated_data["status"],
            actor=request.user, note=serializer.validated_data.get("note", ""),
        )
        return Response(OrderDetailSerializer(order, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """POST /api/orders/<id>/cancel/ {reason} — customer or admin only."""
        order = self.get_object()
        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.cancel_order(
            order=order, actor=request.user, reason=serializer.validated_data["reason"]
        )
        return Response(OrderDetailSerializer(order, context={"request": request}).data)
