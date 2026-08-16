from rest_framework.response import Response
from rest_framework.views import APIView

from apps.carts import services
from apps.carts.repositories import CartRepository
from apps.carts.serializers import (
    AddCartItemSerializer,
    CartSerializer,
    UpdateCartItemSerializer,
)
from apps.common.permissions import IsCustomer


class CartBaseView(APIView):
    permission_classes = (IsCustomer,)

    def cart_response(self, cart):
        cart = CartRepository.refresh(cart)
        return Response(CartSerializer(cart, context={"request": self.request}).data)


class CartView(CartBaseView):
    """GET /api/cart/ — the caller's cart with server-calculated totals."""

    def get(self, request):
        return self.cart_response(services.get_or_create_cart(request.user))

    def delete(self, request):
        return self.cart_response(services.clear_cart(request.user))


class CartItemsView(CartBaseView):
    """POST /api/cart/items/ — add or increment a product."""

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = services.add_item(customer=request.user, **serializer.validated_data)
        return self.cart_response(cart)


class CartItemDetailView(CartBaseView):
    """PATCH/DELETE /api/cart/items/<id>/ — change quantity or remove the line."""

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = services.set_item_quantity(
            customer=request.user, item_id=item_id,
            quantity=serializer.validated_data["quantity"],
        )
        return self.cart_response(cart)

    def delete(self, request, item_id):
        cart = services.remove_item(customer=request.user, item_id=item_id)
        return self.cart_response(cart)
