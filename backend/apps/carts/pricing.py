"""Pure money maths for carts and orders — no ORM access.

Every total the customer sees and pays is produced from these functions applied to
database-sourced values, so a tampered frontend total can never influence what is
charged. Fetching the line items to feed in here is the job of the service layer
(``apps.carts.services.line_items_from_cart``), backed by a repository.
"""
from dataclasses import asdict, dataclass
from decimal import ROUND_HALF_UP, Decimal

TWO_PLACES = Decimal("0.01")
FREE_DELIVERY_ABOVE = Decimal("499.00")


def money(value):
    return Decimal(str(value or 0)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


@dataclass
class PriceBreakdown:
    subtotal: Decimal
    delivery_fee: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal

    def as_dict(self):
        return {key: str(money(value)) for key, value in asdict(self).items()}


def calculate(lines, shop, discount=0):
    """Compute the authoritative breakdown for a set of lines and a shop."""
    subtotal = money(sum((line["total_price"] for line in lines), Decimal("0")))
    delivery_fee = money(shop.delivery_fee) if shop else Decimal("0.00")
    if subtotal >= FREE_DELIVERY_ABOVE:
        delivery_fee = Decimal("0.00")
    discount = min(money(discount), subtotal)
    # GST on grocery baskets is item-specific; the MVP keeps it at zero but the field
    # stays in the breakdown so it can be switched on without a schema change.
    tax = Decimal("0.00")
    total = money(subtotal - discount + delivery_fee + tax)
    return PriceBreakdown(subtotal, delivery_fee, discount, tax, total)
