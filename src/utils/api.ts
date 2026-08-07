// lastsaas API client — wraps axios with typed endpoints
//
// This client mirrors the original API surface from
// `frontend/src/api/client.ts`, but uses the project's axios instance
// defined in `@/utils/axios`. All response shapes match the backend
// exactly (wrapper objects, never plain arrays).

import axios from "@/utils/axios";
import type {
  User,
  MembershipInfo,
  AuthResponse,
  MFARequiredResponse,
  AuthProviders,
  TenantDetail,
  TenantMember,
  TenantListItem,
  UserListItem,
  UserDetail,
  UserMembershipDetail,
  DeletePreflightResponse,
  Plan,
  PublicPlansResponse,
  ActivityLogEntry,
  SystemLog,
  ApiKey,
  CreditBundle,
  BrandingConfig,
  MediaItem,
  CustomPage,
  AboutInfo,
  FinancialTransaction,
  Announcement,
  Invitation,
  BootstrapStatus,
  Message,
  ConfigVar,
  SystemNode,
  SystemMetric,
  IntegrationCheck,
  EntitlementKeyInfo,
  DailyMetricPoint,
  Webhook,
  WebhookDelivery,
  WebhookEventTypeInfo,
  Promotion,
  EligibleProduct,
  FunnelData,
  CohortRow,
  EngagementData,
  KPIData,
  CustomEventData,
  EventTypeSummary,
  EventDefinition,
  SankeyData,
} from "@/@types/lastsaas";

// --- Bootstrap ---
export const bootstrapApi = {
  status: () =>
    axios
      .get<{ initialized: boolean }>("/bootstrap/status")
      .then((r) => r.data),
};

