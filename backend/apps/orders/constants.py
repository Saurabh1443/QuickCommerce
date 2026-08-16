from django.db import models


class OrderStatus(models.TextChoices):
    PLACED = "PLACED", "Order placed"
    ACCEPTED = "ACCEPTED", "Accepted by shop"
    PREPARING = "PREPARING", "Preparing"
    READY_FOR_PICKUP = "READY_FOR_PICKUP", "Ready for pickup"
    ASSIGNED = "ASSIGNED", "Delivery partner assigned"
    PICKED_UP = "PICKED_UP", "Picked up"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for delivery"
    DELIVERED = "DELIVERED", "Delivered"
    CANCELLED = "CANCELLED", "Cancelled"
    REJECTED = "REJECTED", "Rejected by shop"


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PAID = "PAID", "Paid"
    FAILED = "FAILED", "Failed"
    REFUNDED = "REFUNDED", "Refunded"


class PaymentMethod(models.TextChoices):
    ONLINE = "ONLINE", "Online payment"
    COD = "COD", "Cash on delivery"


# Statuses where the order is still moving through the system.
ACTIVE_STATUSES = (
    OrderStatus.PLACED,
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.ASSIGNED,
    OrderStatus.PICKED_UP,
    OrderStatus.OUT_FOR_DELIVERY,
)

TERMINAL_STATUSES = (OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED)

# Statuses whose reserved stock must be returned to inventory.
STOCK_RELEASING_STATUSES = (OrderStatus.CANCELLED, OrderStatus.REJECTED)

# The progress bar shown to the customer.
CUSTOMER_TIMELINE = (
    OrderStatus.PLACED,
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.ASSIGNED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
)
