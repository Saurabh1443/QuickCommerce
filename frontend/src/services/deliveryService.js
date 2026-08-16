import api from "./api";

export const deliveryService = {
  profile: () => api.get("/delivery/profile/"),
  updateProfile: (payload) => api.patch("/delivery/profile/", payload),
  setAvailability: (payload) => api.post("/delivery/availability/", payload),
  availableOrders: () => api.get("/delivery/available-orders/"),
  myDeliveries: (params) => api.get("/delivery/my-deliveries/", { params }),
  detail: (id) => api.get(`/delivery/${id}/`),
  transition: (id, status) => api.post(`/delivery/${id}/transition/`, { status }),
  adminPartners: () => api.get("/delivery/admin/partners/"),
  adminPartnerAction: (id, action) => api.post(`/delivery/admin/partners/${id}/${action}/`),
  adminAssign: (orderId, partnerId) =>
    api.post(`/delivery/admin/orders/${orderId}/assign/`, { partner_id: partnerId }),
  adminActive: () => api.get("/delivery/admin/active/"),
};
