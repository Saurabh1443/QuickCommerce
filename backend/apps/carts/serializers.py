from rest_framework import serializers

from apps.carts.models import Cart, CartItem
from apps.products.serializers import ProductSerializer
from apps.shops.serializers import ShopCardSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "product", "quantity", "unit_price", "total_price")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    shop = ShopCardSerializer(read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    totals = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "shop", "items", "item_count", "totals", "updated_at")

    def get_totals(self, obj):
        from apps.carts.services import get_cart_totals

        return get_cart_totals(obj).as_dict()


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    replace_cart = serializers.BooleanField(
        default=False, help_text="Set true to discard items from another shop."
    )


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)
