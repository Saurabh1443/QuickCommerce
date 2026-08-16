from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.shops import views

router = DefaultRouter()
router.register("admin", views.AdminShopViewSet, basename="admin-shop")

urlpatterns = [
    path("register/", views.ShopRegisterView.as_view(), name="shop-register"),
    path("nearby/", views.NearbyShopListView.as_view(), name="shop-nearby"),
    path("my-shop/", views.MyShopView.as_view(), name="my-shop"),
    *router.urls,
    path("<slug:slug>/", views.PublicShopDetailView.as_view(), name="shop-detail"),
]
