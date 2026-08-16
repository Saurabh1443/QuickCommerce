"""Resolves a gateway key (e.g. 'RAZORPAY') to a configured strategy instance.

Backed by `settings.PAYMENT_GATEWAYS`, a plain dict of key -> dotted class path, so
enabling Stripe later is a one-line settings change plus a new gateway class.
"""
from functools import lru_cache

from django.conf import settings
from django.utils.module_loading import import_string


@lru_cache(maxsize=None)
def _load_gateway_class(dotted_path):
    return import_string(dotted_path)


def get_gateway(key):
    key = (key or "").upper()
    mapping = settings.PAYMENT_GATEWAYS
    if key not in mapping:
        raise ValueError(
            f"Unknown payment gateway '{key}'. Configured gateways: {list(mapping)}."
        )
    return _load_gateway_class(mapping[key])()


def gateway_for_method(method):
    """ONLINE -> the platform default online gateway; COD -> the COD strategy."""
    if method == "COD":
        return get_gateway("COD")
    return get_gateway(settings.DEFAULT_ONLINE_GATEWAY)
