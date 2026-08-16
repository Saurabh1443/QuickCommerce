"""All direct ORM access for Product lives here."""
from django.db.models import Q

from apps.accounts.constants import Role
from apps.common.repositories import BaseRepository
from apps.products.models import Product


class ProductRepository(BaseRepository):
    model = Product

    @classmethod
    def base_queryset(cls):
        return cls.model.objects.select_related("shop", "category")

    @classmethod
    def public_queryset(cls):
        return cls.base_queryset().filter(shop__status="APPROVED", is_available=True)

    @classmethod
    def managed_queryset_for(cls, user):
        queryset = cls.base_queryset()
        if user.role == Role.SHOPKEEPER:
            return queryset.filter(shop__owner=user)
        return queryset

    @classmethod
    def by_shop(cls, queryset, shop_ref):
        shop_ref = str(shop_ref)
        return queryset.filter(Q(shop__id=shop_ref) if shop_ref.isdigit() else Q(shop__slug=shop_ref))

    @classmethod
    def by_category(cls, queryset, category_id):
        return queryset.filter(category_id=category_id)

    @classmethod
    def search(cls, queryset, term):
        return queryset.filter(
            Q(name__icontains=term) | Q(description__icontains=term)
            | Q(category__name__icontains=term)
        )

    @classmethod
    def in_stock(cls, queryset):
        return queryset.filter(stock_quantity__gt=0)

    @classmethod
    def get_with_shop(cls, pk):
        return cls.model.objects.select_related("shop").filter(pk=pk).first()

    @classmethod
    def get_for_update(cls, pk):
        """Row-locked read used inside atomic stock-mutating transactions."""
        return cls.model.objects.select_for_update().get(pk=pk)

    @classmethod
    def orderable(cls):
        return cls.model.objects.orderable()
