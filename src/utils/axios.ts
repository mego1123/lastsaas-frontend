import axios, { AxiosError, AxiosResponse } from "axios";
import { JWT_HOST_API, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/configs/auth";

const axiosInstance = axios.create({
  baseURL: JWT_HOST_API,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach auth token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach tenant header if available
    const tenantId = localStorage.getItem("lastsaas_tenant_id");
    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — silent token refresh on 401
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeToRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshComplete(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers = [];
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // 503 → /setup redirect (system not initialized)
    if (error.response?.status === 503) {
      const data = error.response?.data as any;
      if (data?.redirect === "/setup" && !window.location.pathname.startsWith("/setup")) {
        window.location.href = "/setup";
        return Promise.reject(error);
      }
    }

    const originalRequest = error.config as any;
    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status !== 401 || isAuthRoute || originalRequest?._retry) {
      return Promise.reject(error.response?.data || error);
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      delete axiosInstance.defaults.headers.common.Authorization;
      // Only redirect if we're not already on /login (prevents reload loop)
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeToRefresh((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          originalRequest._retry = true;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const { data } = await axiosInstance.post("/auth/refresh", { refreshToken });
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

      onRefreshComplete(data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      onRefreshFailed();
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      delete axiosInstance.defaults.headers.common.Authorization;
      // Only redirect if we're not already on /login (prevents reload loop)
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
