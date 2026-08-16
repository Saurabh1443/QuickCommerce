from django.urls import path

from apps.dashboard import views

app_name = "dashboard"

urlpatterns = [
    path("dashboard/shopkeeper/", views.ShopkeeperDashboardView.as_view(),
        name="shopkeeper-dashboard"),
    path("dashboard/delivery/", views.DeliveryDashboardView.as_view(),
        name="delivery-dashboard"),
    path("dashboard/admin/", views.AdminDashboardView.as_view(), name="admin-dashboard"),
    path("admin/users/", views.AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<int:pk>/<str:action_name>/", views.AdminUserActionView.as_view(),
        name="admin-user-action"),
]
