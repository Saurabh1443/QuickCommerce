from rest_framework import serializers

from apps.locations.models import Address


class AddressSerializer(serializers.ModelSerializer):
    full_address = serializers.CharField(read_only=True)

    class Meta:
        model = Address
        fields = (
            "id", "label", "name", "phone", "address_line", "landmark", "city",
            "state", "pincode", "latitude", "longitude", "is_default",
            "full_address", "created_at",
        )
        read_only_fields = ("id", "created_at", "full_address")

    def create(self, validated_data):
        from apps.locations.services import create_address

        # Ownership comes from the token, never from the request body.
        user = self.context["request"].user
        return create_address(user, validated_data)

    def update(self, instance, validated_data):
        from apps.locations.services import update_address

        return update_address(instance, validated_data)
