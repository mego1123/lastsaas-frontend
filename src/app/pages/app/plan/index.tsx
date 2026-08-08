// Import Dependencies
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Minus,
  Crown,
  Sparkles,
  Zap,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  TBody,
  THead,
  Tr,
  Th,
  Td,
} from "@/components/ui/Table";
import { plansApi, billingApi } from "@/utils/api";
import { useTenantContext } from "@/app/contexts/tenant/context";
import type {
  Plan,
  EntitlementValue,
  BillingStatus,
} from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/PlanPage.tsx` (636 LOC).
// ----------------------------------------------------------------------

const currencySymbols: Record<string, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
  jpy: "¥",
  cad: "CA$",
  aud: "A$",
};

function getCurrencySymbol(currency: string): string {
  return (
    currencySymbols[currency?.toLowerCase()] ||
    currency?.toUpperCase() + " "
  );
}

function formatPrice(cents: number, currency = "usd"): string {
  if (cents === 0) return "Free";
  return `${getCurrencySymbol(currency)}${(cents / 100).toFixed(2)}`;
}

function annualPrice(
  cents: number,
  discountPct: number,
  currency = "usd",
): string {
  const monthly = (cents / 100) * (1 - discountPct / 100);
  return `${getCurrencySymbol(currency)}${monthly.toFixed(2)}`;
}

function annualTotal(cents: number, discountPct: number): number {
  const annual = cents * 12;
  return Math.round(annual * (1 - discountPct / 100));
}

export default function PlanPage() {
  const { currentTenant: activeTenant } = useTenantContext();
  // The original called `useTelemetry().trackPageView('/plan')` — the new
  // project has no telemetry hook, so the call is omitted (no UI impact).
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [pendingWaiverPlan, setPendingWaiverPlan] = useState<Plan | null>(
    null,
  );
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">(
    "year",
  );
  const [searchParams] = useSearchParams();
  const upgradePlanId = searchParams.get("upgrade");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // React Query — cached data, no refetch within staleTime (60s)
  const { data: plansData, isLoading: loading } = useQuery({
    queryKey: ["plans", activeTenant],
    queryFn: () => plansApi.list(),
    
  });

  // Derive all values from cached query data — no manual state needed
  const plans = plansData?.plans ?? [];
  const currentPlanId = plansData?.currentPlanId ?? "";
  const billingWaived = plansData?.billingWaived ?? false;
  const billingStatus: BillingStatus = plansData?.billingStatus ?? "none";
  const billingInterval = plansData?.billingInterval ?? "";
  const currentPeriodEnd = plansData?.currentPeriodEnd ?? "";
  const subscriptionCredits = plansData?.tenantSubscriptionCredits ?? 0;
  const purchasedCredits = plansData?.tenantPurchasedCredits ?? 0;
  const maxPlanUserLimit = plansData?.maxPlanUserLimit ?? 0;
  const currency = plansData?.currency ?? "usd";

  useEffect(() => {
    if (!loading && upgradePlanId && cardRefs.current[upgradePlanId]) {
      setHighlightId(upgradePlanId);
      cardRefs.current[upgradePlanId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      const timer = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, upgradePlanId]);

  const handleCheckout = async (plan: Plan) => {
    if (plan.id === currentPlanId) return;

    // If billing is waived and this is a paid plan, show confirmation modal
    if (
      billingWaived &&
      (plan.monthlyPriceCents > 0 || plan.perSeatPriceCents > 0)
    ) {
      setPendingWaiverPlan(plan);
      setShowWaiverModal(true);
      return;
    }

    await doCheckout(plan, false);
  };

  const doCheckout = async (plan: Plan, removeBillingWaiver: boolean) => {
    setCheckoutLoading(plan.id);
    try {
      const result = await billingApi.checkout({
        planId: plan.id,
        billingInterval: selectedInterval,
        removeBillingWaiver,
      });
      if (result.waived) {
        window.location.reload();
      } else if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch {
      // Error handled by interceptor
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleWaiverConfirm = async () => {
    if (!pendingWaiverPlan) return;
    setShowWaiverModal(false);
    await doCheckout(pendingWaiverPlan, true);
    setPendingWaiverPlan(null);
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await billingApi.cancel();
      window.location.reload();
    } catch {
      // Error handled by interceptor
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
    }
  };

  if (loading) {
    return (
      <Page title="Your Plan">
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" color="primary" />
        </div>
      </Page>
    );
  }

  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const hasCredits = plans.some((p) => p.usageCreditsPerMonth > 0);
  const hasBonusCredits = plans.some((p) => p.bonusCredits > 0);
  const hasAnnual = plans.some((p) => p.annualDiscountPct > 0);
  const showUserLimits = maxPlanUserLimit !== 1;

  // Collect all unique entitlement keys with descriptions
  const entitlementKeys: { key: string; description: string }[] = [];
  const seenKeys = new Set<string>();
  for (const plan of plans) {
    for (const [key, val] of Object.entries(plan.entitlements || {})) {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        entitlementKeys.push({
          key,
          description: val.description || key,
        });
      }
    }
  }

  // Sort plans by price for display
  const sortedPlans = [...plans].sort(
    (a, b) => a.monthlyPriceCents - b.monthlyPriceCents,
  );
  const currentPlanIndex = sortedPlans.findIndex(
    (p) => p.id === currentPlanId,
  );
  const isActiveSubscription =
    billingStatus === "active" || billingStatus === "canceled";
  const isCanceled = billingStatus === "canceled";

  return (
    <Page title="Your Plan">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Your Plan
          </h2>
          <p className="mt-1 text-gray-500 dark:text-dark-300">
            Manage your subscription and compare available plans
          </p>
        </div>

        {/* Billing Interval Toggle */}
        {hasAnnual && !isActiveSubscription && (
          <div className="mb-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedInterval("month")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedInterval === "month"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-200 text-gray-500 hover:text-gray-700 dark:bg-dark-600 dark:text-dark-300"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setSelectedInterval("year")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedInterval === "year"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-200 text-gray-500 hover:text-gray-700 dark:bg-dark-600 dark:text-dark-300"
              }`}
            >
              Annual
              <span className="ml-1 text-xs opacity-75">
                Save up to{" "}
                {Math.max(...plans.map((p) => p.annualDiscountPct))}%
              </span>
            </button>
          </div>
        )}

        {/* Current Plan Banner */}
        {currentPlan && (
          <div className="mb-8 rounded-2xl border border-primary-500/20 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-primary-500/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                  <span className="text-sm font-medium text-primary-500 dark:text-primary-400">
                    Current Plan
                  </span>
                  {billingWaived && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      Billing Waived
                    </span>
                  )}
                  {billingStatus === "active" && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      Active
                    </span>
                  )}
                  {billingStatus === "past_due" && (
                    <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
                      Past Due
                    </span>
                  )}
                  {isCanceled && (
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      Canceled
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                  {currentPlan.name}
                </h2>
                {currentPlan.description && (
                  <p className="mt-1 text-gray-700 dark:text-dark-200">
                    {currentPlan.description}
                  </p>
                )}
                {billingInterval && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                    Billed {billingInterval}ly
                  </p>
                )}
                {currentPeriodEnd && isActiveSubscription && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                    {isCanceled
                      ? `Benefits until ${new Date(currentPeriodEnd).toLocaleDateString()}`
                      : `Next billing: ${new Date(currentPeriodEnd).toLocaleDateString()}`}
                  </p>
                )}
                {(hasCredits || hasBonusCredits) && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                      <span className="text-sm text-gray-700 dark:text-dark-200">
                        <span className="font-semibold text-gray-900 dark:text-dark-50">
                          {(subscriptionCredits + purchasedCredits).toLocaleString()}
                        </span>{" "}
                        credits total
                      </span>
                    </div>
                    <div className="ml-6 flex items-center gap-4 text-xs text-gray-500 dark:text-dark-300">
                      <span>
                        {subscriptionCredits.toLocaleString()} from monthly plan
                      </span>
                      <span>
                        {purchasedCredits.toLocaleString()} from purchases &amp;
                        bonuses
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-dark-50">
                  {formatPrice(currentPlan.monthlyPriceCents, currency)}
                </div>
                {currentPlan.monthlyPriceCents > 0 && (
                  <span className="text-sm text-gray-500 dark:text-dark-300">
                    /month
                  </span>
                )}
              </div>
            </div>

            {/* Cancel button */}
            {billingStatus === "active" &&
              currentPlan.monthlyPriceCents > 0 &&
              !billingWaived && (
                <div className="mt-4 border-t border-primary-500/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="text-sm text-gray-500 transition-colors hover:text-error dark:text-dark-300"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}
          </div>
        )}

        {/* Past due warning */}
        {billingStatus === "past_due" && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            <div>
              <p className="font-medium text-error">Payment Failed</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                Your most recent payment was unsuccessful. Please update your
                billing information in Settings to avoid service interruption.
              </p>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <div
          className={`mb-10 grid gap-6 ${
            sortedPlans.length <= 3
              ? `grid-cols-1 md:grid-cols-${sortedPlans.length}`
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {sortedPlans.map((plan, idx) => {
            const isCurrent = plan.id === currentPlanId;
            const isUpgrade = idx > currentPlanIndex;
            const isPopular = idx === 1 && sortedPlans.length >= 3;
            const displayPrice =
              selectedInterval === "year" && plan.annualDiscountPct > 0
                ? annualTotal(plan.monthlyPriceCents, plan.annualDiscountPct)
                : plan.monthlyPriceCents;

            const isHighlighted = highlightId === plan.id;

            return (
              <div
                key={plan.id}
                ref={(el) => {
                  cardRefs.current[plan.id] = el;
                }}
                className={`relative rounded-2xl border p-6 transition-all ${
                  isCurrent
                    ? "border-primary-500/30 bg-primary-500/5 ring-1 ring-primary-500/20"
                    : isHighlighted
                      ? "animate-pulse border-primary-400 bg-primary-500/10 ring-2 ring-primary-500"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-dark-600 dark:bg-dark-700 dark:hover:border-dark-500"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-6 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-medium text-white">
                    Current Plan
                  </div>
                )}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-secondary-500 px-3 py-0.5 text-xs font-medium text-white">
                    <Sparkles className="h-3 w-3" /> Popular
                  </div>
                )}

                <div className="mb-4 pt-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-dark-50">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  {selectedInterval === "year" &&
                  plan.annualDiscountPct > 0 ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900 dark:text-dark-50">
                          {annualPrice(
                            plan.monthlyPriceCents,
                            plan.annualDiscountPct,
                            currency,
                          )}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-dark-300">
                          /mo
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-success">
                        {formatPrice(displayPrice, currency)}/year (
                        {plan.annualDiscountPct}% off)
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900 dark:text-dark-50">
                          {formatPrice(plan.monthlyPriceCents, currency)}
                        </span>
                        {plan.monthlyPriceCents > 0 && (
                          <span className="text-sm text-gray-500 dark:text-dark-300">
                            /mo
                          </span>
                        )}
                      </div>
                      {plan.annualDiscountPct > 0 && (
                        <p className="mt-1 text-sm text-success">
                          {annualPrice(
                            plan.monthlyPriceCents,
                            plan.annualDiscountPct,
                            currency,
                          )}
                          /mo billed annually ({plan.annualDiscountPct}% off)
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Trial badge */}
                {plan.trialDays > 0 && !isCurrent && (
                  <div className="mb-4 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-center">
                    <span className="text-sm font-medium text-success">
                      {plan.trialDays}-day free trial
                    </span>
                  </div>
                )}

                {/* Key features list */}
                <div className="mb-6 space-y-3">
                  {showUserLimits && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-success" />
                      <span className="text-gray-700 dark:text-dark-200">
                        {plan.userLimit === 0
                          ? "Unlimited users"
                          : `Up to ${plan.userLimit} user${plan.userLimit > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  )}
                  {hasCredits && plan.usageCreditsPerMonth > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-success" />
                      <span className="text-gray-700 dark:text-dark-200">
                        {plan.usageCreditsPerMonth.toLocaleString()} credits/month
                      </span>
                    </div>
                  )}
                  {hasBonusCredits && plan.bonusCredits > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-success" />
                      <span className="text-gray-700 dark:text-dark-200">
                        {plan.bonusCredits.toLocaleString()} bonus credits
                      </span>
                    </div>
                  )}
                  {entitlementKeys.map(({ key, description }) => {
                    const ent = plan.entitlements?.[key];
                    if (!ent) return null;
                    if (ent.type === "bool" && !ent.boolValue) return null;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 shrink-0 text-success" />
                        <span className="text-gray-700 dark:text-dark-200">
                          {ent.type === "bool"
                            ? description
                            : `${ent.numericValue} ${description}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                {isCurrent ? (
                  <div className="w-full rounded-lg border border-primary-500/20 bg-primary-500/10 py-2.5 text-center text-sm font-medium text-primary-500 dark:text-primary-400">
                    Your Plan
                  </div>
                ) : (
                  <Button
                    color={isUpgrade ? "primary" : "neutral"}
                    variant={isUpgrade ? "filled" : "outlined"}
                    onClick={() => handleCheckout(plan)}
                    disabled={checkoutLoading !== null}
                    className="h-10 w-full"
                  >
                    {checkoutLoading === plan.id ? (
                      <Spinner className="h-4 w-4" color="primary" />
                    ) : isUpgrade ? (
                      "Upgrade"
                    ) : (
                      "Switch Plan"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <Card className="mt-3">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-dark-600">
            <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Plan Comparison
            </h3>
          </div>

          <div className="min-w-full overflow-x-auto">
            <Table className="w-full min-w-[640px]">
              <THead>
                <Tr>
                  <Th>Feature</Th>
                  {sortedPlans.map((plan) => (
                    <Th
                      key={plan.id}
                      className={`min-w-[140px] text-center ${
                        plan.id === currentPlanId
                          ? "text-primary-500 dark:text-primary-400"
                          : ""
                      }`}
                    >
                      {plan.name}
                      {plan.id === currentPlanId && (
                        <span className="mt-0.5 block text-xs font-normal text-primary-500/60 dark:text-primary-400/60">
                          Current
                        </span>
                      )}
                    </Th>
                  ))}
                </Tr>
              </THead>
              <TBody>
                {/* Price Row */}
                <Tr>
                  <Td>
                    Monthly Price
                  </Td>
                  {sortedPlans.map((plan) => (
                    <Td
                      key={plan.id}
                      className={`text-center text-sm ${
                        plan.id === currentPlanId
                          ? "font-medium text-gray-900 dark:text-dark-50"
                          : "text-gray-700 dark:text-dark-200"
                      }`}
                    >
                      {formatPrice(plan.monthlyPriceCents, currency)}
                      {plan.monthlyPriceCents > 0 ? "/mo" : ""}
                    </Td>
                  ))}
                </Tr>

                {/* Annual Price Row */}
                {hasAnnual && (
                  <Tr>
                    <Td>
                      Annual Price
                    </Td>
                    {sortedPlans.map((plan) => (
                      <Td
                        key={plan.id}
                        className={`text-center text-sm ${
                          plan.id === currentPlanId
                            ? "font-medium text-gray-900 dark:text-dark-50"
                            : "text-gray-700 dark:text-dark-200"
                        }`}
                      >
                        {plan.annualDiscountPct > 0 ? (
                          <span>
                            {annualPrice(
                              plan.monthlyPriceCents,
                              plan.annualDiscountPct,
                              currency,
                            )}
                            /mo{" "}
                            <span className="text-xs text-success">
                              ({plan.annualDiscountPct}% off)
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-dark-400">
                            —
                          </span>
                        )}
                      </Td>
                    ))}
                  </Tr>
                )}

                {/* User Limit Row */}
                {showUserLimits && (
                  <Tr>
                    <Td>
                      Users
                    </Td>
                    {sortedPlans.map((plan) => (
                      <Td
                        key={plan.id}
                        className={`text-center text-sm ${
                          plan.id === currentPlanId
                            ? "font-medium text-gray-900 dark:text-dark-50"
                            : "text-gray-700 dark:text-dark-200"
                        }`}
                      >
                        {plan.userLimit === 0 ? "Unlimited" : plan.userLimit}
                      </Td>
                    ))}
                  </Tr>
                )}

                {/* Usage Credits Row */}
                {hasCredits && (
                  <Tr>
                    <Td>
                      Usage Credits / Month
                    </Td>
                    {sortedPlans.map((plan) => (
                      <Td
                        key={plan.id}
                        className={`text-center text-sm ${
                          plan.id === currentPlanId
                            ? "font-medium text-gray-900 dark:text-dark-50"
                            : "text-gray-700 dark:text-dark-200"
                        }`}
                      >
                        {plan.usageCreditsPerMonth > 0 ? (
                          plan.usageCreditsPerMonth.toLocaleString()
                        ) : (
                          <span className="text-gray-400 dark:text-dark-400">
                            —
                          </span>
                        )}
                      </Td>
                    ))}
                  </Tr>
                )}

                {/* Bonus Credits Row */}
                {hasBonusCredits && (
                  <Tr>
                    <Td>
                      Bonus Credits (one-time)
                    </Td>
                    {sortedPlans.map((plan) => (
                      <Td
                        key={plan.id}
                        className={`text-center text-sm ${
                          plan.id === currentPlanId
                            ? "font-medium text-gray-900 dark:text-dark-50"
                            : "text-gray-700 dark:text-dark-200"
                        }`}
                      >
                        {plan.bonusCredits > 0 ? (
                          plan.bonusCredits.toLocaleString()
                        ) : (
                          <span className="text-gray-400 dark:text-dark-400">
                            —
                          </span>
                        )}
                      </Td>
                    ))}
                  </Tr>
                )}

                {/* Entitlement Rows */}
                {entitlementKeys.map(({ key, description }) => (
                  <Tr key={key}>
                    <Td>
                      {description}
                    </Td>
                    {sortedPlans.map((plan) => {
                      const ent: EntitlementValue | undefined =
                        plan.entitlements?.[key];
                      return (
                        <Td
                          key={plan.id}
                          className={`text-center ${
                            plan.id === currentPlanId
                              ? "text-gray-900 dark:text-dark-50"
                              : "text-gray-700 dark:text-dark-200"
                          }`}
                        >
                          {!ent ? (
                            <Minus className="mx-auto h-4 w-4 text-gray-400 dark:text-dark-400" />
                          ) : ent.type === "bool" ? (
                            ent.boolValue ? (
                              <Check className="mx-auto h-5 w-5 text-success" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-gray-400 dark:text-dark-400" />
                            )
                          ) : (
                            <span className="text-sm font-medium">
                              {ent.numericValue > 0 ? (
                                ent.numericValue.toLocaleString()
                              ) : (
                                <Minus className="mx-auto inline-block h-4 w-4 text-gray-400 dark:text-dark-400" />
                              )}
                            </span>
                          )}
                        </Td>
                      );
                    })}
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>

        {/* Billing Waiver Confirmation Modal */}
        {showWaiverModal && pendingWaiverPlan && (
          <Transition
            appear
            show
            as={Dialog}
            onClose={() => {
              setShowWaiverModal(false);
              setPendingWaiverPlan(null);
            }}
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
              className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
            >
              <div className="mb-4 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-warning" />
                <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
                  Billing Waiver Active
                </h3>
              </div>
              <p className="mb-2 text-gray-700 dark:text-dark-200">
                Your account currently has billing waived. Switching to{" "}
                <span className="font-medium text-gray-900 dark:text-dark-50">
                  {pendingWaiverPlan.name}
                </span>{" "}
                will start a paid subscription.
              </p>
              <p className="mb-6 text-sm text-gray-500 dark:text-dark-300">
                Your billing waiver will be removed and you'll be redirected to
                complete payment.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="flat"
                  color="neutral"
                  onClick={() => {
                    setShowWaiverModal(false);
                    setPendingWaiverPlan(null);
                  }}
                  className="h-9 min-w-[5rem]"
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="filled"
                  onClick={handleWaiverConfirm}
                  className="h-9 min-w-[10rem]"
                >
                  Switch to Paid Plan
                </Button>
              </div>
            </TransitionChild>
          </Transition>
        )}

        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <Transition
            appear
            show
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
              className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
            >
              <div className="mb-4 flex items-center gap-3">
                <XCircle className="h-6 w-6 text-error" />
                <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
                  Cancel Subscription
                </h3>
              </div>
              <p className="mb-2 text-gray-700 dark:text-dark-200">
                Are you sure you want to cancel your subscription?
              </p>
              {currentPeriodEnd && (
                <p className="mb-6 text-sm text-gray-500 dark:text-dark-300">
                  You'll keep your benefits until{" "}
                  <span className="font-medium text-gray-900 dark:text-dark-50">
                    {new Date(currentPeriodEnd).toLocaleDateString()}
                  </span>
                  . After that, you'll be downgraded to the Free plan.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="flat"
                  color="neutral"
                  onClick={() => setShowCancelModal(false)}
                  className="h-9 min-w-[8rem]"
                >
                  Keep Subscription
                </Button>
                <Button
                  color="error"
                  variant="filled"
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="h-9 min-w-[10rem]"
                >
                  {cancelLoading ? (
                    <Spinner className="h-4 w-4" color="primary" />
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              </div>
            </TransitionChild>
          </Transition>
        )}
      </div>
    </Page>
  );
}
