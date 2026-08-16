from rest_framework import serializers

from apps.accounts.serializers import BaseRegistrationSerializer, UserBriefSerializer
from apps.delivery.models import Delivery, DeliveryPartnerProfile
from apps.orders.serializers import OrderDetailSerializer


class DeliveryPartnerProfileSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)

    class Meta:
        model = DeliveryPartnerProfile
        fields = (
            "id", "user", "vehicle_type", "vehicle_number", "licence_number",
            "is_approved", "is_online", "current_latitude", "current_longitude",
            "total_deliveries", "rating", "created_at",
        )
        read_only_fields = ("id", "is_approved", "total_deliveries", "rating")


class DeliveryPartnerRegistrationSerializer(serializers.Serializer):
    owner = BaseRegistrationSerializer()
    vehicle_type = serializers.CharField(max_length=30, default="bike")
    vehicle_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    licence_number = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def create(self, validated_data):
        from apps.delivery.services import register_delivery_partner

        return register_delivery_partner(
            owner_data=validated_data["owner"],
            vehicle_type=validated_data.get("vehicle_type", "bike"),
            vehicle_number=validated_data.get("vehicle_number", ""),
            licence_number=validated_data.get("licence_number", ""),
        )


class AvailabilitySerializer(serializers.Serializer):
    is_online = serializers.BooleanField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)


class DeliverySerializer(serializers.ModelSerializer):
    order = OrderDetailSerializer(read_only=True)
    partner = UserBriefSerializer(read_only=True)

    class Meta:
        model = Delivery
        fields = (
            "id", "order", "partner", "status", "assigned_at", "accepted_at",
            "pickup_time", "delivery_time",
        )


class AssignPartnerSerializer(serializers.Serializer):
    partner_id = serializers.IntegerField()


class DeliveryTransitionSerializer(serializers.Serializer):
    status = serializers.CharField()
