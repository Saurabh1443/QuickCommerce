"""Read-only aggregate stats per role. No business rules live here — just reporting.

Every number here is produced by a repository call — this app owns no model of its
own, so it leans entirely on the repositories of the apps it reports on.
"""
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts import services as account_services
from apps.accounts.constants import Role
from apps.accounts.repositories import UserRepository
from apps.accounts.serializers import UserSerializer
from apps.common.exceptions import DomainError
from apps.common.permissions import IsDeliveryPartner, IsPlatformAdmin, IsShopkeeper
from apps.delivery.models import DeliveryStatus
from apps.delivery.repositories import DeliveryPartnerProfileRepository, DeliveryRepository
from apps.orders.constants import OrderStatus, PaymentStatus
from apps.orders.repositories import OrderRepository
from apps.payments.constants import PaymentTransactionStatus
from apps.payments.repositories import PaymentRepository
from apps.products.repositories import ProductRepository
from apps.shops.constants import ShopStatus
from apps.shops.repositories import ShopRepository


def _today_range():
    now = timezone.localtime()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timezone.timedelta(days=1)


class ShopkeeperDashboardView(APIView):
    permission_classes = (IsShopkeeper,)

    def get(self, request):
        shop = ShopRepository.get_by_owner(request.user)
        if not shop:
            raise DomainError("No shop is linked to this account.")

        start, end = _today_range()
        return Response({
            "shop_status": shop.status,
            "today_orders": OrderRepository.count(
                shop=shop, created_at__gte=start, created_at__lt=end
            ),
            "today_sales": OrderRepository.sum_total_amount(
                shop=shop, created_at__gte=start, created_at__lt=end,
                payment_status=PaymentStatus.PAID,
            ),
            "pending_orders": OrderRepository.count(
                shop=shop,
                status__in=(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING),
            ),
            "total_products": ProductRepository.count(shop=shop),
            "low_stock_products": ProductRepository.count(
                shop=shop, stock_quantity__gt=0, stock_quantity__lte=5
            ),
        })


class DeliveryDashboardView(APIView):
    permission_classes = (IsDeliveryPartner,)

    def get(self, request):
        profile = DeliveryPartnerProfileRepository.get_or_create_for_user(request.user)
        start, end = _today_range()
        delivered_today = dict(
            partner=request.user, status=DeliveryStatus.DELIVERED,
            delivery_time__gte=start, delivery_time__lt=end,
        )
        return Response({
            "is_online": profile.is_online,
            "is_approved": profile.is_approved,
            "today_deliveries": DeliveryRepository.count(**delivered_today),
            "today_earnings": DeliveryRepository.sum_order_delivery_fee(**delivered_today),
            "active_deliveries": DeliveryRepository.count_active_for_partner(request.user),
            "total_deliveries": profile.total_deliveries,
            "rating": profile.rating,
        })


class AdminDashboardView(APIView):
    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        start, end = _today_range()
        today_filter = dict(created_at__gte=start, created_at__lt=end)
        return Response({
            "total_customers": UserRepository.count_by_role(Role.CUSTOMER),
            "total_shops": ShopRepository.count(),
            "pending_shop_approvals": ShopRepository.count(status=ShopStatus.PENDING),
            "total_orders": OrderRepository.count(),
            "todays_orders": OrderRepository.count(**today_filter),
            "todays_revenue": OrderRepository.sum_total_amount(
                **today_filter, payment_status=PaymentStatus.PAID
            ),
            "active_delivery_partners": DeliveryPartnerProfileRepository.count(
                is_online=True, is_approved=True
            ),
            "total_delivery_partners": DeliveryPartnerProfileRepository.count(),
            "pending_delivery_approvals": DeliveryPartnerProfileRepository.count(
                is_approved=False
            ),
            "successful_payments": PaymentRepository.count(
                status=PaymentTransactionStatus.SUCCESS
            ),
            "orders_by_status": OrderRepository.status_breakdown(),
        })


class AdminUserListView(APIView):
    """GET /api/admin/users/?role=CUSTOMER&search=... — platform-wide user directory."""

    permission_classes = (IsPlatformAdmin,)

    def get(self, request):
        users = account_services.list_users(
            role=request.query_params.get("role"),
            search=request.query_params.get("search"),
        )
        return Response(UserSerializer(users, many=True).data)


class AdminUserActionView(APIView):
    permission_classes = (IsPlatformAdmin,)

    def post(self, request, pk, action_name):
        user = UserRepository.get_by_id(pk)
        if not user:
            raise DomainError("User not found.")
        if action_name == "activate":
            user = account_services.set_user_active(user, True)
        elif action_name == "deactivate":
            user = account_services.set_user_active(user, False)
        else:
            raise DomainError("Unknown action.")
        return Response(UserSerializer(user).data)
