import api from "./api";

export const authService = {
  login: (email, password) => api.post("/auth/login/", { email, password }),
  registerCustomer: (payload) => api.post("/auth/register/", payload),
  registerShopkeeper: (payload) => api.post("/shops/register/", payload),
  registerDeliveryPartner: (payload) => api.post("/delivery/register/", payload),
  me: () => api.get("/auth/me/"),
  // Never set a manual multipart Content-Type header — see productService.js.
  updateProfile: (payload) => api.patch("/auth/me/", payload),
  changePassword: (payload) => api.post("/auth/change-password/", payload),
};
