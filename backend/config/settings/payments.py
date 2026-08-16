"""Payment-related settings."""

from .base import env, env_bool


PAYMENT_GATEWAYS = {
    "RAZORPAY":
        "apps.payments.gateways.razorpay_gateway.RazorpayGateway",

    "COD":
        "apps.payments.gateways.cod_gateway.CashOnDeliveryGateway",
}

# "STRIPE":
#     "apps.payments.gateways.stripe_gateway.StripeGateway",

DEFAULT_ONLINE_GATEWAY = env(
    "DEFAULT_ONLINE_GATEWAY",
    "RAZORPAY",
)


RAZORPAY_KEY_ID = env(
    "RAZORPAY_KEY_ID",
    "",
)

RAZORPAY_KEY_SECRET = env(
    "RAZORPAY_KEY_SECRET",
    "",
)

RAZORPAY_WEBHOOK_SECRET = env(
    "RAZORPAY_WEBHOOK_SECRET",
    "",
)

RAZORPAY_CURRENCY = env(
    "RAZORPAY_CURRENCY",
    "INR",
)


PAYMENTS_ALLOW_SANDBOX = env_bool(
    "PAYMENTS_ALLOW_SANDBOX",
    True,
)