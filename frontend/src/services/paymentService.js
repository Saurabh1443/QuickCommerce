import api from "./api";

export const paymentService = {
  methods: () => api.get("/payments/methods/"),
  initiate: (order_id) => api.post("/payments/initiate/", { order_id }),
  verify: (payload) => api.post("/payments/verify/", payload),
  orderStatus: (orderId) => api.get(`/payments/orders/${orderId}/status/`),
  adminList: () => api.get("/payments/admin/"),
};
