from django.urls import path

from apps.delivery import views

app_name = "delivery"

urlpatterns = [
    path("register/", views.DeliveryPartnerRegisterView.as_view(), name="register"),
    path("profile/", views.MyDeliveryProfileView.as_view(), name="profile"),
    path("availability/", views.AvailabilityView.as_view(), name="availability"),
    path("available-orders/", views.AvailableOrdersView.as_view(), name="available-orders"),
    path("my-deliveries/", views.MyDeliveriesView.as_view(), name="my-deliveries"),
    path("<int:pk>/", views.DeliveryDetailView.as_view(), name="delivery-detail"),
    path("<int:pk>/transition/", views.DeliveryDetailView.as_view(), name="delivery-transition"),
    path("admin/partners/", views.AdminDeliveryPartnerListView.as_view(),
        name="admin-partners"),
    path("admin/partners/<int:pk>/<str:action_name>/",
        views.AdminDeliveryPartnerActionView.as_view(), name="admin-partner-action"),
    path("admin/orders/<int:order_id>/assign/", views.AdminAssignDeliveryView.as_view(),
        name="admin-assign"),
    path("admin/active/", views.AdminActiveDeliveriesView.as_view(), name="admin-active"),
]