// --- Auth ---
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    invitationToken?: string;
  }) => axios.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    axios
      .post<AuthResponse | MFARequiredResponse>("/auth/login", data)
      .then((r) => r.data),

  logout: (refreshToken?: string) =>
    axios.post("/auth/logout", { refreshToken }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    axios
      .post<AuthResponse>("/auth/refresh", { refreshToken })
      .then((r) => r.data),

  getMe: () =>
    axios
      .get<{ user: User; memberships: MembershipInfo[] }>("/auth/me")
      .then((r) => r.data),

  verifyEmail: (token: string) =>
    axios.post("/auth/verify-email", { token }).then((r) => r.data),

  resendVerification: (email: string) =>
    axios.post("/auth/resend-verification", { email }).then((r) => r.data),

  forgotPassword: (email: string) =>
    axios.post("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    axios
      .post("/auth/reset-password", { token, newPassword })
      .then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    axios
      .post("/auth/change-password", { currentPassword, newPassword })
      .then((r) => r.data),

  acceptInvitation: (token: string) =>
    axios.post("/auth/accept-invitation", { token }).then((r) => r.data),

  // OAuth code exchange
  exchangeCode: (code: string) =>
    axios
      .post<{
        accessToken?: string;
        refreshToken?: string;
        mfaRequired?: boolean;
        mfaToken?: string;
      }>("/auth/exchange-code", { code })
      .then((r) => r.data),

  // Auth providers discovery
  getProviders: () =>
    axios.get<AuthProviders>("/auth/providers").then((r) => r.data),

  // MFA / TOTP
  mfaSetup: () =>
    axios
      .post<{ secret: string; qrCodeUrl: string }>("/auth/mfa/setup")
      .then((r) => r.data),

  mfaVerifySetup: (code: string) =>
    axios
      .post<{ recoveryCodes: string[] }>("/auth/mfa/verify-setup", { code })
      .then((r) => r.data),

  mfaDisable: (code: string) =>
    axios.post("/auth/mfa/disable", { code }).then((r) => r.data),

  mfaChallenge: (mfaToken: string, code: string) =>
    axios
      .post<AuthResponse>("/auth/mfa/challenge", { mfaToken, code })
      .then((r) => r.data),

  mfaRegenerateCodes: (code: string) =>
    axios
      .post<{ recoveryCodes: string[] }>("/auth/mfa/regenerate-codes", {
        code,
      })
      .then((r) => r.data),

  // Magic Link
  requestMagicLink: (email: string) =>
    axios.post("/auth/magic-link", { email }).then((r) => r.data),

  verifyMagicLink: (token: string) =>
    axios
      .post<AuthResponse | MFARequiredResponse>(
        "/auth/magic-link/verify",
        { token },
      )
      .then((r) => r.data),

  // Passkeys / WebAuthn
  passkeyRegisterBegin: () =>
    axios.post("/auth/passkeys/register/begin").then((r) => r.data),

  passkeyRegisterFinish: (data: { name: string; credential: unknown }) =>
    axios.post("/auth/passkeys/register/finish", data).then((r) => r.data),

  passkeyLoginBegin: () =>
    axios.post("/auth/passkeys/login/begin").then((r) => r.data),

  passkeyLoginFinish: (credential: unknown) =>
    axios
      .post<AuthResponse>("/auth/passkeys/login/finish", { credential })
      .then((r) => r.data),

  listPasskeys: () =>
    axios
      .get<{ passkeys: Array<{ id: string; name: string; createdAt: string }> }>(
        "/auth/passkeys",
      )
      .then((r) => r.data),

  deletePasskey: (id: string) =>
    axios.delete(`/auth/passkeys/${id}`).then((r) => r.data),

  // Sessions
  listSessions: () =>
    axios
      .get<{
        sessions: Array<{
          id: string;
          ipAddress: string;
          userAgent: string;
          deviceInfo: string;
          lastActiveAt: string;
          createdAt: string;
          isCurrent: boolean;
        }>;
      }>("/auth/sessions")
      .then((r) => r.data),

  revokeSession: (id: string) =>
    axios.delete(`/auth/sessions/${id}`).then((r) => r.data),

  revokeAllSessions: () =>
    axios.delete("/auth/sessions").then((r) => r.data),

  // Preferences
  updatePreferences: (data: { themePreference?: string }) =>
    axios.patch("/auth/preferences", data).then((r) => r.data),

  // Onboarding
  completeOnboarding: () =>
    axios.post("/auth/complete-onboarding").then((r) => r.data),

  // Account management
  deleteAccount: (password: string) =>
    axios.post("/auth/delete-account", { password }).then((r) => r.data),

  exportData: () =>
    axios
      .get("/auth/export-data", { responseType: "blob" })
      .then((r) => r.data),
};

// --- Tenant (current tenant scoped) ---
export const tenantApi = {
  listMembers: () =>
    axios
      .get<{ members: TenantMember[] }>("/tenant/members")
      .then((r) => r.data),

  inviteMember: (email: string, role: string) =>
    axios
      .post("/tenant/members/invite", { email, role })
      .then((r) => r.data),

  removeMember: (userId: string) =>
    axios.delete(`/tenant/members/${userId}`).then((r) => r.data),

  changeRole: (userId: string, role: string) =>
    axios
      .patch(`/tenant/members/${userId}/role`, { role })
      .then((r) => r.data),

  transferOwnership: (userId: string) =>
    axios
      .post(`/tenant/members/${userId}/transfer-ownership`)
      .then((r) => r.data),

  getActivity: (params?: {
    page?: number;
    perPage?: number;
    action?: string;
    search?: string;
  }) =>
    axios
      .get<{ logs: ActivityLogEntry[]; total: number }>(
        "/tenant/activity",
        { params },
      )
      .then((r) => r.data),

  updateSettings: (data: { name?: string }) =>
    axios.patch("/tenant/settings", data).then((r) => r.data),
};

// --- Messages ---
export const messagesApi = {
  list: () =>
    axios
      .get<{ messages: Message[] }>("/messages")
      .then((r) => r.data),

  unreadCount: () =>
    axios
      .get<{ count: number }>("/messages/unread-count")
      .then((r) => r.data),

  markRead: (id: string) =>
    axios.patch(`/messages/${id}/read`).then((r) => r.data),
};

// --- Admin ---
export const adminApi = {
  getAbout: () =>
    axios.get<AboutInfo>("/admin/about").then((r) => r.data),

  getDashboard: () =>
    axios
      .get<{
        users: number;
        tenants: number;
        health: { healthy: boolean; issues: string[] };
      }>("/admin/dashboard")
      .then((r) => r.data),

  listTenants: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    status?: string;
    billingStatus?: string;
  }) =>
    axios
      .get<{
        tenants: TenantListItem[];
        total: number;
        page: number;
        limit: number;
      }>("/admin/tenants", { params })
      .then((r) => r.data),

  getTenant: (id: string) =>
    axios
      .get<{ tenant: TenantDetail; members: TenantMember[] }>(
        `/admin/tenants/${id}`,
      )
      .then((r) => r.data),

  updateTenant: (
    id: string,
    data: {
      name?: string;
      billingWaived?: boolean;
      subscriptionCredits?: number;
      purchasedCredits?: number;
    },
  ) => axios.put(`/admin/tenants/${id}`, data).then((r) => r.data),

  updateTenantStatus: (id: string, isActive: boolean) =>
    axios
      .patch(`/admin/tenants/${id}/status`, { isActive })
      .then((r) => r.data),

  assignTenantPlan: (
    tenantId: string,
    planId?: string | null,
    billingWaived?: boolean,
  ) => {
    const body: Record<string, unknown> = {};
    if (planId !== undefined) body.planId = planId || "";
    if (billingWaived !== undefined) body.billingWaived = billingWaived;
    return axios
      .patch(`/admin/tenants/${tenantId}/plan`, body)
      .then((r) => r.data);
  },

  listUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    status?: string;
  }) =>
    axios
      .get<{
        users: UserListItem[];
        total: number;
        page: number;
        limit: number;
      }>("/admin/users", { params })
      .then((r) => r.data),

  getUser: (id: string) =>
    axios
      .get<{ user: UserDetail; memberships: UserMembershipDetail[] }>(
        `/admin/users/${id}`,
      )
      .then((r) => r.data),

  preflightDeleteUser: (id: string) =>
    axios
      .get<DeletePreflightResponse>(`/admin/users/${id}/preflight-delete`)
      .then((r) => r.data),

  deleteUser: (
    id: string,
    data?: {
      replacementOwners?: Record<string, string>;
      confirmTenantDeletions?: string[];
    },
  ) => axios.delete(`/admin/users/${id}`, { data }).then((r) => r.data),

  updateUserStatus: (id: string, isActive: boolean) =>
    axios
      .patch(`/admin/users/${id}/status`, { isActive })
      .then((r) => r.data),

  updateUser: (id: string, data: { email?: string; displayName?: string }) =>
    axios.put(`/admin/users/${id}`, data).then((r) => r.data),

  listLogs: (params?: {
    page?: number;
    perPage?: number;
    severity?: string;
    category?: string;
    search?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
  }) =>
    axios
      .get<{ logs: SystemLog[]; total: number }>("/admin/logs", { params })
      .then((r) => r.data),

  logSeverityCounts: (params?: {
    category?: string;
    fromDate?: string;
    toDate?: string;
  }) =>
    axios
      .get<{ counts: Record<string, number> }>(
        "/admin/logs/severity-counts",
        { params },
      )
      .then((r) => r.data),

  exportLogsCSV: (params?: {
    severity?: string;
    category?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }) =>
    axios
      .get("/admin/logs/export", { params, responseType: "blob" })
      .then((r) => r.data),

  exportUsersCSV: (params?: { search?: string; status?: string }) =>
    axios
      .get("/admin/users/export", { params, responseType: "blob" })
      .then((r) => r.data),

  exportTenantsCSV: (params?: {
    search?: string;
    status?: string;
    billingStatus?: string;
  }) =>
    axios
      .get("/admin/tenants/export", { params, responseType: "blob" })
      .then((r) => r.data),

  listConfig: () =>
    axios
      .get<{ configs: ConfigVar[] }>("/admin/config")
      .then((r) => r.data),

  getConfig: (name: string) =>
    axios.get<ConfigVar>(`/admin/config/${name}`).then((r) => r.data),

  updateConfig: (
    name: string,
    value: string,
    opts?: { description?: string; options?: string },
  ) =>
    axios
      .put<ConfigVar>(`/admin/config/${name}`, { value, ...opts })
      .then((r) => r.data),

  createConfig: (data: {
    name: string;
    description: string;
    type: string;
    value: string;
    options?: string;
  }) => axios.post<ConfigVar>("/admin/config", data).then((r) => r.data),

  deleteConfig: (name: string) =>
    axios.delete(`/admin/config/${name}`).then((r) => r.data),

  listPlans: () =>
    axios.get<{ plans: Plan[] }>("/admin/plans").then((r) => r.data),

  getPlan: (id: string) =>
    axios.get<Plan>(`/admin/plans/${id}`).then((r) => r.data),

  createPlan: (data: Partial<Plan>) =>
    axios.post<Plan>("/admin/plans", data).then((r) => r.data),

  updatePlan: (id: string, data: Partial<Plan>) =>
    axios.put<Plan>(`/admin/plans/${id}`, data).then((r) => r.data),

  deletePlan: (id: string) =>
    axios.delete(`/admin/plans/${id}`).then((r) => r.data),

  archivePlan: (id: string) =>
    axios.post(`/admin/plans/${id}/archive`).then((r) => r.data),

  unarchivePlan: (id: string) =>
    axios.post(`/admin/plans/${id}/unarchive`).then((r) => r.data),

  listEntitlementKeys: () =>
    axios
      .get<{ keys: EntitlementKeyInfo[] }>("/admin/entitlement-keys")
      .then((r) => r.data),

  listBundles: () =>
    axios
      .get<{ bundles: CreditBundle[] }>("/admin/credit-bundles")
      .then((r) => r.data),

  createBundle: (data: Partial<CreditBundle>) =>
    axios.post<CreditBundle>("/admin/credit-bundles", data).then((r) => r.data),

  updateBundle: (id: string, data: Partial<CreditBundle>) =>
    axios
      .put<CreditBundle>(`/admin/credit-bundles/${id}`, data)
      .then((r) => r.data),

  deleteBundle: (id: string) =>
    axios.delete(`/admin/credit-bundles/${id}`).then((r) => r.data),

  listHealthNodes: () =>
    axios
      .get<{ nodes: SystemNode[] }>("/admin/health/nodes")
      .then((r) => r.data),

  getHealthMetrics: (params?: { node?: string; range?: string }) =>
    axios
      .get<{
        metrics: SystemMetric[];
        from: string;
        to: string;
      }>("/admin/health/metrics", { params })
      .then((r) => r.data),

  getHealthCurrent: () =>
    axios
      .get<{ metrics: SystemMetric[] }>("/admin/health/current")
      .then((r) => r.data),

  getHealthIntegrations: () =>
    axios
      .get<{ integrations: IntegrationCheck[] }>(
        "/admin/health/integrations",
      )
      .then((r) => r.data),

  sendTestEmail: (to: string) =>
    axios
      .post<{ success?: boolean; error?: string }>(
        "/admin/health/test-email",
        { to },
      )
      .then((r) => r.data),

  listFinancialTransactions: (params?: {
    page?: number;
    perPage?: number;
    tenantId?: string;
    search?: string;
  }) =>
    axios
      .get<{
        transactions: FinancialTransaction[];
        total: number;
        page: number;
        perPage: number;
      }>("/admin/financial/transactions", { params })
      .then((r) => r.data),

  getFinancialMetrics: (params?: { range?: string; metric?: string }) =>
    axios
      .get<{ data: DailyMetricPoint[] }>("/admin/financial/metrics", {
        params,
      })
      .then((r) => r.data),

  adminCancelSubscription: (tenantId: string, immediate: boolean) =>
    axios
      .post(`/admin/tenants/${tenantId}/cancel-subscription`, { immediate })
      .then((r) => r.data),

  adminUpdateSubscription: (
    tenantId: string,
    data: { currentPeriodEnd?: string },
  ) =>
    axios
      .patch(`/admin/tenants/${tenantId}/subscription`, data)
      .then((r) => r.data),

  // Announcements
  listAnnouncements: () =>
    axios
      .get<{ announcements: Announcement[] }>("/admin/announcements")
      .then((r) => r.data),

  createAnnouncement: (data: {
    title: string;
    body: string;
    publish: boolean;
  }) =>
    axios.post<Announcement>("/admin/announcements", data).then((r) => r.data),

  updateAnnouncement: (
    id: string,
    data: { title?: string; body?: string; publish?: boolean },
  ) =>
    axios.put(`/admin/announcements/${id}`, data).then((r) => r.data),

  deleteAnnouncement: (id: string) =>
    axios.delete(`/admin/announcements/${id}`).then((r) => r.data),

  // API Keys
  listAPIKeys: () =>
    axios
      .get<{ apiKeys: ApiKey[] }>("/admin/api-keys")
      .then((r) => r.data),

  createAPIKey: (data: { name: string; authority: string }) =>
    axios
      .post<{ apiKey: ApiKey; rawKey: string }>("/admin/api-keys", data)
      .then((r) => r.data),

  deleteAPIKey: (id: string) =>
    axios.delete(`/admin/api-keys/${id}`).then((r) => r.data),

  // Webhooks
  listWebhooks: () =>
    axios
      .get<{ webhooks: Webhook[] }>("/admin/webhooks")
      .then((r) => r.data),

  getWebhook: (id: string) =>
    axios
      .get<{ webhook: Webhook; deliveries: WebhookDelivery[] }>(
        `/admin/webhooks/${id}`,
      )
      .then((r) => r.data),

  createWebhook: (data: {
    name: string;
    description: string;
    url: string;
    events: string[];
  }) =>
    axios
      .post<{ webhook: Webhook; secret: string }>("/admin/webhooks", data)
      .then((r) => r.data),

  updateWebhook: (
    id: string,
    data: {
      name: string;
      description: string;
      url: string;
      events: string[];
    },
  ) =>
    axios
      .put<{ webhook: Webhook }>(`/admin/webhooks/${id}`, data)
      .then((r) => r.data),

  deleteWebhook: (id: string) =>
    axios.delete(`/admin/webhooks/${id}`).then((r) => r.data),

  testWebhook: (id: string) =>
    axios
      .post<{ delivery: WebhookDelivery }>(`/admin/webhooks/${id}/test`)
      .then((r) => r.data),

  regenerateWebhookSecret: (id: string) =>
    axios
      .post<{ secret: string; secretPreview: string }>(
        `/admin/webhooks/${id}/regenerate-secret`,
      )
      .then((r) => r.data),

  listWebhookEventTypes: () =>
    axios
      .get<{ eventTypes: WebhookEventTypeInfo[] }>(
        "/admin/webhooks/event-types",
      )
      .then((r) => r.data),

  // Promotions
  listPromotions: () =>
    axios
      .get<{ promotions: Promotion[]; productNames: Record<string, string> }>(
        "/admin/promotions",
      )
      .then((r) => r.data),

  listEligibleProducts: () =>
    axios
      .get<{ items: EligibleProduct[] }>("/admin/promotions/eligible-products")
      .then((r) => r.data),

  createPromotion: (data: {
    code: string;
    name?: string;
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    maxRedemptions?: number;
    expiresAt?: string;
    appliesTo?: { type: string; id: string }[];
  }) =>
    axios
      .post<{ id: string; code: string }>("/admin/promotions", data)
      .then((r) => r.data),

  updatePromotion: (data: {
    id: string;
    couponId: string;
    couponName?: string;
    active?: boolean;
  }) =>
    axios.post("/admin/promotions/update", data).then((r) => r.data),

  deactivatePromotion: (id: string) =>
    axios
      .post("/admin/promotions/deactivate", { id })
      .then((r) => r.data),

  // Root Members
  listRootMembers: () =>
    axios
      .get<{ members: TenantMember[]; invitations: Invitation[] }>(
        "/admin/members",
      )
      .then((r) => r.data),

  inviteRootMember: (email: string, role: string) =>
    axios
      .post("/admin/members/invite", { email, role })
      .then((r) => r.data),

  removeRootMember: (userId: string) =>
    axios.delete(`/admin/members/${userId}`).then((r) => r.data),

  changeRootMemberRole: (userId: string, role: string) =>
    axios
      .patch(`/admin/members/${userId}/role`, { role })
      .then((r) => r.data),

  cancelRootInvitation: (invitationId: string) =>
    axios
      .delete(`/admin/members/invitations/${invitationId}`)
      .then((r) => r.data),

  // Impersonation
  impersonateUser: (userId: string) =>
    axios
      .post<{
        accessToken: string;
        user: User;
        memberships: MembershipInfo[];
      }>(`/admin/users/${userId}/impersonate`)
      .then((r) => r.data),
};

