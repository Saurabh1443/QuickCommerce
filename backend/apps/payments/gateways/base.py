"""Payment gateway strategy contract.

Every gateway (Razorpay today, Stripe/others later) implements this interface. The
service layer (`apps.payments.services`) only ever talks to `PaymentGateway`, so adding
a new provider is: write a class + one line in `settings.PAYMENT_GATEWAYS`.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class GatewayOrderResult:
    """What the frontend needs to open its checkout widget."""

    gateway: str
    gateway_order_id: str
    amount: str
    currency: str
    key_id: str = ""
    extra: dict = field(default_factory=dict)


@dataclass
class VerificationResult:
    success: bool
    gateway_payment_id: str = ""
    error_code: str = ""
    error_description: str = ""
    raw_response: dict = field(default_factory=dict)


class PaymentGateway(ABC):
    """Strategy interface implemented by every payment provider."""

    name: str = "BASE"

    @abstractmethod
    def create_order(self, *, payment) -> GatewayOrderResult:
        """Register the payment intent with the provider and return checkout data."""

    @abstractmethod
    def verify_payment(self, *, payment, verification_data: dict) -> VerificationResult:
        """Confirm a client-reported payment is genuine (signature/amount checks)."""

    def verify_webhook(self, *, headers: dict, body: bytes) -> dict:
        """Optional: verify an async webhook payload. Returns the parsed event."""
        raise NotImplementedError(f"{self.name} does not support webhooks yet.")
