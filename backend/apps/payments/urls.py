from django.urls import path

from apps.payments import views

app_name = "payments"

urlpatterns = [
    path("methods/", views.PaymentMethodsView.as_view(), name="methods"),
    path("initiate/", views.InitiatePaymentView.as_view(), name="initiate"),
    path("verify/", views.VerifyPaymentView.as_view(), name="verify"),
    path("orders/<int:order_id>/status/", views.OrderPaymentStatusView.as_view(),
        name="order-status"),
    path("admin/", views.AdminPaymentListView.as_view(), name="admin-list"),
    path("webhook/razorpay/", views.RazorpayWebhookView.as_view(), name="razorpay-webhook"),
]
