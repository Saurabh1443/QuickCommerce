"""All direct ORM access for Category lives here."""
from apps.catalog.models import Category
from apps.common.repositories import BaseRepository


class CategoryRepository(BaseRepository):
    model = Category

    @classmethod
    def all_ordered(cls):
        return cls.model.objects.all()

    @classmethod
    def active(cls):
        return cls.model.objects.filter(is_active=True)
