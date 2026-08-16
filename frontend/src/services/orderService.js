import api from "./api";

export const orderService = {
  list: (params) => api.get("/orders/", { params }),
  detail: (id) => api.get(`/orders/${id}/`),
  place: (payload) => api.post("/orders/", payload),
  transition: (id, status, note = "") => api.post(`/orders/${id}/transition/`, { status, note }),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel/`, { reason }),
};
