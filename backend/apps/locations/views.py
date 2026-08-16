from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.locations import services
from apps.locations.repositories import AddressRepository
from apps.locations.serializers import AddressSerializer


class AddressViewSet(ModelViewSet):
    """Controller: CRUD for the caller's own addresses.

    Reads go through ``AddressRepository``; writes go through
    ``AddressSerializer`` -> ``apps.locations.services``. Queryset scoping to the
    authenticated user is the security boundary.
    """

    serializer_class = AddressSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = None

    def get_queryset(self):
        return AddressRepository.for_user(self.request.user)

    @action(detail=True, methods=["post"], url_path="set-default")
    def set_default(self, request, pk=None):
        address = self.get_object()
        address = services.set_default_address(request.user, address)
        return Response(self.get_serializer(address).data)
