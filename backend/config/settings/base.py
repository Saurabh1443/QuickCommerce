"""Base Django settings shared across all environments."""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")


# ----------------------------------------------------------------------
# Environment helpers
# ----------------------------------------------------------------------

def env(key, default=None):
    value = os.environ.get(key)
    return default if value in (None, "") else value


def env_bool(key, default=False):
    return str(env(key, str(default))).strip().lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


def env_list(key, default=""):
    return [
        item.strip()
        for item in str(env(key, default)).split(",")
        if item.strip()
    ]


# ----------------------------------------------------------------------
# Core Django
# ----------------------------------------------------------------------

SECRET_KEY = env("SECRET_KEY", "dev-insecure-key-change-me")

ALLOWED_HOSTS = env_list(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,0.0.0.0",
)


INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",

    # Local
    "apps.common",
    "apps.events",
    "apps.accounts",
    "apps.locations",
    "apps.catalog",
    "apps.shops",
    "apps.products",
    "apps.carts",
    "apps.orders",
    "apps.payments",
    "apps.delivery",
    "apps.notifications",
    "apps.dashboard",
]


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# ----------------------------------------------------------------------
# Database
# ----------------------------------------------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / env("SQLITE_NAME", "db.sqlite3"),
    }
}


# ----------------------------------------------------------------------
# Authentication
# ----------------------------------------------------------------------

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME":
        "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME":
        "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME":
        "django.contrib.auth.password_validation.CommonPasswordValidator"
    },
    {
        "NAME":
        "django.contrib.auth.password_validation.NumericPasswordValidator"
    },
]


# ----------------------------------------------------------------------
# Internationalization
# ----------------------------------------------------------------------

LANGUAGE_CODE = "en-us"

TIME_ZONE = env("TIME_ZONE", "Asia/Kolkata")

USE_I18N = True
USE_TZ = True


# ----------------------------------------------------------------------
# Static / Media
# ----------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ----------------------------------------------------------------------
# File uploads
# ----------------------------------------------------------------------

FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
MAX_UPLOAD_SIZE_MB = int(env("MAX_UPLOAD_SIZE_MB", "5"))


# ----------------------------------------------------------------------
# Django REST Framework
# ----------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS":
        "apps.common.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 12,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "EXCEPTION_HANDLER": "apps.common.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "auth": "30/min",
        "payments": "60/min",
    },
}


# ----------------------------------------------------------------------
# JWT
# ----------------------------------------------------------------------

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(env("JWT_ACCESS_MINUTES", "60"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(env("JWT_REFRESH_DAYS", "7"))
    ),
    "ROTATE_REFRESH_TOKENS": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER":
        "apps.accounts.serializers.QuickCommerceTokenObtainSerializer",
}


# ----------------------------------------------------------------------
# CORS / CSRF
# ----------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS


# ----------------------------------------------------------------------
# Maps / business defaults
# ----------------------------------------------------------------------

GOOGLE_MAPS_API_KEY = env("GOOGLE_MAPS_API_KEY", "")

SHOP_DISCOVERY_RADIUS_KM = float(
    env("SHOP_DISCOVERY_RADIUS_KM", "10")
)

DEFAULT_DELIVERY_FEE = float(
    env("DEFAULT_DELIVERY_FEE", "25")
)

FRONTEND_BASE_URL = env(
    "FRONTEND_BASE_URL",
    "http://localhost:5173",
)