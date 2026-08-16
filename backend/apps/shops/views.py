from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.common.exceptions import DomainError
from apps.common.pagination import StandardResultsSetPagination
from apps.common.permissions import IsPlatformAdmin, IsShopkeeper
from apps.shops import services
from apps.shops.repositories import ShopRepository
from apps.shops.serializers import (
    ShopAdminSerializer,
    ShopCardSerializer,
    ShopDetailSerializer,
    ShopProfileSerializer,
    ShopRegistrationSerializer,
    ShopStatusActionSerializer,
)


class ShopRegisterView(APIView):
    """POST /api/shops/register/ — shopkeeper onboarding, creates a PENDING shop."""

    permission_classes = (AllowAny,)
    throttle_scope = "auth"

    def post(self, request):
        serializer = ShopRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shop = serializer.save()
        return Response(
            {
                "detail": "Registration submitted. Your shop will be visible to customers "
                          "once an administrator approves it.",
                "shop": ShopDetailSerializer(shop).data,
            },
            status=status.HTTP_201_CREATED,
        )


class NearbyShopListView(APIView):
    """GET /api/shops/nearby/?latitude=&longitude=&radius_km=&category=&search=

    Controller only: parses/validates query params, hands them to
    ``apps.shops.services.search_nearby_shops`` for the actual filtering/sorting
    business logic, then paginates and serializes the result.
    """

    permission_classes = (AllowAny,)

    def _parse_float(self, value, field_name):
        if value in (None, ""):
            return None
        try:
            return float(value)
        except ValueError:
            raise DomainError(f"{field_name} must be a number.")

    def get(self, request):
        params = request.query_params
        latitude = self._parse_float(params.get("latitude"), "latitude")
        longitude = self._parse_float(params.get("longitude"), "longitude")
        radius_km = self._parse_float(params.get("radius_km"), "radius_km")

        shops, radius_km = services.search_nearby_shops(
            category=params.get("category"),
            search=params.get("search"),
            city=params.get("city"),
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(shops, request, view=self)
        serializer = ShopCardSerializer(page, many=True, context={"request": request})
        response = paginator.get_paginated_response(serializer.data)
        response.data["radius_km"] = radius_km
        return response


class PublicShopDetailView(APIView):
    """GET /api/shops/<slug>/ — approved shops are public."""

    permission_classes = (AllowAny,)

    def get(self, request, slug):
        shop = services.get_shop_for_customer(slug)
        origin = None
        lat, lng = request.query_params.get("latitude"), request.query_params.get("longitude")
        if lat and lng:
            try:
                origin = (float(lat), float(lng))
            except ValueError:
                origin = None
        serializer = ShopDetailSerializer(
            shop, context={"request": request, "origin": origin}
        )
        return Response(serializer.data)


class MyShopView(RetrieveUpdateAPIView):
    """GET/PATCH /api/shops/my-shop/ — a shopkeeper's own shop, and only theirs."""

    serializer_class = ShopProfileSerializer
    permission_classes = (IsShopkeeper,)
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_object(self):
        return services.get_my_shop(self.request.user)


class AdminShopViewSet(ReadOnlyModelViewSet):
    """Admin shop moderation: list/inspect every shop and change its status."""

    serializer_class = ShopAdminSerializer
    permission_classes = (IsPlatformAdmin,)
    filterset_fields = ("status", "city", "category")
    search_fields = ("name", "owner__name", "owner__email", "city", "pincode")

    def get_queryset(self):
        return ShopRepository.admin_queryset()

    def _reason(self, request, required=False):
        serializer = ShopStatusActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get("reason", "")
        if required and not reason:
            raise DomainError("A reason is required for this action.")
        return reason

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        shop = services.approve_shop(self.get_object(), actor=request.user,
                                     note=self._reason(request))
        return Response(self.get_serializer(shop).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        shop = services.reject_shop(self.get_object(), reason=self._reason(request, True),
                                    actor=request.user)
        return Response(self.get_serializer(shop).data)

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        shop = services.suspend_shop(self.get_object(), reason=self._reason(request, True),
                                     actor=request.user)
        return Response(self.get_serializer(shop).data)
