from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.pagination import StandardResultsSetPagination
from apps.common.permissions import IsShopkeeperOrAdmin
from apps.products import services
from apps.products.models import Product
from apps.products.serializers import (
    ProductSerializer,
    ProductWriteSerializer,
    StockUpdateSerializer,
)


class CatalogPagination(StandardResultsSetPagination):
    """A shop's product catalog is small at MVP scale; default to showing it in full
    rather than silently cutting it off at the platform-wide 12-per-page default."""

    page_size = 100


class PublicProductListView(ListAPIView):
    """Controller: GET /api/products/?shop=<slug or id>&category=&search=&in_stock=true

    Query param parsing only — the actual filtering lives in
    ``apps.products.services.list_public_products``.
    """

    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)
    pagination_class = CatalogPagination

    def get_queryset(self):
        params = self.request.query_params
        return services.list_public_products(
            shop=params.get("shop"),
            category=params.get("category"),
            search=params.get("search"),
            in_stock=params.get("in_stock") == "true",
        )


class ManagedProductViewSet(ModelViewSet):
    """Controller: product CRUD for shopkeepers (own shop only) and platform admins
    (any shop). Shop resolution and persistence live in the service/repository layers.
    """

    permission_classes = (IsShopkeeperOrAdmin,)
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    serializer_class = ProductWriteSerializer
    pagination_class = CatalogPagination
    filterset_fields = ("category", "is_available", "shop")
    search_fields = ("name", "description")
    ordering_fields = ("name", "price", "stock_quantity", "created_at")

    def get_queryset(self):
        return services.list_managed_products(self.request.user)

    def get_serializer(self, *args, **kwargs):
        """Force ``shop`` into the payload before validation.

        The model has a ``unique_together``-style constraint on (shop, name, unit),
        so DRF's auto-generated validator requires ``shop`` to be present in the input
        at validation time — it cannot be supplied only via ``serializer.save(shop=...)``
        after the fact. A shopkeeper's own shop always wins over anything sent by the
        client, so a forged ``shop`` id in the payload can never move a product.
        """
        if "data" in kwargs and self.action in ("create", "update", "partial_update"):
            data = kwargs["data"]
            mutable = data.copy() if hasattr(data, "copy") else dict(data)
            instance = args[0] if args else None
            existing_shop_id = instance.shop_id if isinstance(instance, Product) else None
            shop = services.resolve_shop_for_product_write(
                self.request.user, mutable.get("shop") or existing_shop_id
            )
            mutable["shop"] = shop.id
            kwargs["data"] = mutable
        return super().get_serializer(*args, **kwargs)

    def update(self, request, *args, **kwargs):
        # Never let the shop of an existing product be reassigned via the payload.
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=kwargs.get("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(shop=instance.shop)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="stock")
    def update_stock(self, request, pk=None):
        product = self.get_object()
        serializer = StockUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = services.update_stock(product, serializer.validated_data["stock_quantity"])
        return Response(ProductSerializer(product).data)

    @action(detail=True, methods=["post"], url_path="toggle-availability")
    def toggle_availability(self, request, pk=None):
        product = services.toggle_availability(self.get_object())
        return Response(ProductSerializer(product).data)
