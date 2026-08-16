from django.urls import path

from apps.notifications import views

app_name = "notifications"

urlpatterns = [
    path("", views.MyNotificationsView.as_view(), name="my-notifications"),
    path("admin/", views.AdminNotificationListView.as_view(), name="admin-list"),
]
