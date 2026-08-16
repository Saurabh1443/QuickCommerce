import api from "./api";

export const notificationService = {
  list: () => api.get("/notifications/"),
};
