import axios from "axios";

// Generic messages for common HTTP status codes to avoid leaking internal details.
const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Please sign in to continue.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with the current state. Please refresh and try again.",
  422: "The submitted data is invalid. Please check your input.",
  429: "Too many requests. Please try again later.",
  500: "An unexpected error occurred. Please try again.",
  502: "Service temporarily unavailable. Please try again.",
  503: "Service temporarily unavailable. Please try again.",
};

/**
 * Extracts a user-safe error message from an unknown error.
 *
 * The project's axios interceptor rejects with the backend response body
 * directly (i.e. `error.response?.data || error`) for non-401 responses,
 * so the rejected value may be either a plain object (`{ code, error }`)
 * or a full AxiosError. This helper handles both shapes and mirrors the
 * behavior of `frontend/src/utils/errors.ts`.
 */
export function getErrorMessage(err: unknown): string {
  // Case 1: backend body rejected directly — `{ code, error }` or `{ error }`
  if (err && typeof err === "object" && !axios.isAxiosError(err)) {
    const data = err as {
      code?: string;
      error?: unknown;
      message?: unknown;
    };
    if (typeof data.error === "string" && data.error.length > 0) {
      return data.error;
    }
    if (typeof data.message === "string" && data.message.length > 0) {
      return data.message;
    }
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;

    // Use backend error message if it provides a structured error code
    // (these are intentionally user-safe messages from the API)
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      "error" in data
    ) {
      return String((data as { error: unknown }).error);
    }

    // For errors without a structured code, use generic status-based messages
    if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

    // Fallback: use backend error string only if it looks safe (no internal details)
    if (data && typeof data === "object" && "error" in data) {
      const msg = String((data as { error: unknown }).error);
      // Allow short, user-facing messages; block verbose internal errors
      if (msg.length <= 200) return msg;
    }

    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

/**
 * Extracts the structured `code` field from a rejected API error.
 *
 * The project's axios interceptor rejects with the backend body directly
 * for non-401 responses, so we look at both the top-level object and the
 * nested `response.data` shape (for full AxiosErrors).
 */
export function getErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const direct = (err as { code?: string }).code;
  if (direct) return direct;
  const nested = (err as { response?: { data?: { code?: string } } })
    ?.response?.data?.code;
  return nested;
}

/**
 * Extracts the backend `error` string from a rejected API error.
 */
export function getErrorString(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const direct = (err as { error?: string }).error;
  if (typeof direct === "string") return direct;
  const nested = (err as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return nested;
}
