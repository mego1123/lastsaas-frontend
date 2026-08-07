import { MembershipInfo } from "@/@types/lastsaas";
import { createSafeContext } from "@/utils/createSafeContext";

export interface TenantContextType {
  currentTenant: MembershipInfo | null;
  memberships: MembershipInfo[];
  isLoading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

export const [TenantProvider, useTenantContext] =
  createSafeContext<TenantContextType>(
    "useTenantContext must be used within TenantProvider",
  );
