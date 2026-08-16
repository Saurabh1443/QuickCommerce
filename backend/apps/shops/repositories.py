"""All direct ORM access for Shop/ShopKyc lives here."""
from django.db.models import Q

from apps.common.geo import filter_by_radius
from apps.common.repositories import BaseRepository
from apps.shops.models import Shop, ShopKyc


class ShopRepository(BaseRepository):
    model = Shop

    @classmethod
    def base_queryset(cls):
        return cls.model.objects.select_related("category")

    @classmethod
    def customer_visible(cls):
        return cls.model.objects.customer_visible().select_related("category")

    @classmethod
    def get_visible_by_slug(cls, slug):
        return cls.customer_visible().select_related("owner").filter(slug=slug).first()

    @classmethod
    def get_by_owner(cls, user):
        return cls.model.objects.filter(owner=user).select_related("category").first()

    @classmethod
    def admin_queryset(cls):
        return cls.model.objects.select_related("category", "owner", "kyc")

    @classmethod
    def search(cls, queryset, term):
        return queryset.filter(
            Q(name__icontains=term)
            | Q(description__icontains=term)
            | Q(category__name__icontains=term)
            | Q(products__name__icontains=term)
        ).distinct()

    @classmethod
    def by_category(cls, queryset, category_id):
        return queryset.filter(category_id=category_id)

    @classmethod
    def by_city(cls, queryset, city):
        return queryset.filter(city__iexact=city)

    @classmethod
    def within_radius(cls, queryset, latitude, longitude, radius_km):
        return filter_by_radius(queryset, latitude, longitude, radius_km)

    @classmethod
    def create_shop(cls, *, owner, **fields):
        return cls.model.objects.create(owner=owner, **fields)


class ShopKycRepository(BaseRepository):
    model = ShopKyc

    @classmethod
    def create_for_shop(cls, shop, **fields):
        return cls.model.objects.create(shop=shop, **fields)

    @classmethod
    def get_or_create_for_shop(cls, shop):
        return cls.model.objects.get_or_create(shop=shop)
