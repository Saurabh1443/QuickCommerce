"""Base repository — the only layer allowed to talk to the Django ORM directly.

Layering used across every app in this backend:

    URL (urls.py)
      -> Controller (views.py)         request parsing, permission checks,
                                        serializer-driven validation/transformation
      -> Service (services.py)         business rules, calculations, orchestration
      -> Repository (repositories.py)  the only place `Model.objects` is touched

Controllers must never call `Model.objects` directly, and services must never call
`Model.objects` directly — both go through a repository. This keeps query
construction (select_related/prefetch_related/filtering) in one place per model, and
keeps services testable/mockable without a database.
"""


class BaseRepository:
    """Generic CRUD helpers shared by every concrete repository.

    Subclasses set ``model`` and optionally override ``base_queryset()`` to attach
    ``select_related``/``prefetch_related`` used by most reads.
    """

    model = None

    @classmethod
    def base_queryset(cls):
        return cls.model.objects.all()

    @classmethod
    def get_by_id(cls, pk):
        return cls.base_queryset().filter(pk=pk).first()

    @classmethod
    def require_by_id(cls, pk):
        """Like ``get_by_id`` but raises ``Model.DoesNotExist`` when missing."""
        return cls.base_queryset().get(pk=pk)

    @classmethod
    def all(cls):
        return cls.base_queryset()

    @classmethod
    def create(cls, **fields):
        return cls.model.objects.create(**fields)

    @classmethod
    def update(cls, instance, **fields):
        for field, value in fields.items():
            setattr(instance, field, value)
        update_fields = list(fields.keys())
        if hasattr(instance, "updated_at"):
            update_fields.append("updated_at")
        instance.save(update_fields=update_fields)
        return instance

    @classmethod
    def delete(cls, instance):
        instance.delete()

    @classmethod
    def exists(cls, **filters):
        return cls.model.objects.filter(**filters).exists()

    @classmethod
    def count(cls, **filters):
        """Flat-filter count, e.g. ``ShopRepository.count(status=ShopStatus.PENDING)``.

        For anything beyond a flat AND of filters (excludes, aggregates other than a
        plain count), add a purpose-built classmethod on the concrete repository.
        """
        return cls.model.objects.filter(**filters).count()
