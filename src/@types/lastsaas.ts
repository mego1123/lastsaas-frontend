// lastsaas API types — mirrors the Go backend's types

export type BillingStatus = 'none' | 'active' | 'past_due' | 'canceled';
export type BillingInterval = 'month' | 'year';
export type LogSeverity = 'critical' | 'high' | 'medium' | 'low' | 'debug';
export type LogCategory = 'auth' | 'billing' | 'admin' | 'system' | 'security' | 'tenant';
export type ConfigVarType = 'string' | 'numeric' | 'enum' | 'template';
export type IntegrationStatus = 'healthy' | 'unhealthy' | 'not_configured';

export interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role: string;
  isActive: boolean;
  isRoot: boolean;
  authMethods: string[];
  totpEnabled: boolean;
  mfaEnabled: boolean;
  themePreference: 'dark' | 'light' | 'system';
  onboardingCompletedAt?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  memberships?: MembershipInfo[];
}

export interface MembershipInfo {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: 'owner' | 'admin' | 'user' | string;
  isDefault: boolean;
  isRoot?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  memberships: MembershipInfo[];
}

export interface MFARequiredResponse {
  mfaRequired: true;
  mfaToken: string;
}

export interface AuthProviders {
  password: boolean;
  google: boolean;
  github: boolean;
  microsoft: boolean;
  magicLink: boolean;
  passkeys: boolean;
  mfa: boolean;
}

export interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  isRoot: boolean;
  isActive: boolean;
  planId?: string;
  billingWaived: boolean;
  subscriptionCredits: number;
  purchasedCredits: number;
  seatQuantity: number;
  stripeCustomerId?: string;
  billingStatus: BillingStatus;
  stripeSubscriptionId?: string;
  billingInterval?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isRoot: boolean;
  isActive: boolean;
  planId?: string;
  billingStatus?: BillingStatus;
  billingInterval?: BillingInterval;
  seatQuantity?: number;
  subscriptionCredits?: number;
  purchasedCredits?: number;
  billingWaived?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TenantMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'user';
  joinedAt: string;
}

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  isRoot: boolean;
  isActive: boolean;
  memberCount: number;
  planName: string;
  billingWaived: boolean;
  subscriptionCredits: number;
  purchasedCredits: number;
  seatQuantity: number;
  billingStatus: BillingStatus;
  billingInterval?: string;
  currentPeriodEnd?: string;
  createdAt: string;
}

