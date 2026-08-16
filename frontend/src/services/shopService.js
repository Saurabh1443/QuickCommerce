import api from "./api";

export const shopService = {
  nearby: (params) => api.get("/shops/nearby/", { params }),
  detail: (slug, params) => api.get(`/shops/${slug}/`, { params }),
  myShop: () => api.get("/shops/my-shop/"),
  // Never set a manual multipart Content-Type header — see productService.js.
  updateMyShop: (payload) => api.patch("/shops/my-shop/", payload),
  adminList: (params) => api.get("/shops/admin/", { params }),
  adminDetail: (id) => api.get(`/shops/admin/${id}/`),
  approve: (id, reason = "") => api.post(`/shops/admin/${id}/approve/`, { reason }),
  reject: (id, reason) => api.post(`/shops/admin/${id}/reject/`, { reason }),
  suspend: (id, reason) => api.post(`/shops/admin/${id}/suspend/`, { reason }),
};
