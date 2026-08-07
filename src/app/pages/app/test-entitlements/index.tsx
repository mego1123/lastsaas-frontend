// Import Dependencies
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import {
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon,
  BoltIcon,
  HashtagIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Table, TBody, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { plansApi } from "@/utils/api";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { getErrorMessage } from "@/utils/errors";
import type { Plan, EntitlementType } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/TestEntitlementsPage.tsx` (346 LOC).
// ----------------------------------------------------------------------

function renderTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(
      new RegExp(`\\{\\{\\.${key}\\}\\}`, "g"),
      String(value),
    );
  }
  result = result.replace(
    /\{\{if ne \.(\w+) (\d+)\}\}(.*?)\{\{end\}\}/g,
    (_match, varName, compare, content) => {
      return String(vars[varName]) !== compare ? content : "";
    },
  );
  return result;
}

interface EntitlementInfo {
  key: string;
  type: EntitlementType;
  description: string;
}

export default function TestEntitlementsPage() {
  const { currentTenant } = useTenantContext();
  const isRootTenant = !!currentTenant?.isRoot;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState("");
  const [loading, setLoading] = useState(true);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptBody, setPromptBody] = useState("");
  const [promptNumericBody, setPromptNumericBody] = useState("");
  const [testResults, setTestResults] = useState<
    Record<string, "success" | "fail">
  >({});
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>(
    {},
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testedValue, setTestedValue] = useState(0);

  useEffect(() => {
    plansApi
      .list()
      .then((data) => {
        setPlans(data.plans);
        setCurrentPlanId(data.currentPlanId);
        setPromptTitle(data.entitlementUpgradePromptTitle || "Upgrade required");
        setPromptBody(data.entitlementUpgradePromptBody || "");
        setPromptNumericBody(data.entitlementUpgradePromptNumericBody || "");
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (!isRootTenant) {
    return <Navigate to="/dashboard" replace />;
  }

  const currentPlan = plans.find((p) => p.id === currentPlanId);

  // Collect all unique entitlement keys across all plans
  const allEntitlements: EntitlementInfo[] = [];
  const seenKeys = new Set<string>();
  for (const plan of plans) {
    for (const [key, val] of Object.entries(plan.entitlements || {})) {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allEntitlements.push({
          key,
          type: val.type,
          description: val.description || key,
        });
      }
    }
  }

  const handleTest = (entitlementKey: string) => {
    const currentEnt = currentPlan?.entitlements?.[entitlementKey];
    const meta = allEntitlements.find((e) => e.key === entitlementKey);

    let passed = false;
    let requestedValue = 0;
    if (meta?.type === "bool") {
      passed = currentEnt?.boolValue === true;
    } else if (meta?.type === "numeric") {
      requestedValue = Math.max(
        1,
        parseInt(numericInputs[entitlementKey] || "1", 10) || 1,
      );
      passed = (currentEnt?.numericValue ?? 0) >= requestedValue;
    }

    if (passed) {
      setTestResults((prev) => ({ ...prev, [entitlementKey]: "success" }));
      setTimeout(
        () =>
          setTestResults((prev) => {
            const next = { ...prev };
            if (next[entitlementKey] === "success") delete next[entitlementKey];
            return next;
          }),
        3000,
      );
    } else {
      setTestedValue(requestedValue);
      setTestResults((prev) => ({ ...prev, [entitlementKey]: "fail" }));
      setTestingKey(entitlementKey);
      setShowUpgradeModal(true);
    }
  };

  const getRecommendedPlan = (
    entitlementKey: string,
    requestedValue: number,
  ): Plan | undefined => {
    const meta = allEntitlements.find((e) => e.key === entitlementKey);
    const sortedByPrice = [...plans].sort(
      (a, b) => a.monthlyPriceCents - b.monthlyPriceCents,
    );

    return sortedByPrice.find((p) => {
      if (p.id === currentPlanId) return false;
      const ent = p.entitlements?.[entitlementKey];
      if (!ent) return false;

      if (meta?.type === "bool") {
        return ent.boolValue === true;
      } else if (meta?.type === "numeric") {
        return ent.numericValue >= requestedValue;
      }
      return false;
    });
  };

  const formatCurrentValue = (entitlementKey: string): React.ReactNode => {
    const ent = currentPlan?.entitlements?.[entitlementKey];
    const meta = allEntitlements.find((e) => e.key === entitlementKey);
    if (!ent) {
      return (
        <span className="text-gray-400 dark:text-dark-400">Not included</span>
      );
    }
    if (meta?.type === "bool") {
      return ent.boolValue ? (
        <span className="flex items-center gap-1 text-success dark:text-success-light">
          <CheckIcon className="h-4 w-4" /> Enabled
        </span>
      ) : (
        <span className="flex items-center gap-1 text-gray-400 dark:text-dark-400">
          <XMarkIcon className="h-4 w-4" /> Disabled
        </span>
      );
    }
    if (meta?.type === "numeric") {
      return ent.numericValue > 0 ? (
        <span className="font-medium text-gray-900 dark:text-dark-50">
          {ent.numericValue.toLocaleString()}
        </span>
      ) : (
        <span className="text-gray-400 dark:text-dark-400">0</span>
      );
    }
    return <span className="text-gray-400 dark:text-dark-400">&mdash;</span>;
  };

  const formatPlanValue = (
    plan: Plan,
    entitlementKey: string,
  ): React.ReactNode => {
    const ent = plan.entitlements?.[entitlementKey];
    const meta = allEntitlements.find((e) => e.key === entitlementKey);
    if (!ent) {
      return <span className="text-gray-300 dark:text-dark-500">&mdash;</span>;
    }
    if (meta?.type === "bool") {
      return ent.boolValue ? (
        <CheckIcon className="h-4 w-4 text-success dark:text-success-light" />
      ) : (
        <XMarkIcon className="h-4 w-4 text-gray-300 dark:text-dark-500" />
      );
    }
    if (meta?.type === "numeric") {
      return (
        <span
          className={
            ent.numericValue > 0
              ? "text-gray-900 dark:text-dark-50"
              : "text-gray-300 dark:text-dark-500"
          }
        >
          {ent.numericValue.toLocaleString()}
        </span>
      );
    }
    return <span className="text-gray-300 dark:text-dark-500">&mdash;</span>;
  };

  if (loading) {
    return (
      <Page title="Test Entitlements">
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" color="primary" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Test Entitlements">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="mb-6">
          <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Test Entitlements
          </h2>
          <p className="mt-1 text-gray-500 dark:text-dark-300">
            Current plan:{" "}
            <span className="font-medium text-gray-900 dark:text-dark-50">
              {currentPlan?.name || "None"}
            </span>
          </p>
        </div>

        {allEntitlements.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldCheckIcon className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-dark-500" />
            <p className="text-gray-500 dark:text-dark-300">
              No entitlements are defined across any plan.
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-dark-400">
              Add entitlements to your plans in Admin &rarr; Plans.
            </p>
          </Card>
        ) : (
          <>
            {/* Entitlements Test Table */}
            <Card className="mb-8 overflow-hidden p-0">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-dark-700">
                <h2 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
                  Entitlements on Current Plan
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">
                  Click &ldquo;Test&rdquo; to simulate using each entitlement
                </p>
              </div>
              <div className="min-w-full overflow-x-auto">
                <Table hoverable className="w-full">
                  <THead>
                    <Tr>
                      <Th>
                        Entitlement
                      </Th>
                      <Th>
                        Type
                      </Th>
                      <Th>
                        Current Value
                      </Th>
                      <Th>
                        Action
                      </Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {allEntitlements.map((ent) => (
                      <Tr>
                        <Td>
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                            {ent.description}
                          </p>
                          <p className="font-mono text-xs text-gray-400 dark:text-dark-400">
                            {ent.key}
                          </p>
                        </Td>
                        <Td>
                          <Badge
                            color={ent.type === "bool" ? "primary" : "secondary"}
                            variant="soft"
                            className="flex w-fit items-center gap-1 rounded-full"
                          >
                            {ent.type === "bool" ? (
                              <AdjustmentsHorizontalIcon className="h-3 w-3" />
                            ) : (
                              <HashtagIcon className="h-3 w-3" />
                            )}
                            {ent.type === "bool" ? "Boolean" : "Numeric"}
                          </Badge>
                        </Td>
                        <Td>
                          {formatCurrentValue(ent.key)}
                        </Td>
                        <Td>
                          <div className="flex items-center justify-end gap-2">
                            {testResults[ent.key] === "success" && (
                              <span className="flex items-center gap-1 text-xs text-success dark:text-success-light">
                                <CheckIcon className="h-3.5 w-3.5" /> Access
                                granted
                              </span>
                            )}
                            {testResults[ent.key] === "fail" && (
                              <span className="flex items-center gap-1 text-xs text-error dark:text-error-light">
                                <XMarkIcon className="h-3.5 w-3.5" /> Blocked
                              </span>
                            )}
                            {ent.type === "numeric" && (
                              <input
                                type="number"
                                min="1"
                                placeholder="Value"
                                value={numericInputs[ent.key] || ""}
                                onChange={(e) =>
                                  setNumericInputs((prev) => ({
                                    ...prev,
                                    [ent.key]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleTest(ent.key);
                                }}
                                className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-right text-xs text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-dark-50 dark:placeholder:text-dark-400"
                              />
                            )}
                            <Button
                              variant="outlined"
                              color="neutral"
                              onClick={() => handleTest(ent.key)}
                              className="h-7 px-3 text-xs"
                            >
                              Test
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>

            {/* Comparison Matrix */}
            <Card className="mt-3">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-dark-700">
                <h2 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
                  Entitlements by Plan
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">
                  Compare entitlements across all plans
                </p>
              </div>
              <div className="min-w-full overflow-x-auto">
                <Table hoverable className="w-full">
                  <THead>
                    <Tr>
                      <Th>
                        Entitlement
                      </Th>
                      {plans.map((plan) => (
                        <Th>
                          <span
                            className={
                              plan.id === currentPlanId
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-gray-500 dark:text-dark-300"
                            }
                          >
                            {plan.name}
                          </span>
                          {plan.id === currentPlanId && (
                            <span className="mt-0.5 block text-xs text-primary-600/60 dark:text-primary-400/60">
                              Current
                            </span>
                          )}
                        </Th>
                      ))}
                    </Tr>
                  </THead>
                  <TBody>
                    {allEntitlements.map((ent) => (
                      <Tr>
                        <Td>
                          {ent.description}
                        </Td>
                        {plans.map((plan) => (
                          <Td>
                            {formatPlanValue(plan, ent.key)}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>
          </>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal &&
          testingKey &&
          (() => {
            const entMeta = allEntitlements.find((e) => e.key === testingKey);
            const recommended = getRecommendedPlan(testingKey, testedValue);
            const isNumeric = entMeta?.type === "numeric";
            const templateVars = {
              EntitlementName: entMeta?.description || testingKey,
              PlanName: currentPlan?.name || "",
              AppName: "LastSaaS",
              RecommendedPlanName: recommended?.name || "a higher plan",
              RequestedValue: testedValue,
              CurrentValue:
                currentPlan?.entitlements?.[testingKey]?.numericValue ?? 0,
            };
            const bodyTemplate =
              isNumeric && promptNumericBody ? promptNumericBody : promptBody;
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Card className="mx-4 w-full max-w-md p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <BoltIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
                      {renderTemplate(promptTitle, templateVars)}
                    </h3>
                  </div>
                  <p className="mb-6 text-gray-600 dark:text-dark-200">
                    {renderTemplate(bodyTemplate, templateVars)}
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="flat"
                      color="neutral"
                      onClick={() => {
                        setShowUpgradeModal(false);
                        setTestingKey(null);
                      }}
                      className="h-9"
                    >
                      Cancel
                    </Button>
                    <Button
                      component={Link}
                      to={
                        recommended
                          ? `/plan?upgrade=${recommended.id}`
                          : "/plan"
                      }
                      color="primary"
                      variant="filled"
                      className="h-9"
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })()}
      </div>
    </Page>
  );
}