// --- Plans (public, authenticated) ---
export const plansApi = {
  list: () =>
    axios.get<PublicPlansResponse>("/plans").then((r) => r.data),
};

// --- Credit Bundles (public, authenticated) ---
export const bundlesApi = {
  list: () =>
    axios
      .get<{ bundles: CreditBundle[] }>("/credit-bundles")
      .then((r) => r.data),
};

// --- Announcements (public, authenticated) ---
export const announcementsApi = {
  list: () =>
    axios
      .get<{ announcements: Announcement[] }>("/announcements")
      .then((r) => r.data),
};

// --- Billing ---
export const billingApi = {
  checkout: (data: {
    planId?: string;
    bundleId?: string;
    billingInterval?: string;
    seatQuantity?: number;
    removeBillingWaiver?: boolean;
  }) =>
    axios
      .post<{ checkoutUrl?: string; waived?: boolean }>(
        "/billing/checkout",
        data,
      )
      .then((r) => r.data),

  portal: () =>
    axios
      .post<{ portalUrl: string }>("/billing/portal")
      .then((r) => r.data),

  listTransactions: (params?: { page?: number; perPage?: number }) =>
    axios
      .get<{
        transactions: FinancialTransaction[];
        total: number;
        page: number;
        perPage: number;
      }>("/billing/transactions", { params })
      .then((r) => r.data),

  getInvoice: (id: string) =>
    axios
      .get<{
        transaction: FinancialTransaction;
        tenant: { name: string };
      }>(`/billing/transactions/${id}/invoice`)
      .then((r) => r.data),

  getInvoicePDF: (id: string) =>
    axios
      .get(`/billing/transactions/${id}/invoice/pdf`, {
        responseType: "blob",
      })
      .then((r) => r.data),

  cancel: () =>
    axios
      .post<{ message: string; currentPeriodEnd?: string }>(
        "/billing/cancel",
      )
      .then((r) => r.data),

  getConfig: () =>
    axios
      .get<{ publishableKey: string }>("/billing/config")
      .then((r) => r.data),
};

