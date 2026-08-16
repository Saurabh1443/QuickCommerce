import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const TOKEN_KEY = "qc_tokens";

export function getTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY)) || null;
  } catch {
    return null;
  }
}

export function setTokens(tokens) {
  if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// Refresh queue so a burst of 401s only triggers a single token-refresh call.
let refreshPromise = null;

async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens?.refresh) throw new Error("No refresh token available.");
  const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
    refresh: tokens.refresh,
  });
  const next = { ...tokens, access: data.access };
  setTokens(next);
  return next;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retried && getTokens()?.refresh) {
      config._retried = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const tokens = await refreshPromise;
        refreshPromise = null;
        config.headers.Authorization = `Bearer ${tokens.access}`;
        return api(config);
      } catch (refreshError) {
        refreshPromise = null;
        setTokens(null);
        window.dispatchEvent(new CustomEvent("qc:logout"));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/** Normalises the {success, error:{message, fields}} envelope our backend always sends. */
export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (typeof data === "string") return data;
  return error?.message || "Something went wrong. Please try again.";
}

export default api;
