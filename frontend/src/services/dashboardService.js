import api from "./api";

export const dashboardService = {
  shopkeeper: () => api.get("/dashboard/shopkeeper/"),
  delivery: () => api.get("/dashboard/delivery/"),
  admin: () => api.get("/dashboard/admin/"),
  adminUsers: (params) => api.get("/admin/users/", { params }),
  adminUserAction: (id, action) => api.post(`/admin/users/${id}/${action}/`),
};
