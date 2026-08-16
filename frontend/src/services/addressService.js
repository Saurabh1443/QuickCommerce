import api from "./api";

export const addressService = {
  list: () => api.get("/addresses/"),
  create: (payload) => api.post("/addresses/", payload),
  update: (id, payload) => api.patch(`/addresses/${id}/`, payload),
  remove: (id) => api.delete(`/addresses/${id}/`),
  setDefault: (id) => api.post(`/addresses/${id}/set-default/`),
};
