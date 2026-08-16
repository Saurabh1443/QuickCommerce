from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.products import views

router = DefaultRouter()
router.register("manage", views.ManagedProductViewSet, basename="managed-product")

urlpatterns = [
    path("", views.PublicProductListView.as_view(), name="product-list"),
    *router.urls,
]
