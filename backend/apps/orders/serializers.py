from rest_framework import serializers

from apps.accounts.serializers import UserBriefSerializer
from apps.locations.repositories import AddressRepository
from apps.orders import state_machine
from apps.orders.constants import PaymentMethod
from apps.orders.models import Order, OrderItem, OrderStatusEvent
from apps.shops.serializers import ShopCardSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("id", "product", "product_name", "unit", "image", "quantity",
                  "unit_price", "total_price")


class OrderStatusEventSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.name", read_only=True,
                                            default="")

    class Meta:
        model = OrderStatusEvent
        fields = ("from_status", "to_status", "changed_by_name", "changed_by_role",
                  "note", "created_at")


class OrderListSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(source="shop.name", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    delivery_partner_name = serializers.CharField(
        source="delivery_partner.name", read_only=True, default=None
    )
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "order_number", "shop_name", "customer_name", "delivery_partner_name",
            "item_count", "total_amount", "status", "payment_status", "payment_method",
            "created_at",
        )


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_events = OrderStatusEventSerializer(many=True, read_only=True)
    shop = ShopCardSerializer(read_only=True)
    customer = UserBriefSerializer(read_only=True)
    delivery_partner = UserBriefSerializer(read_only=True)
    full_address = serializers.CharField(read_only=True)
    available_actions = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id", "order_number", "shop", "customer", "delivery_partner",
            "contact_name", "contact_phone", "address_line", "landmark", "city",
            "state", "pincode", "latitude", "longitude", "full_address",
            "subtotal", "delivery_fee", "discount", "tax", "total_amount",
            "status", "payment_status", "payment_method", "customer_note",
            "cancel_reason", "eta_minutes", "items", "status_events",
            "available_actions", "created_at", "delivered_at",
        )

    def get_available_actions(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return []
        return state_machine.available_actions(obj.status, request.user.role)


class CheckoutAddressSerializer(serializers.Serializer):
    """Either reference a saved address or provide one inline (map-picked location)."""

    address_id = serializers.IntegerField(required=False)
    name = serializers.CharField(max_length=120, required=False)
    phone = serializers.CharField(max_length=10, required=False)
    address_line = serializers.CharField(max_length=255, required=False)
    landmark = serializers.CharField(max_length=150, required=False, allow_blank=True)
    city = serializers.CharField(max_length=80, required=False)
    state = serializers.CharField(max_length=80, required=False)
    pincode = serializers.CharField(max_length=6, required=False)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)

    def validate(self, attrs):
        request = self.context["request"]
        if "address_id" in attrs:
            address = AddressRepository.get_for_user(request.user, attrs["address_id"])
            if not address:
                raise serializers.ValidationError("Saved address not found.")
            return {
                "name": address.name, "phone": address.phone,
                "address_line": address.address_line, "landmark": address.landmark,
                "city": address.city, "state": address.state, "pincode": address.pincode,
                "latitude": address.latitude, "longitude": address.longitude,
            }
        required = ("name", "phone", "address_line", "city", "state", "pincode",
                   "latitude", "longitude")
        missing = [field for field in required if field not in attrs]
        if missing:
            raise serializers.ValidationError(
                f"Provide address_id or all of: {', '.join(missing)}."
            )
        return attrs


class CheckoutSerializer(serializers.Serializer):
    address = CheckoutAddressSerializer()
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices)
    customer_note = serializers.CharField(max_length=255, required=False, allow_blank=True)


class OrderTransitionSerializer(serializers.Serializer):
    status = serializers.CharField()
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)


class OrderCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255)
