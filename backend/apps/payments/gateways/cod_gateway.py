"""Cash-on-delivery is modelled as a gateway too, so orders/payments code never needs
an `if method == 'COD'` special case — it just resolves a different strategy.
"""
from apps.payments.gateways.base import GatewayOrderResult, PaymentGateway, VerificationResult


class CashOnDeliveryGateway(PaymentGateway):
    name = "COD"

    def create_order(self, *, payment):
        # No external order to create; the "order id" is a local marker.
        return GatewayOrderResult(
            gateway=self.name,
            gateway_order_id=f"cod_{payment.order.order_number}",
            amount=str(payment.amount),
            currency=payment.currency,
            extra={"instructions": "Pay the delivery partner in cash upon delivery."},
        )

    def verify_payment(self, *, payment, verification_data):
        # COD has nothing to verify at checkout time; it is settled on delivery.
        return VerificationResult(success=True, gateway_payment_id=payment.gateway_order_id)
