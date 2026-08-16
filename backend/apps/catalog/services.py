"""Category business logic. Thin by design — the taxonomy has few rules today, but
the layering stays consistent with every other app so new rules (e.g. preventing
deletion of a category still in use) have one obvious place to live.
"""
from apps.catalog.repositories import CategoryRepository


def list_categories(*, include_inactive=False):
    return CategoryRepository.all_ordered() if include_inactive else CategoryRepository.active()


def create_category(validated_data):
    return CategoryRepository.create(**validated_data)


def update_category(instance, validated_data):
    return CategoryRepository.update(instance, **validated_data) if validated_data else instance


def delete_category(instance):
    CategoryRepository.delete(instance)
