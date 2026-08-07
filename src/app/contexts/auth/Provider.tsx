// Import Dependencies
import {
  useCallback,
  useEffect,
  useReducer,
  useState,
  ReactNode,
} from "react";

// Local Imports
import { isTokenValid, setSession } from "@/utils/jwt";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/configs/auth";
import { authApi } from "@/utils/api";
import type {
  AuthResponse,
  MFARequiredResponse,
  MembershipInfo,
  User,
} from "@/@types/lastsaas";
import {
  AuthProvider as AuthContext,
  AuthContextType,
  MFAPendingState,
} from "./context";

// ----------------------------------------------------------------------

interface AuthAction {
  type:
    | "INITIALIZE"
    | "LOGIN_REQUEST"
    | "LOGIN_SUCCESS"
    | "LOGIN_ERROR"
    | "MFA_REQUIRED"
    | "CLEAR_MFA"
    | "SET_USER"
    | "LOGOUT";
  payload?: {
    user?: User | null;
    memberships?: MembershipInfo[];
    errorMessage?: string;
    mfaToken?: string;
    isAuthenticated?: boolean;
  };
}

// Initial state
const initialState: AuthContextType = {
  user: null,
  memberships: [],
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,
  mfaPending: null,
  login: async () => {},
  register: async () => {},
  loginWithTokens: async () => {},
  completeMfaChallenge: async () => {},
  clearMfaPending: () => {},
  logout: async () => {},
  refreshUser: async () => {},
};

// Reducer handlers
function reducer(state: AuthContextType, action: AuthAction): AuthContextType {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        isInitialized: true,
        isAuthenticated: action.payload?.isAuthenticated ?? false,
        user: action.payload?.user ?? null,
        memberships: action.payload?.memberships ?? [],
      };
    case "LOGIN_REQUEST":
      return { ...state, isLoading: true, errorMessage: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        errorMessage: null,
        user: action.payload?.user ?? null,
        memberships: action.payload?.memberships ?? [],
        mfaPending: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        isLoading: false,
        errorMessage: action.payload?.errorMessage ?? "An error occurred",
      };
    case "MFA_REQUIRED":
      return {
        ...state,
        isLoading: false,
        mfaPending: { mfaToken: action.payload?.mfaToken ?? "" },
      };
    case "CLEAR_MFA":
      return { ...state, mfaPending: null };
    case "SET_USER":
      return {
        ...state,
        user: action.payload?.user ?? null,
        memberships: action.payload?.memberships ?? state.memberships,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        memberships: [],
        mfaPending: null,
      };
    default:
      return state;
  }
}

// ----------------------------------------------------------------------

function isMfaRequired(
  data: AuthResponse | MFARequiredResponse,
): data is MFARequiredResponse {
  return "mfaRequired" in data && data.mfaRequired === true;
}

// ----------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Track whether a refresh-user / refresh-token attempt is in flight so
  // the `isLoading` flag returned to consumers reflects that.
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Apply an AuthResponse (login/register/mfa-challenge success) to local
  // storage + axios + reducer.
  const handleAuthResponse = useCallback((data: AuthResponse) => {
    setSession(data.accessToken, data.refreshToken);
    dispatch({
      type: "LOGIN_SUCCESS",
      payload: { user: data.user, memberships: data.memberships },
    });
  }, []);

  const clearAuth = useCallback(() => {
    setSession(null);
    localStorage.removeItem("lastsaas_impersonating");
    dispatch({ type: "LOGOUT" });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      dispatch({
        type: "SET_USER",
        payload: { user: data.user, memberships: data.memberships },
      });
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  const loginWithTokens = useCallback(
    async (accessToken: string, refreshToken: string) => {
      setSession(accessToken, refreshToken);
      await refreshUser();
    },
    [refreshUser],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: "LOGIN_REQUEST" });
      try {
        const data = await authApi.login({ email, password });
        if (isMfaRequired(data)) {
          dispatch({
            type: "MFA_REQUIRED",
            payload: { mfaToken: data.mfaToken },
          });
          return;
        }
        handleAuthResponse(data as AuthResponse);
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.message || "Login failed";
        dispatch({ type: "LOGIN_ERROR", payload: { errorMessage: message } });
        throw err;
      }
    },
    [handleAuthResponse],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      displayName: string;
      invitationToken?: string;
    }) => {
      dispatch({ type: "LOGIN_REQUEST" });
      try {
        const res = await authApi.register(data);
        handleAuthResponse(res);
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.message || "Registration failed";
        dispatch({ type: "LOGIN_ERROR", payload: { errorMessage: message } });
        throw err;
      }
    },
    [handleAuthResponse],
  );

  const completeMfaChallenge = useCallback(
    async (mfaToken: string, code: string) => {
      dispatch({ type: "LOGIN_REQUEST" });
      try {
        const data = await authApi.mfaChallenge(mfaToken, code);
        handleAuthResponse(data);
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.message || "Invalid verification code";
        dispatch({ type: "LOGIN_ERROR", payload: { errorMessage: message } });
        throw err;
      }
    },
    [handleAuthResponse],
  );

  const clearMfaPending = useCallback(() => {
    dispatch({ type: "CLEAR_MFA" });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // ignore logout errors
    }
    clearAuth();
  }, [clearAuth]);

  // Restore session on mount
  useEffect(() => {
    const init = async () => {
      setIsRefreshing(true);
      try {
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (accessToken && isTokenValid(accessToken)) {
          setSession(accessToken, refreshToken);
          try {
            const data = await authApi.getMe();
            dispatch({
              type: "INITIALIZE",
              payload: {
                isAuthenticated: true,
                user: data.user,
                memberships: data.memberships,
              },
            });
          } catch {
            clearAuth();
            dispatch({
              type: "INITIALIZE",
              payload: { isAuthenticated: false },
            });
          }
        } else if (refreshToken) {
          // Try to refresh the token
          try {
            const data = await authApi.refresh(refreshToken);
            setSession(data.accessToken, data.refreshToken);
            const meData = await authApi.getMe();
            dispatch({
              type: "INITIALIZE",
              payload: {
                isAuthenticated: true,
                user: meData.user,
                memberships: meData.memberships,
              },
            });
          } catch {
            clearAuth();
            dispatch({
              type: "INITIALIZE",
              payload: { isAuthenticated: false },
            });
          }
        } else {
          dispatch({
            type: "INITIALIZE",
            payload: { isAuthenticated: false },
          });
        }
      } catch {
        dispatch({
          type: "INITIALIZE",
          payload: { isAuthenticated: false },
        });
      } finally {
        setIsRefreshing(false);
      }
    };

    init();
  }, [clearAuth]);

  if (!children) {
    return null;
  }

  const mfaPending: MFAPendingState | null = state.mfaPending;

  return (
    <AuthContext
      value={{
        user: state.user,
        memberships: state.memberships,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading || isRefreshing,
        isInitialized: state.isInitialized,
        errorMessage: state.errorMessage,
        mfaPending,
        login,
        register,
        loginWithTokens,
        completeMfaChallenge,
        clearMfaPending,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext>
  );
}
