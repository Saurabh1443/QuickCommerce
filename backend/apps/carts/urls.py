from django.urls import path

from apps.carts import views

app_name = "carts"

urlpatterns = [
    path("", views.CartView.as_view(), name="cart"),
    path("items/", views.CartItemsView.as_view(), name="cart-items"),
    path("items/<int:item_id>/", views.CartItemDetailView.as_view(), name="cart-item-detail"),
]