// --- Branding (public, no auth) ---
export const brandingApi = {
  get: () =>
    axios.get<BrandingConfig>("/branding").then((r) => r.data),

  getPublicPages: () =>
    axios
      .get<{ pages: CustomPage[] }>("/branding/pages")
      .then((r) => r.data),

  getPublicPage: (slug: string) =>
    axios.get<CustomPage>(`/branding/page/${slug}`).then((r) => r.data),
};

// --- Branding Admin ---
export const brandingAdminApi = {
  update: (data: Partial<BrandingConfig>) =>
    axios.put("/admin/branding", data).then((r) => r.data),

  uploadAsset: (key: "logo" | "favicon", file: File) => {
    const form = new FormData();
    form.append("key", key);
    form.append("file", file);
    return axios
      .post("/admin/branding/asset", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  deleteAsset: (key: "logo" | "favicon") =>
    axios.delete(`/admin/branding/asset/${key}`).then((r) => r.data),

  listMedia: () =>
    axios
      .get<{ media: MediaItem[] }>("/admin/branding/media")
      .then((r) => r.data),

  uploadMedia: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return axios
      .post<MediaItem>("/admin/branding/media", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  deleteMedia: (key: string) =>
    axios.delete(`/admin/branding/media/${key}`).then((r) => r.data),

  listPages: () =>
    axios
      .get<{ pages: CustomPage[] }>("/admin/branding/pages")
      .then((r) => r.data),

  createPage: (data: Partial<CustomPage>) =>
    axios
      .post<CustomPage>("/admin/branding/pages", data)
      .then((r) => r.data),

  updatePage: (id: string, data: Partial<CustomPage>) =>
    axios
      .put<CustomPage>(`/admin/branding/pages/${id}`, data)
      .then((r) => r.data),

  deletePage: (id: string) =>
    axios.delete(`/admin/branding/pages/${id}`).then((r) => r.data),
};

// --- Bootstrap setup helper (kept for legacy callers) ---
export const setupApi = {
  setup: (data: {
    email: string;
    password: string;
    tenantName: string;
  }) => axios.post<AuthResponse>("/bootstrap/setup", data).then((r) => r.data),
};

// --- PM Dashboard ---
export const pmApi = {
  getFunnel: (params?: { range?: string }) =>
    axios.get<FunnelData>("/admin/pm/funnel", { params }).then((r) => r.data),

  getRetention: (params?: { granularity?: string; periods?: number }) =>
    axios
      .get<{ granularity: string; periods: number; cohorts: CohortRow[] }>(
        "/admin/pm/retention",
        { params },
      )
      .then((r) => r.data),

  getEngagement: (params?: { range?: string }) =>
    axios
      .get<EngagementData>("/admin/pm/engagement", { params })
      .then((r) => r.data),

  getKPIs: () => axios.get<KPIData>("/admin/pm/kpis").then((r) => r.data),

  getCustomEvents: (params?: { name?: string; range?: string }) =>
    axios
      .get<CustomEventData>("/admin/pm/events", { params })
      .then((r) => r.data),

  listEventTypes: () =>
    axios
      .get<{ eventTypes: EventTypeSummary[] }>("/admin/pm/events/types")
      .then((r) => r.data),

  listEventDefinitions: (params?: { range?: string }) =>
    axios
      .get<{ definitions: EventDefinition[] }>(
        "/admin/pm/event-definitions",
        { params },
      )
      .then((r) => r.data),

  createEventDefinition: (data: {
    name: string;
    description: string;
    parentId?: string | null;
  }) =>
    axios
      .post<EventDefinition>("/admin/pm/event-definitions", data)
      .then((r) => r.data),

  updateEventDefinition: (
    id: string,
    data: {
      name: string;
      description: string;
      parentId?: string | null;
    },
  ) =>
    axios
      .put<EventDefinition>(`/admin/pm/event-definitions/${id}`, data)
      .then((r) => r.data),

  deleteEventDefinition: (id: string) =>
    axios.delete(`/admin/pm/event-definitions/${id}`).then((r) => r.data),

  getSankeyData: (params?: { range?: string }) =>
    axios
      .get<SankeyData>("/admin/pm/event-definitions/sankey", { params })
      .then((r) => r.data),
};

export type { BootstrapStatus };
