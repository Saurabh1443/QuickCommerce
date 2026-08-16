import api from "./api";

export const cartService = {
  get: () => api.get("/cart/"),
  addItem: (product_id, quantity = 1, replace_cart = false) =>
    api.post("/cart/items/", { product_id, quantity, replace_cart }),
  updateItem: (itemId, quantity) => api.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
  clear: () => api.delete("/cart/"),
};
