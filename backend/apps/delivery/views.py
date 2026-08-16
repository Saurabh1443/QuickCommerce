from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.repositories import UserRepository
from apps.common.exceptions import DomainError
from apps.common.geo import haversine_km
from apps.common.permissions import IsDeliveryPartner, IsPlatformAdmin
from apps.delivery import services
from apps.delivery.repositories import DeliveryPartnerProfileRepository, DeliveryRepository
from apps.delivery.serializers import (
    AssignPartnerSerializer,
    AvailabilitySerializer,
    DeliveryPartnerProfileSerializer,
    DeliveryPartnerRegistrationSerializer,
    DeliverySerializer,
    DeliveryTransitionSerializer,
)
from apps.orders.repositories import OrderRepository
from apps.orders.serializers import OrderListSerializer


class DeliveryPartnerRegisterView(APIView):
    permission_classes = (AllowAny,)
    throttle_scope = "auth"

    def post(self, request):
        serializer = DeliveryPartnerRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(
            {
                "detail": "Registration submitted. You can go online once an "
                          "administrator approves your account.",
                "profile": DeliveryPartnerProfileSerializer(profile).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MyDeliveryProfileView(APIView):
    permission_classes = (IsDeliveryPartner,)

    def get(self, request):
        profile = DeliveryPartnerProfileRepository.get_or_create_for_user(request.user)
        return Response(DeliveryPartnerProfileSerializer(profile).data)

    def patch(self, request):
        profile = DeliveryPartnerProfileRepository.get_or_create_for_user(request.user)
        serializer = DeliveryPartnerProfileSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AvailabilityView(APIView):
    """POST /api/delivery/availability/ — go ONLINE/OFFLINE."""

    permission_classes = (IsDeliveryPartner,)

    def post(self, request):
        serializer = AvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = services.set_availability(user=request.user, **serializer.validated_data)
        return Response(DeliveryPartnerProfileSerializer(profile).data)


class AvailableOrdersView(APIView):
    """GET /api/delivery/available-orders/ — READY_FOR_PICKUP orders awaiting assignment.

    Visible to online partners for situational awareness; actual assignment for the
    MVP is performed by an admin (see `apps.delivery.views.AdminAssignDeliveryView`).
    """

    permission_classes = (IsDeliveryPartner,)

    def get(self, request):
        profile = DeliveryPartnerProfileRepository.get_by_user(request.user)
        if not profile or not profile.is_online:
            return Response({"detail": "Go online to see available deliveries.",
                             "results": []})
        orders = services.orders_ready_for_assignment()
        return Response(OrderListSerializer(orders, many=True).data)


class MyDeliveriesView(APIView):
    permission_classes = (IsDeliveryPartner,)

    def get(self, request):
        deliveries = DeliveryRepository.for_partner(request.user)
        active = request.query_params.get("active")
        if active == "true":
            deliveries = DeliveryRepository.active(deliveries)
        return Response(DeliverySerializer(deliveries, many=True).data)


class DeliveryDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_object(self, request, pk):
        delivery = DeliveryRepository.get_with_relations(pk)
        if not delivery:
            raise DomainError("Delivery not found.")
        if request.user.role == "DELIVERY_PARTNER" and delivery.partner_id != request.user.id:
            raise DomainError("This delivery is not assigned to you.")
        if request.user.role == "SHOPKEEPER" and delivery.order.shop.owner_id != request.user.id:
            raise DomainError("This delivery does not belong to your shop.")
        return delivery

    def get(self, request, pk):
        return Response(DeliverySerializer(self.get_object(request, pk)).data)

    def post(self, request, pk):
        """POST /api/delivery/<id>/transition/ {status} — advance the delivery lifecycle."""
        delivery = self.get_object(request, pk)
        serializer = DeliveryTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delivery = services.transition_delivery(
            delivery=delivery, target_status=serializer.validated_data["status"],
            actor=request.user,
        )
        return Response(DeliverySerializer(delivery).data)


class AdminDeliveryPartnerListView(APIView):
    """GET /api/delivery/admin/partners/ — admin roster with approve/activate actions."""

    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        profiles = DeliveryPartnerProfileRepository.admin_queryset()
        return Response(DeliveryPartnerProfileSerializer(profiles, many=True).data)


class AdminDeliveryPartnerActionView(APIView):
    permission_classes = (IsPlatformAdmin,)

    def _profile(self, pk):
        profile = DeliveryPartnerProfileRepository.get_by_id(pk)
        if not profile:
            raise DomainError("Delivery partner not found.")
        return profile

    def post(self, request, pk, action_name):
        profile = self._profile(pk)
        if action_name == "approve":
            fields = {"is_approved": True}
        elif action_name == "deactivate":
            fields = {"is_approved": False, "is_online": False}
        elif action_name == "activate":
            fields = {"is_approved": True}
        else:
            raise DomainError("Unknown action.")
        profile = DeliveryPartnerProfileRepository.update(profile, **fields)
        return Response(DeliveryPartnerProfileSerializer(profile).data)


class AdminAssignDeliveryView(APIView):
    """POST /api/delivery/admin/orders/<order_id>/assign/ {partner_id}"""

    permission_classes = (IsPlatformAdmin,)

    def post(self, request, order_id):
        order = OrderRepository.get_with_shop(order_id)
        if not order:
            raise DomainError("Order not found.")
        serializer = AssignPartnerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        partner = UserRepository.get_by_id_and_role(
            serializer.validated_data["partner_id"], "DELIVERY_PARTNER"
        )
        if not partner:
            raise DomainError("Delivery partner not found.")
        delivery = services.assign_partner(order=order, partner_user=partner, actor=request.user)
        return Response(DeliverySerializer(delivery).data, status=status.HTTP_201_CREATED)


class AdminActiveDeliveriesView(APIView):
    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        deliveries = DeliveryRepository.active_queryset()
        return Response(DeliverySerializer(deliveries, many=True).data)
