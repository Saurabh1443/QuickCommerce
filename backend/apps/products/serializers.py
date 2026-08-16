from rest_framework import serializers

from apps.common.validators import validate_image_upload
from apps.products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    shop_name = serializers.CharField(source="shop.name", read_only=True)
    shop_slug = serializers.CharField(source="shop.slug", read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2,
                                               read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id", "shop", "shop_name", "shop_slug", "category", "category_name", "name",
            "description", "price", "discount_price", "effective_price",
            "discount_percent", "unit", "stock_quantity", "image", "is_available",
            "in_stock", "is_low_stock", "created_at", "updated_at",
        )
        read_only_fields = ("id", "shop", "created_at", "updated_at")

    def validate_image(self, value):
        return validate_image_upload(value) if value else value

    def validate(self, attrs):
        price = attrs.get("price", getattr(self.instance, "price", None))
        discount = attrs.get("discount_price", getattr(self.instance, "discount_price", None))
        if price is not None and discount not in (None, "") and discount >= price:
            raise serializers.ValidationError(
                {"discount_price": "Discounted price must be lower than the actual price."}
            )
        return attrs


class ProductWriteSerializer(ProductSerializer):
    """Used by shopkeeper/admin product management; the shop is resolved server-side."""

    class Meta(ProductSerializer.Meta):
        read_only_fields = ("id", "created_at", "updated_at")
        extra_kwargs = {"shop": {"required": False}}

    def create(self, validated_data):
        from apps.products.repositories import ProductRepository

        return ProductRepository.create(**validated_data)

    def update(self, instance, validated_data):
        from apps.products.repositories import ProductRepository

        return ProductRepository.update(instance, **validated_data) if validated_data else instance


class StockUpdateSerializer(serializers.Serializer):
    stock_quantity = serializers.IntegerField(min_value=0)
