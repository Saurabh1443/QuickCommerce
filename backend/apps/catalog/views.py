from rest_framework.viewsets import ModelViewSet

from apps.catalog import services
from apps.catalog.serializers import CategorySerializer
from apps.common.permissions import ReadOnlyOrAdmin


class CategoryViewSet(ModelViewSet):
    """Controller: public read access; only platform admins can change the taxonomy."""

    serializer_class = CategorySerializer
    permission_classes = (ReadOnlyOrAdmin,)
    pagination_class = None
    search_fields = ("name",)

    def get_queryset(self):
        user = self.request.user
        is_admin = user.is_authenticated and user.role == "ADMIN"
        include_inactive = is_admin or self.request.query_params.get("all") == "true"
        return services.list_categories(include_inactive=include_inactive)

    def perform_destroy(self, instance):
        services.delete_category(instance)
