"""Lightweight geo helpers.

Deliberately simple for the MVP: haversine distance computed in Python plus a
bounding-box pre-filter so the database still does the heavy narrowing. The public
signatures are what a PostGIS/`ST_DWithin` implementation would use, so the storage
layer can be swapped later without touching callers.
"""
from math import asin, cos, degrees, radians, sin, sqrt

EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1, lng1, lat2, lng2):
    """Great-circle distance between two points in kilometres."""
    if None in (lat1, lng1, lat2, lng2):
        return None
    lat1, lng1, lat2, lng2 = map(lambda v: radians(float(v)), (lat1, lng1, lat2, lng2))
    dlat, dlng = lat2 - lat1, lng2 - lng1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return round(2 * EARTH_RADIUS_KM * asin(sqrt(a)), 3)


def bounding_box(latitude, longitude, radius_km):
    """Return (min_lat, max_lat, min_lng, max_lng) enclosing the search radius."""
    latitude, longitude, radius_km = float(latitude), float(longitude), float(radius_km)
    lat_delta = degrees(radius_km / EARTH_RADIUS_KM)
    # Longitude degrees shrink as latitude grows; clamp cos() to avoid division by zero.
    lng_delta = degrees(radius_km / (EARTH_RADIUS_KM * max(cos(radians(latitude)), 0.01)))
    return (
        latitude - lat_delta,
        latitude + lat_delta,
        longitude - lng_delta,
        longitude + lng_delta,
    )


def filter_by_radius(queryset, latitude, longitude, radius_km, lat_field="latitude",
                     lng_field="longitude"):
    """Narrow a queryset to a bounding box around the point (cheap SQL pre-filter)."""
    min_lat, max_lat, min_lng, max_lng = bounding_box(latitude, longitude, radius_km)
    return queryset.filter(
        **{
            f"{lat_field}__gte": min_lat,
            f"{lat_field}__lte": max_lat,
            f"{lng_field}__gte": min_lng,
            f"{lng_field}__lte": max_lng,
        }
    )


def estimate_delivery_minutes(distance_km, prep_minutes=15, kmph=18):
    """Rough ETA window used on shop cards and order confirmations."""
    if distance_km is None:
        return prep_minutes, prep_minutes + 15
    travel = (float(distance_km) / kmph) * 60
    low = int(prep_minutes + travel)
    return max(low, 10), max(low, 10) + 10
