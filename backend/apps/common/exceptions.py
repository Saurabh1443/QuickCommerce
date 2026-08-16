"""Consistent JSON error envelope for every API failure."""
import logging

from django.core.exceptions import ObjectDoesNotExist, ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


class DomainError(APIException):
    """Base class for business-rule violations raised by the service layer."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The request could not be completed."
    default_code = "domain_error"


class ConflictError(DomainError):
    status_code = status.HTTP_409_CONFLICT
    default_code = "conflict"


class NotFoundError(DomainError):
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "not_found"


class PaymentError(DomainError):
    default_code = "payment_error"


def _flatten(detail):
    """Turn DRF's nested error structures into a flat human readable message."""
    if isinstance(detail, dict):
        parts = []
        for field, value in detail.items():
            flat = _flatten(value)
            parts.append(flat if field == "detail" else f"{field}: {flat}")
        return " | ".join(parts)
    if isinstance(detail, (list, tuple)):
        return " ".join(_flatten(item) for item in detail)
    return str(detail)


def api_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        exc = APIException(detail=list(exc.messages))
        exc.status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(exc, ObjectDoesNotExist):
        exc = APIException(detail="Resource not found.")
        exc.status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, IntegrityError):
        logger.warning("Integrity error: %s", exc)
        exc = APIException(detail="This action conflicts with existing data.")
        exc.status_code = status.HTTP_409_CONFLICT

    response = drf_exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled server error", exc_info=exc)
        return Response(
            {
                "success": False,
                "error": {"code": "server_error", "message": "Something went wrong on our side."},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data
    code = getattr(exc, "default_code", "error")
    if isinstance(detail, dict) and "detail" in detail and len(detail) == 1:
        message = _flatten(detail["detail"])
        fields = {}
    else:
        message = _flatten(detail)
        fields = detail if isinstance(detail, dict) else {}

    response.data = {
        "success": False,
        "error": {"code": code, "message": message, "fields": fields},
    }
    return response
