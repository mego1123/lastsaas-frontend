/**
 * lastsaas API configuration
 *
 * In development: Vite proxies /api to localhost:4290 (Go backend)
 * In production: VITE_API_URL env var points to the Railway backend
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

export const JWT_HOST_API: string = API_BASE
  ? `${API_BASE}/api`
  : "/api";

// No gateway proxy needed — Railway backend is directly accessible
export const GATEWAY_PORT_PARAM = "";

/**
 * lastsaas auth token storage keys
 */
export const ACCESS_TOKEN_KEY = "lastsaas_access_token";
export const REFRESH_TOKEN_KEY = "lastsaas_refresh_token";
export const TENANT_ID_KEY = "lastsaas_tenant_id";
export const IMPERSONATION_KEY = "lastsaas_impersonating";
