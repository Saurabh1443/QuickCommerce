"""The published domain event contract.

Producers (services) only ever reference these constants; consumers subscribe to them.
Adding a new consumer (push notification, analytics, webhook) never requires touching
the producing code.
"""


class EventType:
    USER_REGISTERED = "user.registered"

    SHOP_SUBMITTED = "shop.submitted"
    SHOP_APPROVED = "shop.approved"
    SHOP_REJECTED = "shop.rejected"
    SHOP_SUSPENDED = "shop.suspended"

    ORDER_PLACED = "order.placed"
    ORDER_STATUS_CHANGED = "order.status_changed"
    ORDER_CANCELLED = "order.cancelled"
    ORDER_DELIVERED = "order.delivered"

    PAYMENT_INITIATED = "payment.initiated"
    PAYMENT_SUCCEEDED = "payment.succeeded"
    PAYMENT_FAILED = "payment.failed"

    DELIVERY_ASSIGNED = "delivery.assigned"
    DELIVERY_STATUS_CHANGED = "delivery.status_changed"

    PRODUCT_LOW_STOCK = "product.low_stock"

    @classmethod
    def all(cls):
        return [
            value
            for key, value in vars(cls).items()
            if key.isupper() and isinstance(value, str)
        ]
