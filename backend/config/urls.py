from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "service": "quickcommerce-api"})


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/addresses/", include("apps.locations.urls")),
    path("api/categories/", include("apps.catalog.urls")),
    path("api/shops/", include("apps.shops.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/cart/", include("apps.carts.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/delivery/", include("apps.delivery.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/", include("apps.dashboard.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
