from rest_framework import serializers

from apps.catalog.models import Category
from apps.common.validators import validate_image_upload


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id", "name", "slug", "description", "image", "icon",
            "is_active", "sort_order",
        )
        read_only_fields = ("id", "slug")

    def validate_image(self, value):
        return validate_image_upload(value) if value else value

    def create(self, validated_data):
        from apps.catalog.services import create_category

        return create_category(validated_data)

    def update(self, instance, validated_data):
        from apps.catalog.services import update_category

        return update_category(instance, validated_data)
