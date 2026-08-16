from rest_framework import serializers

from apps.accounts.serializers import BaseRegistrationSerializer, UserBriefSerializer
from apps.catalog.serializers import CategorySerializer
from apps.common.geo import estimate_delivery_minutes, haversine_km
from apps.common.validators import validate_image_upload
from apps.shops.models import Shop, ShopKyc


class ShopKycSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopKyc
        fields = (
            "business_name", "license_type", "license_number", "gst_number",
            "pan_number", "bank_account_name", "bank_account_number", "bank_ifsc",
            "license_document", "extra_details", "is_verified",
        )
        read_only_fields = ("is_verified",)


class ShopCardSerializer(serializers.ModelSerializer):
    """Compact shape used for discovery lists and shop cards."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    is_open_now = serializers.BooleanField(read_only=True)
    distance_km = serializers.SerializerMethodField()
    eta_minutes = serializers.SerializerMethodField()
    full_address = serializers.CharField(read_only=True)

    class Meta:
        model = Shop
        fields = (
            "id", "name", "slug", "description", "category", "category_name", "image",
            "city", "latitude", "longitude", "opening_time", "closing_time",
            "delivery_fee", "min_order_value", "rating", "rating_count",
            "is_open_now", "distance_km", "eta_minutes", "status", "cod_enabled",
            "full_address",
        )

    def _distance(self, obj):
        if getattr(obj, "distance_km", None) is not None:
            return obj.distance_km
        origin = self.context.get("origin")
        if not origin:
            return None
        return haversine_km(origin[0], origin[1], obj.latitude, obj.longitude)

    def get_distance_km(self, obj):
        return self._distance(obj)

    def get_eta_minutes(self, obj):
        low, high = estimate_delivery_minutes(self._distance(obj), obj.avg_prep_minutes)
        return {"min": low, "max": high}


class ShopDetailSerializer(ShopCardSerializer):
    owner = UserBriefSerializer(read_only=True)
    category_detail = CategorySerializer(source="category", read_only=True)

    class Meta(ShopCardSerializer.Meta):
        fields = ShopCardSerializer.Meta.fields + (
            "owner", "category_detail", "phone", "address_line", "state", "pincode",
            "avg_prep_minutes", "is_accepting_orders",
            "status_reason", "created_at", "approved_at",
        )


class ShopAdminSerializer(ShopDetailSerializer):
    kyc = ShopKycSerializer(read_only=True)

    class Meta(ShopDetailSerializer.Meta):
        fields = ShopDetailSerializer.Meta.fields + ("kyc",)


class ShopWritableFieldsMixin(serializers.ModelSerializer):
    def validate_image(self, value):
        return validate_image_upload(value) if value else value


class ShopProfileSerializer(ShopWritableFieldsMixin):
    """What a shopkeeper may edit on their own shop (status is never editable here)."""

    kyc = ShopKycSerializer(required=False)
    is_open_now = serializers.BooleanField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Shop
        fields = (
            "id", "name", "slug", "description", "category", "category_name", "phone",
            "address_line", "city", "state", "pincode", "latitude", "longitude",
            "opening_time", "closing_time", "image", "delivery_fee", "min_order_value",
            "avg_prep_minutes", "cod_enabled", "is_accepting_orders", "status",
            "status_reason", "rating", "rating_count", "is_open_now", "kyc",
        )
        read_only_fields = ("id", "slug", "status", "status_reason", "rating", "rating_count")

    def update(self, instance, validated_data):
        from apps.shops.services import update_shop_profile

        return update_shop_profile(instance, validated_data)


class ShopRegistrationSerializer(serializers.Serializer):
    """Owner + shop + KYC in one onboarding payload. Creates a PENDING shop."""

    owner = BaseRegistrationSerializer()
    shop = serializers.DictField(write_only=True)
    kyc = serializers.DictField(write_only=True, required=False)

    def validate_shop(self, value):
        serializer = _ShopOnboardingSerializer(data=value)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def validate_kyc(self, value):
        serializer = ShopKycSerializer(data=value)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def create(self, validated_data):
        from apps.shops.services import register_shopkeeper

        return register_shopkeeper(
            owner_data=validated_data["owner"],
            shop_data=validated_data["shop"],
            kyc_data=validated_data.get("kyc"),
        )


class _ShopOnboardingSerializer(ShopWritableFieldsMixin):
    class Meta:
        model = Shop
        fields = (
            "name", "description", "category", "phone", "address_line", "city",
            "state", "pincode", "latitude", "longitude", "opening_time",
            "closing_time", "image", "delivery_fee", "min_order_value",
            "avg_prep_minutes", "cod_enabled",
        )


class ShopStatusActionSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=255)
