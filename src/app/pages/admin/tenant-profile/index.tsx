// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeftIcon,
  CheckIcon,
  BoltIcon,
  UsersIcon,
  CreditCardIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form/Input";
import { Select } from "@/components/ui/Form/Select";
import { Switch } from "@/components/ui/Form/Switch";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  TBody,
  THead,
  Tr,
  Th,
  Td,
} from "@/components/ui/Table";
import { adminApi } from "@/utils/api";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { getErrorString } from "@/utils/errors";
import type {
  TenantDetail,
  TenantMember,
  Plan,
} from "@/@types/lastsaas";

// ----------------------------------------------------------------------

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

function roleBadgeColor(
  role: string,
): "warning" | "primary" | "neutral" {
  if (role === "owner") return "warning";
  if (role === "admin") return "primary";
  return "neutral";
}

// ----------------------------------------------------------------------

export default function TenantProfilePage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role ?? null;
  const canWrite = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Edit fields
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Plan & billing fields
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [billingWaived, setBillingWaived] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const [planSuccess, setPlanSuccess] = useState("");

  // Credit fields
  const [subscriptionCredits, setSubscriptionCredits] = useState(0);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [savingCredits, setSavingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [creditSuccess, setCreditSuccess] = useState("");

  // Billing
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchTenant = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [tenantData, plansData] = await Promise.all([
        adminApi.getTenant(tenantId),
        adminApi.listPlans(),
      ]);
      setTenant(tenantData.tenant);
      setMembers(tenantData.members || []);
      setName(tenantData.tenant.name);
      setBillingWaived(tenantData.tenant.billingWaived);
      setSelectedPlanId(tenantData.tenant.planId || "");
      setSubscriptionCredits(tenantData.tenant.subscriptionCredits);
      setPurchasedCredits(tenantData.tenant.purchasedCredits);
      setPlans(plansData.plans || []);
    } catch {
      setFetchError("Failed to load tenant");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchTenant();
  }, [fetchTenant]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const updates: { name?: string } = {};
      if (name.trim() !== tenant.name) updates.name = name.trim();
      if (Object.keys(updates).length === 0) {
        setSaveSuccess("No changes to save");
        setSaving(false);
        return;
      }
      await adminApi.updateTenant(tenant.id, updates);
      setSaveSuccess("Tenant updated successfully");
      await fetchTenant();
    } catch (err: unknown) {
      setSaveError(getErrorString(err) || "Failed to update tenant");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlan = async () => {
    if (!tenant) return;
    const planChanged = selectedPlanId !== (tenant.planId || "");
    const waivedChanged = billingWaived !== tenant.billingWaived;
    if (!planChanged && !waivedChanged) {
      setPlanSuccess("No changes to save");
      return;
    }
    setSavingPlan(true);
    setPlanError("");
    setPlanSuccess("");
    try {
      await adminApi.assignTenantPlan(
        tenant.id,
        planChanged
          ? (selectedPlanId || null)
          : (undefined as unknown as string | null),
        waivedChanged ? billingWaived : undefined,
      );
      setPlanSuccess("Plan updated successfully");
      await fetchTenant();
    } catch (err: unknown) {
      setPlanError(getErrorString(err) || "Failed to update plan");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleSaveCredits = async () => {
    if (!tenant) return;
    setSavingCredits(true);
    setCreditError("");
    setCreditSuccess("");
    try {
      const updates: {
        subscriptionCredits?: number;
        purchasedCredits?: number;
      } = {};
      if (subscriptionCredits !== tenant.subscriptionCredits)
        updates.subscriptionCredits = subscriptionCredits;
      if (purchasedCredits !== tenant.purchasedCredits)
        updates.purchasedCredits = purchasedCredits;
      if (Object.keys(updates).length === 0) {
        setCreditSuccess("No changes to save");
        setSavingCredits(false);
        return;
      }
      await adminApi.updateTenant(tenant.id, updates);
      setCreditSuccess("Credits updated successfully");
      await fetchTenant();
    } catch (err: unknown) {
      setCreditError(getErrorString(err) || "Failed to update credits");
    } finally {
      setSavingCredits(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!tenant) return;
    try {
      await adminApi.updateTenantStatus(tenant.id, !tenant.isActive);
      await fetchTenant();
    } catch {
      // ignore
    }
  };

  const handleCancelSubscription = async (immediate: boolean) => {
    if (!tenant) return;
    setCancellingSubscription(true);
    try {
      await adminApi.adminCancelSubscription(tenant.id, immediate);
      setShowCancelModal(false);
      await fetchTenant();
    } catch {
      // ignore
    } finally {
      setCancellingSubscription(false);
    }
  };

  if (loading) {
    return (
      <Page title="Tenant Profile">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <Spinner className="size-8" color="primary" />
          </div>
        </div>
      </Page>
    );
  }

  if (fetchError || !tenant) {
    return (
      <Page title="Tenant Profile">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="py-20 text-center">
            <p className="mb-4 text-error">
              {fetchError || "Tenant not found"}
            </p>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate("/last/tenants")}
            >
              Back to Tenants
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  // Derive warnings for plan & billing section
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const systemPlan = plans.find((p) => p.isSystem);
  const currentPlanName =
    plans.find((p) => p.id === tenant.planId)?.name ||
    systemPlan?.name ||
    "Free";
  const selectedIsPaid = selectedPlan
    ? selectedPlan.monthlyPriceCents > 0
    : false;
  const hasActiveSubscription =
    !!tenant.stripeSubscriptionId &&
    (tenant.billingStatus === "active" || tenant.billingStatus === "past_due");

  // Warning: waiving billing while they have an active subscription
  const showWaiveWarning =
    billingWaived && !tenant.billingWaived && hasActiveSubscription;
  // Warning: removing waiver on a paid plan with no subscription
  const showUnwaiveWarning =
    !billingWaived &&
    tenant.billingWaived &&
    selectedIsPaid &&
    !hasActiveSubscription;
  // Warning: assigning paid plan without waiver and no subscription
  const showPaidNoWaiverWarning =
    selectedIsPaid && !billingWaived && !hasActiveSubscription;

  return (
    <Page title="Tenant Profile">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header */}
        <div className="pb-5">
          <Link
            to="/last/tenants"
            className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-dark-300 dark:hover:text-dark-50"
          >
            <ArrowLeftIcon className="size-4" /> Back to Tenants
          </Link>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                Tenant Profile
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-300">
                {tenant.name} &middot; {tenant.slug}
              </p>
            </div>
            {tenant.isRoot && (
              <Badge color="warning" variant="soft" className="ml-2">
                Root
              </Badge>
            )}
          </div>
        </div>

        {/* Tenant Information */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Tenant Information
          </h2>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canWrite}
            />
            <div>
              <label className="input-label mb-1 block text-sm text-gray-500 dark:text-dark-300">
                Slug
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 font-mono text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-600/40 dark:text-dark-300">
                {tenant.slug}
              </div>
            </div>
          </div>
          {canWrite && (
            <div className="flex items-center gap-3">
              <Button
                color="primary"
                onClick={handleSave}
                disabled={saving}
                className="h-9"
              >
                <CheckIcon className="size-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {saveError && (
                <span className="text-sm text-error">{saveError}</span>
              )}
              {saveSuccess && (
                <span className="text-sm text-success dark:text-success-light">
                  {saveSuccess}
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Plan & Billing */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            <CreditCardIcon className="size-5 text-gray-400 dark:text-dark-300" />
            Plan &amp; Billing
          </h2>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Select
                label="Plan"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                disabled={!isOwner}
                data={[
                  {
                    label: systemPlan
                      ? `${systemPlan.name} (Default)`
                      : "System Default",
                    value: "",
                  },
                  ...plans
                    .filter((p) => !p.isSystem)
                    .map((p) => ({
                      label: `${p.name}${p.isArchived ? " (Archived)" : ""} — ${formatPrice(p.monthlyPriceCents)}/mo`,
                      value: p.id,
                    })),
                ]}
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-dark-400">
                Currently: {currentPlanName}
              </p>
            </div>
            <div>
              <label className="input-label mb-1 block text-sm text-gray-500 dark:text-dark-300">
                Billing Waived
              </label>
              <div className="flex items-center gap-3">
                <Switch
                  color="success"
                  checked={billingWaived}
                  onChange={(e) => setBillingWaived(e.target.checked)}
                  disabled={!isOwner}
                />
                <span
                  className={
                    billingWaived
                      ? "text-sm text-success dark:text-success-light"
                      : "text-sm text-gray-500 dark:text-dark-300"
                  }
                >
                  {billingWaived ? "Yes" : "No"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-dark-400">
                {billingWaived
                  ? "Tenant uses paid features without being charged"
                  : "Tenant must pay via Stripe for paid plans"}
              </p>
            </div>
          </div>

          {/* Contextual warnings */}
          {showWaiveWarning && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3">
              <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-sm text-warning">
                This tenant has an active Stripe subscription. Waiving billing
                will <strong>cancel their subscription immediately</strong> and
                they will no longer be charged.
              </p>
            </div>
          )}
          {showUnwaiveWarning && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3">
              <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-sm text-warning">
                This tenant is on a paid plan with no Stripe subscription.
                Removing the billing waiver will{" "}
                <strong>
                  downgrade them to{" "}
                  {systemPlan?.name || "the default plan"}
                </strong>
                . They can then subscribe to a paid plan through the normal
                checkout flow.
              </p>
            </div>
          )}
          {showPaidNoWaiverWarning && !showUnwaiveWarning && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-error/20 bg-error/5 p-3">
              <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-error" />
              <p className="text-sm text-error">
                You&apos;re assigning a paid plan without waiving billing. This
                tenant has no active subscription to cover the cost. Either{" "}
                <strong>enable billing waived</strong> or let the tenant
                subscribe through the checkout flow.
              </p>
            </div>
          )}

          {isOwner && (
            <div className="flex items-center gap-3">
              <Button
                color="primary"
                onClick={handleSavePlan}
                disabled={savingPlan}
                className="h-9"
              >
                <CheckIcon className="size-4" />
                {savingPlan ? "Saving..." : "Save Plan"}
              </Button>
              {planError && (
                <span className="text-sm text-error">{planError}</span>
              )}
              {planSuccess && (
                <span className="text-sm text-success dark:text-success-light">
                  {planSuccess}
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Usage Credits */}
        <Card className="mb-6 p-6">
          <h2 className="mb-1 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            <BoltIcon className="size-5 text-primary-500 dark:text-primary-400" />
            Usage Credits
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
            Total balance:{" "}
            <span className="font-semibold text-gray-900 dark:text-dark-50">
              {(subscriptionCredits + purchasedCredits).toLocaleString()}
            </span>{" "}
            credits
          </p>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Input
                label="Subscription Credits"
                description='From monthly plan allotment (resets monthly if policy is "reset")'
                value={subscriptionCredits}
                onChange={(e) =>
                  setSubscriptionCredits(parseInt(e.target.value) || 0)
                }
                disabled={!canWrite}
                inputMode="numeric"
              />
            </div>
            <div>
              <Input
                label="Purchased & Bonus Credits"
                description="From one-time purchases and bonuses (never reset)"
                value={purchasedCredits}
                onChange={(e) =>
                  setPurchasedCredits(parseInt(e.target.value) || 0)
                }
                disabled={!canWrite}
                inputMode="numeric"
              />
            </div>
          </div>
          {canWrite && (
            <div className="flex items-center gap-3">
              <Button
                color="primary"
                onClick={handleSaveCredits}
                disabled={savingCredits}
                className="h-9"
              >
                <CheckIcon className="size-4" />
                {savingCredits ? "Saving..." : "Save Credits"}
              </Button>
              {creditError && (
                <span className="text-sm text-error">{creditError}</span>
              )}
              {creditSuccess && (
                <span className="text-sm text-success dark:text-success-light">
                  {creditSuccess}
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Account Status */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Account Status
          </h2>
          <div className="flex items-center gap-4">
            {tenant.isActive ? (
              <Badge color="success" variant="soft">
                Active
              </Badge>
            ) : (
              <Badge color="error" variant="soft">
                Disabled
              </Badge>
            )}
            {!tenant.isRoot && canWrite && (
              <Button
                variant="outlined"
                color={tenant.isActive ? "error" : "success"}
                className="h-8 text-xs"
                onClick={handleToggleStatus}
              >
                {tenant.isActive ? "Disable Tenant" : "Enable Tenant"}
              </Button>
            )}
          </div>
        </Card>

        {/* Billing Info */}
        {tenant.billingStatus && tenant.billingStatus !== "none" && (
          <Card className="mb-6 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
              <CreditCardIcon className="size-5 text-gray-400 dark:text-dark-300" />
              Stripe Subscription
            </h2>
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 dark:text-dark-300">
                  Status
                </span>
                <span
                  className={
                    tenant.billingStatus === "active"
                      ? "text-sm font-medium text-success dark:text-success-light"
                      : tenant.billingStatus === "past_due"
                        ? "text-sm font-medium text-error"
                        : tenant.billingStatus === "canceled"
                          ? "text-sm font-medium text-warning"
                          : "text-sm font-medium text-gray-500 dark:text-dark-300"
                  }
                >
                  {tenant.billingStatus === "active"
                    ? "Active"
                    : tenant.billingStatus === "past_due"
                      ? "Past Due"
                      : tenant.billingStatus === "canceled"
                        ? "Canceled"
                        : tenant.billingStatus}
                </span>
              </div>
              {tenant.stripeSubscriptionId && (
                <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
                  <span className="text-sm text-gray-500 dark:text-dark-300">
                    Subscription ID
                  </span>
                  <span className="font-mono text-sm text-gray-700 dark:text-dark-200">
                    {tenant.stripeSubscriptionId}
                  </span>
                </div>
              )}
              {tenant.billingInterval && (
                <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
                  <span className="text-sm text-gray-500 dark:text-dark-300">
                    Billing Interval
                  </span>
                  <span className="text-sm capitalize text-gray-900 dark:text-dark-50">
                    {tenant.billingInterval}ly
                  </span>
                </div>
              )}
              {tenant.currentPeriodEnd && (
                <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
                  <span className="text-sm text-gray-500 dark:text-dark-300">
                    Period End
                  </span>
                  <span className="text-sm text-gray-900 dark:text-dark-50">
                    {new Date(tenant.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              {tenant.canceledAt && (
                <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
                  <span className="text-sm text-gray-500 dark:text-dark-300">
                    Canceled At
                  </span>
                  <span className="text-sm text-warning">
                    {new Date(tenant.canceledAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {isOwner &&
              tenant.stripeSubscriptionId &&
              tenant.billingStatus === "active" && (
                <Button
                  variant="outlined"
                  color="error"
                  className="h-9"
                  onClick={() => setShowCancelModal(true)}
                >
                  <XCircleIcon className="size-4" />
                  Cancel Subscription
                </Button>
              )}
          </Card>
        )}

        {/* Cancel Subscription Modal */}
        <Transition
          appear
          show={showCancelModal}
          as={Dialog}
          onClose={() => setShowCancelModal(false)}
          className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
        >
          <TransitionChild
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
          />
          <TransitionChild
            as={DialogPanel}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-soft transition-all dark:bg-dark-700"
          >
            <DialogTitle className="mb-4 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Cancel Subscription
            </DialogTitle>
            <p className="mb-6 text-gray-700 dark:text-dark-200">
              Choose how to cancel this tenant&apos;s subscription:
            </p>
            <div className="space-y-3">
              <Button
                variant="outlined"
                color="warning"
                className="h-10 w-full"
                onClick={() => handleCancelSubscription(false)}
                disabled={cancellingSubscription}
              >
                Cancel at Period End
              </Button>
              <Button
                variant="outlined"
                color="error"
                className="h-10 w-full"
                onClick={() => handleCancelSubscription(true)}
                disabled={cancellingSubscription}
              >
                Cancel Immediately
              </Button>
              <Button
                variant="flat"
                color="neutral"
                className="h-9 w-full text-sm"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Subscription
              </Button>
            </div>
          </TransitionChild>
        </Transition>

        {/* Members */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            <UsersIcon className="size-5 text-gray-400 dark:text-dark-300" />
            Members
            <span className="text-sm font-normal text-gray-400 dark:text-dark-400">
              ({members.length})
            </span>
          </h2>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-dark-300">
              No members in this tenant.
            </p>
          ) : (
            <div className="min-w-full overflow-x-auto">
              <Table hoverable className="w-full min-w-[640px]">
                <THead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Joined</Th>
                  </Tr>
                </THead>
                <TBody>
                  {members.map((m) => (
                    <Tr
                      key={m.userId}
                      onClick={() => navigate(`/last/users/${m.userId}`)}
                      className="cursor-pointer"
                    >
                      <Td>
                        {m.displayName}
                      </Td>
                      <Td>
                        {m.email}
                      </Td>
                      <Td>
                        <Badge
                          color={roleBadgeColor(m.role)}
                          variant="soft"
                          className="capitalize"
                        >
                          {m.role}
                        </Badge>
                      </Td>
                      <Td>
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
