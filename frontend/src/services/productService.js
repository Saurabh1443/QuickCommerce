import api from "./api";

// NOTE: never set a manual "Content-Type: multipart/form-data" header for FormData
// bodies — the browser must generate that header itself (it includes a boundary
// axios/JS cannot supply), otherwise Django's multipart parser cannot read the body.
export const productService = {
  list: (params) => api.get("/products/", { params }),
  manageList: (params) => api.get("/products/manage/", { params }),
  manageDetail: (id) => api.get(`/products/manage/${id}/`),
  create: (formData) => api.post("/products/manage/", formData),
  update: (id, formData) => api.patch(`/products/manage/${id}/`, formData),
  remove: (id) => api.delete(`/products/manage/${id}/`),
  updateStock: (id, stock_quantity) =>
    api.post(`/products/manage/${id}/stock/`, { stock_quantity }),
  toggleAvailability: (id) => api.post(`/products/manage/${id}/toggle-availability/`),
};
