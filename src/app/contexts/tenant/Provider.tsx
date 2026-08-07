import { useEffect, useReducer, ReactNode } from "react";
import { TENANT_ID_KEY } from "@/configs/auth";
import type { MembershipInfo } from "@/@types/lastsaas";
import { useAuthContext } from "@/app/contexts/auth/context";
import { TenantProvider as TenantContext, TenantContextType } from "./context";

interface TenantAction {
  type: "SET_MEMBERSHIPS" | "SET_CURRENT" | "SET_LOADING" | "SWITCH";
  payload?: any;
}

const initialState: TenantContextType = {
  currentTenant: null,
  memberships: [],
  isLoading: true,
  switchTenant: async () => {},
  refreshMemberships: async () => {},
};

function reducer(
  state: TenantContextType,
  action: TenantAction,
): TenantContextType {
  switch (action.type) {
    case "SET_MEMBERSHIPS":
      return {
        ...state,
        memberships: action.payload.memberships,
        currentTenant: action.payload.current || state.currentTenant,
        isLoading: false,
      };
    case "SET_CURRENT":
      return { ...state, currentTenant: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { memberships: authMemberships } = useAuthContext();
  const [state, dispatch] = useReducer(reducer, initialState);

  // Derive memberships from the AuthProvider, which already loaded them
  // via /auth/me. We do not call any tenant API here — that's an admin
  // endpoint and would 403 for non-admin users.
  useEffect(() => {
    const memberships: MembershipInfo[] = authMemberships ?? [];

    if (memberships.length === 0) {
      dispatch({
        type: "SET_MEMBERSHIPS",
        payload: { memberships: [], current: null },
      });
      return;
    }

    // Get the current tenant from localStorage or use the first/default one
    const storedTenantId = localStorage.getItem(TENANT_ID_KEY);
    const current =
      memberships.find((m) => m.tenantId === storedTenantId) ||
      memberships.find((m) => m.isDefault) ||
      memberships[0] ||
      null;

    if (current) {
      localStorage.setItem(TENANT_ID_KEY, current.tenantId);
    }

    dispatch({
      type: "SET_MEMBERSHIPS",
      payload: { memberships, current },
    });
  }, [authMemberships]);

  const refreshMemberships = async () => {
    // Re-trigger the effect by depending on `user`. We do not fetch
    // tenants here. To force a refresh, callers should re-fetch the
    // current user via the AuthProvider instead.
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const switchTenant = async (tenantId: string) => {
    const membership = state.memberships.find(
      (m) => m.tenantId === tenantId,
    );
    if (!membership) return;

    localStorage.setItem(TENANT_ID_KEY, tenantId);
    dispatch({ type: "SET_CURRENT", payload: membership });

    // Reload the page to refresh all tenant-scoped data
    window.location.reload();
  };

  return (
    <TenantContext
      value={{
        ...state,
        switchTenant,
        refreshMemberships,
      }}
    >
      {children}
    </TenantContext>
  );
}
