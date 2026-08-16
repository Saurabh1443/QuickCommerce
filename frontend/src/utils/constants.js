export const ROLES = {
  CUSTOMER: "CUSTOMER",
  SHOPKEEPER: "SHOPKEEPER",
  DELIVERY_PARTNER: "DELIVERY_PARTNER",
  ADMIN: "ADMIN",
};

export const ORDER_STATUS_LABELS = {
  PLACED: "Order placed",
  ACCEPTED: "Accepted by shop",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  ASSIGNED: "Delivery partner assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export const CUSTOMER_TIMELINE = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const ORDER_STATUS_COLORS = {
  PLACED: "info",
  ACCEPTED: "info",
  PREPARING: "warning",
  READY_FOR_PICKUP: "warning",
  ASSIGNED: "secondary",
  PICKED_UP: "secondary",
  OUT_FOR_DELIVERY: "secondary",
  DELIVERED: "success",
  CANCELLED: "error",
  REJECTED: "error",
};

export const PAYMENT_STATUS_COLORS = {
  CREATED: "default",
  PENDING: "warning",
  PAID: "success",
  SUCCESS: "success",
  FAILED: "error",
  CANCELLED: "error",
  REFUNDED: "info",
};

export const SHOP_STATUS_COLORS = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  SUSPENDED: "error",
};

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

export const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bengaluru
