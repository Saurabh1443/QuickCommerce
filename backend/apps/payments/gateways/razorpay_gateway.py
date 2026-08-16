"""Razorpay strategy implementation.

Reads credentials from environment variables (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`)
via Django settings — never hard-coded. When those are blank and
`PAYMENTS_ALLOW_SANDBOX` is on, the gateway fabricates a clearly-labelled local order
so the whole checkout -> payment -> order flow stays testable without real credentials.
Signature verification always runs through Razorpay's own utility when a real order
was created, so nothing here should be trusted from the frontend alone.
"""
import hashlib
import hmac
import logging
import uuid

from django.conf import settings

from apps.payments.gateways.base import GatewayOrderResult, PaymentGateway, VerificationResult

logger = logging.getLogger(__name__)


class RazorpayGateway(PaymentGateway):
    name = "RAZORPAY"

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.currency = settings.RAZORPAY_CURRENCY
        self._sandbox = not (self.key_id and self.key_secret)

    @property
    def _client(self):
        import razorpay

        return razorpay.Client(auth=(self.key_id, self.key_secret))

    def create_order(self, *, payment):
        amount_paise = int(round(float(payment.amount) * 100))
        if self._sandbox:
            if not settings.PAYMENTS_ALLOW_SANDBOX:
                raise RuntimeError(
                    "RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are not configured and "
                    "PAYMENTS_ALLOW_SANDBOX is disabled."
                )
            order_id = f"sandbox_order_{uuid.uuid4().hex[:16]}"
            logger.warning(
                "Razorpay keys are not set; creating a SANDBOX order (%s) for %s. "
                "Set RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET for real test payments.",
                order_id, payment.order.order_number,
            )
            return GatewayOrderResult(
                gateway=self.name, gateway_order_id=order_id,
                amount=str(payment.amount), currency=self.currency, key_id="",
                extra={"sandbox": True},
            )

        order = self._client.order.create(
            {
                "amount": amount_paise,
                "currency": self.currency,
                "receipt": payment.order.order_number,
                "notes": {"order_id": str(payment.order_id)},
            }
        )
        return GatewayOrderResult(
            gateway=self.name, gateway_order_id=order["id"],
            amount=str(payment.amount), currency=self.currency, key_id=self.key_id,
            extra={"sandbox": False},
        )

    def verify_payment(self, *, payment, verification_data):
        razorpay_order_id = verification_data.get("razorpay_order_id", "")
        razorpay_payment_id = verification_data.get("razorpay_payment_id", "")
        razorpay_signature = verification_data.get("razorpay_signature", "")

        if payment.gateway_order_id.startswith("sandbox_order_"):
            # Sandbox mode: there is no real Razorpay signature to check. We only
            # confirm the client echoed back the same sandbox order id we issued.
            success = razorpay_order_id == payment.gateway_order_id
            return VerificationResult(
                success=success,
                gateway_payment_id=razorpay_payment_id or f"sandbox_pay_{uuid.uuid4().hex[:12]}",
                error_description="" if success else "Sandbox order id mismatch.",
                raw_response={"sandbox": True, **verification_data},
            )

        if razorpay_order_id != payment.gateway_order_id:
            return VerificationResult(
                success=False, error_description="Order id mismatch.",
                raw_response=verification_data,
            )

        expected_signature = hmac.new(
            key=self.key_secret.encode(),
            msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            digestmod=hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, razorpay_signature or ""):
            return VerificationResult(
                success=False, error_description="Signature verification failed.",
                raw_response=verification_data,
            )

        return VerificationResult(
            success=True, gateway_payment_id=razorpay_payment_id,
            raw_response=verification_data,
        )

    def verify_webhook(self, *, headers, body):
        secret = settings.RAZORPAY_WEBHOOK_SECRET
        if not secret:
            raise RuntimeError("RAZORPAY_WEBHOOK_SECRET is not configured.")
        signature = headers.get("X-Razorpay-Signature", "")
        expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ValueError("Invalid webhook signature.")
        import json

        return json.loads(body)