export interface UserListItem {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  isActive: boolean;
  tenantCount: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserDetail {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  isActive: boolean;
  authMethods: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserMembershipDetail {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  isRoot: boolean;
  role: 'owner' | 'admin' | 'user';
  joinedAt: string;
  planId: string;
  planName: string;
  billingWaived: boolean;
  subscriptionCredits: number;
  purchasedCredits: number;
}

export interface TenantDeletionInfo {
  tenantId: string;
  tenantName: string;
  isRoot: boolean;
  otherMembers: { userId: string; displayName: string; email: string }[];
}

export interface DeletePreflightResponse {
  canDelete: boolean;
  reason?: string;
  ownerships?: TenantDeletionInfo[];
}

export type EntitlementType = 'bool' | 'numeric';
export type CreditResetPolicy = 'reset' | 'accrue';
export type PricingModel = 'flat' | 'per_seat';

export interface EntitlementValue {
  type: EntitlementType;
  boolValue: boolean;
  numericValue: number;
  description: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPriceCents: number;
  annualDiscountPct: number;
  usageCreditsPerMonth: number;
  creditResetPolicy: CreditResetPolicy;
  bonusCredits: number;
  userLimit: number;
  pricingModel: PricingModel;
  perSeatPriceCents: number;
  includedSeats: number;
  minSeats: number;
  maxSeats: number;
  entitlements: Record<string, EntitlementValue>;
  isSystem: boolean;
  trialDays: number;
  isArchived: boolean;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  subscriberCount?: number;
  // Legacy stub fields retained for backwards compatibility with
  // admin pages that haven't been migrated yet. The real backend
  // Plan object uses monthlyPriceCents/annualDiscountPct/etc.
  price: number;
  interval: string;
  features: string[];
}

export interface EntitlementKeyInfo {
  key: string;
  type: EntitlementType;
  description: string;
}

export interface PublicPlansResponse {
  plans: Plan[];
  bundles: CreditBundle[];
  currentPlanId: string;
  billingWaived: boolean;
  tenantSubscriptionCredits: number;
  tenantPurchasedCredits: number;
  seatQuantity: number;
  billingStatus: BillingStatus;
  billingInterval?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  currentPlanUserLimit: number;
  maxPlanUserLimit: number;
  upgradePromptTitle: string;
  upgradePromptBody: string;
  entitlementUpgradePromptTitle: string;
  entitlementUpgradePromptBody: string;
  entitlementUpgradePromptNumericBody: string;
  currency: string;
}

export interface ActivityLogEntry {
  id: string;
  tenantId?: string;
  userId?: string;
  action?: string;
  message: string;
  severity?: LogSeverity;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface SystemLog {
  id: string;
  severity: LogSeverity;
  category?: LogCategory;
  level?: string;
  message: string;
  source?: string;
  userId?: string;
  tenantId?: string;
  action?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  authority?: string;
  createdBy?: string;
  lastUsedAt?: string;
  createdAt: string;
  isActive: boolean;
}

export interface CreditBundle {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  // Legacy stub fields
  price: number;
}

export interface BrandingConfig {
  tenantId?: string;
  appName?: string;
  tagline?: string;
  logoMode?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  customDomain?: string;
  customCss?: string;
  fontFamily?: string;
  headingFont?: string;
  landingEnabled?: boolean;
  landingTitle?: string;
  landingMeta?: string;
  landingHtml?: string;
  dashboardHtml?: string;
  loginHeading?: string;
  loginSubtext?: string;
  signupHeading?: string;
  signupSubtext?: string;
  headHtml?: string;
  ogImageUrl?: string;
  analyticsSnippet?: string;
  navItems?: NavItem[];
  authProviders?: AuthProviders;
}

export interface MediaItem {
  id: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  htmlBody: string;
  metaDescription: string;
  ogImage: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AboutInfo {
  version: string;
  commit: string;
  buildDate: string;
  goVersion: string;
  copyright?: string;
}

export interface HealthStatus {
  status: string;
  checks: Array<{
    name: string;
    status: string;
    message?: string;
    latency?: number;
  }>;
}

export interface FinancialTransaction {
  id: string;
  tenantId: string;
  userId?: string;
  type: 'subscription' | 'credit_purchase' | 'refund' | string;
  amountCents: number;
  subtotalCents: number;
  taxAmountCents: number;
  currency: string;
  description: string;
  invoiceNumber: string;
  planName?: string;
  bundleName?: string;
  billingInterval?: string;
  status: string;
  createdAt: string;
  // Legacy stub fields
  amount: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Invitation {
  id: string;
  email: string;
  tenantId?: string;
  role: string;
  token?: string;
  status?: 'pending' | 'accepted';
  invitedBy?: string;
  expiresAt: string;
  createdAt: string;
}

export interface BootstrapStatus {
  initialized: boolean;
}

// --- Enum Options (used by ConfigPage enum editor) ---

export interface EnumOption {
  label: string;
  value: string;
}

// --- Promotions ---

export interface Promotion {
  id: string;
  code: string;
  active: boolean;
  couponId: string;
  couponName: string;
  percentOff: number;
  amountOff: number;
  currency: string;
  timesRedeemed: number;
  maxRedemptions: number;
  expiresAt: number;
  created: number;
  appliesToProducts: string[];
}

export interface EligibleProduct {
  id: string;
  name: string;
  type: "plan" | "bundle";
}

// --- Webhooks ---

export type WebhookEventType = "tenant.created";

export interface Webhook {
  id: string;
  name: string;
  description: string;
  url: string;
  secretPreview: string;
  events: WebhookEventType[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deliveries24h?: number;
  lastDelivery?: string | null;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: string;
  responseCode: number;
  responseBody: string;
  success: boolean;
  durationMs: number;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

export interface WebhookEventTypeInfo {
  type: string;
  category: string;
  description: string;
}

// --- Branding Navigation ---

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  target: string;
  entitlementGate?: string;
  isBuiltIn: boolean;
  visible: boolean;
  sortOrder: number;
}

// --- Product Management / Telemetry ---

export interface FunnelStep {
  name: string;
  count: number;
  conversion: number;
}

export interface FunnelData {
  uniqueVisitors: number;
  registrations: number;
  planPageViews: number;
  checkoutsStarted: number;
  paidConversions: number;
  upgrades: number;
  steps: FunnelStep[];
}

export interface CohortRow {
  cohortLabel: string;
  cohortSize: number;
  retention: number[];
}

export interface FeatureUse {
  name: string;
  count: number;
}

export interface EngagementData {
  dau: DailyMetricPoint[];
  wau: DailyMetricPoint[];
  mau: DailyMetricPoint[];
  avgSessions: number;
  topFeatures: FeatureUse[];
  creditTrend: DailyMetricPoint[];
}

export interface PlanShare {
  planName: string;
  subscribers: number;
  percentage: number;
  mrr: number;
}

export interface KPIData {
  mrr: number;
  arr: number;
  arpu: number;
  ltv: number;
  churnRate: number;
  trialConversionRate: number;
  timeToFirstPurchase: number;
  activeSubscribers: number;
  totalRegistrations: number;
  planDistribution: PlanShare[];
  mrrTrend: DailyMetricPoint[];
  subscriberTrend: DailyMetricPoint[];
}

export interface CustomEventData {
  eventName: string;
  totalCount: number;
  trend: DailyMetricPoint[];
}

export interface EventTypeSummary {
  eventName: string;
  category: string;
  count: number;
  lastSeen: string;
}

export interface EventDefinition {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  count?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SankeyData {
  nodes: { name: string; count: number }[];
  links: { source: number; target: number; value: number }[];
  hasDependencies: boolean;
}

export interface Message {
  id: string;
  userId: string;
  subject: string;
  body: string;
  isSystem: boolean;
  read: boolean;
  createdAt: string;
}

// --- Sessions / Passkeys ---

export interface ActiveSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface PasskeyCredential {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface ConfigVar {
  id: string;
  name: string;
  description: string;
  type: ConfigVarType;
  value: string;
  options?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemNode {
  id: string;
  machineId: string;
  hostname: string;
  status: 'active' | 'stale';
  startedAt: string;
  lastSeen: string;
  version: string;
  goVersion: string;
}

export interface SystemMetric {
  id: string;
  nodeId: string;
  timestamp: string;
  cpu?: {
    usagePercent: number;
    numCpu: number;
  };
  memory?: {
    usedBytes: number;
    totalBytes: number;
    usedPercent: number;
  };
  disk?: {
    usedBytes: number;
    totalBytes: number;
    usedPercent: number;
  };
  network?: {
    bytesSent: number;
    bytesRecv: number;
  };
  http?: {
    requestCount: number;
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
    statusCodes: Record<string, number>;
    errorRate4xx: number;
    errorRate5xx: number;
  };
  mongo?: {
    currentConnections: number;
    availableConnections: number;
    dataSizeBytes: number;
    indexSizeBytes: number;
    collections: number;
    opCounters: Record<string, number>;
  };
  goRuntime?: {
    numGoroutine: number;
    heapAlloc: number;
    heapSys: number;
    gcPauseNs: number;
    numGC: number;
  };
  integrations?: {
    stripeApiCalls: number;
    resendEmails: number;
  };
}

export interface IntegrationCheck {
  name: string;
  status: IntegrationStatus;
  message: string;
  lastCheck: string;
  responseMs: number;
  calls24h: number;
}

// --- Health Dashboard types ---

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
export type NodeFilterMode = 'aggregate' | 'all' | 'single';

// --- Financial ---

export interface DailyMetricPoint {
  date: string;
  value: number;
}
