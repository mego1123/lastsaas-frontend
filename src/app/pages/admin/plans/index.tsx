// Import Dependencies
import { useEffect, useState, useCallback } from "react";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { toast } from "sonner";

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
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { adminApi } from "@/utils/api";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { getErrorMessage } from "@/utils/errors";
import type {
  Plan,
  EntitlementValue,
  EntitlementType,
  EntitlementKeyInfo,
  CreditBundle,
} from "@/@types/lastsaas";

// ----------------------------------------------------------------------

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ----------------------------------------------------------------------

export default function PlansPage() {
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role ?? null;
  const canWrite = role === "owner" || role === "admin";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [bundles, setBundles] = useState<CreditBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [editBundle, setEditBundle] = useState<CreditBundle | null>(null);
  const [showCreateBundle, setShowCreateBundle] = useState(false);
  const [deleteBundleTarget, setDeleteBundleTarget] =
    useState<CreditBundle | null>(null);
  const [deletingBundle, setDeletingBundle] = useState(false);
  const [deleteBundleError, setDeleteBundleError] = useState("");

  const [archiveTarget, setArchiveTarget] = useState<Plan | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await adminApi.listPlans();
      setPlans(data.plans);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBundles = useCallback(async () => {
    try {
      const data = await adminApi.listBundles();
      setBundles(data.bundles);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        const [plansData, bundlesData] = await Promise.all([
          adminApi.listPlans(),
          adminApi.listBundles(),
        ]);
        if (!controller.signal.aborted) {
          setPlans(plansData.plans);
          setBundles(bundlesData.bundles);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          toast.error(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    void loadData();
    return () => controller.abort();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await adminApi.deletePlan(deleteTarget.id);
      setDeleteTarget(null);
      toast.success(`${deleteTarget.name} deleted`);
      void fetchPlans();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setArchiveLoading(true);
    try {
      if (archiveTarget.isArchived) {
        await adminApi.unarchivePlan(archiveTarget.id);
        toast.success(`${archiveTarget.name} unarchived`);
      } else {
        await adminApi.archivePlan(archiveTarget.id);
        toast.success(`${archiveTarget.name} archived`);
      }
      void fetchPlans();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setArchiveLoading(false);
      setArchiveTarget(null);
    }
  };

  const confirmDeleteBundle = async () => {
    if (!deleteBundleTarget) return;
    setDeletingBundle(true);
    setDeleteBundleError("");
    try {
      await adminApi.deleteBundle(deleteBundleTarget.id);
      setDeleteBundleTarget(null);
      toast.success(`${deleteBundleTarget.name} deleted`);
      void fetchBundles();
    } catch (err: unknown) {
      setDeleteBundleError(getErrorMessage(err));
    } finally {
      setDeletingBundle(false);
    }
  };

  if (loading) {
    return (
      <Page title="Plans">
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-8" color="primary" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Plans">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Plans
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {plans.length} plan{plans.length !== 1 ? "s" : ""}
            </p>
          </div>
          {canWrite && (
            <Button
              color="primary"
              onClick={() => setShowCreate(true)}
              className="h-9"
            >
              <PlusIcon className="size-4" />
              Add Plan
            </Button>
          )}
        </div>

        {/* Plans Table */}
        <Card className="mt-3">
          <div className="min-w-full overflow-x-auto">
            <Table className="w-full min-w-[960px]">
              <THead>
                <Tr>
                  <Th className="text-left">Name</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Price</Th>
                  <Th className="text-center">Subscribers</Th>
                  <Th className="text-right">Credits</Th>
                  <Th className="text-left">Entitlements</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </THead>
              <TBody>
                {plans.map((plan) => (
                  <Tr
                    key={plan.id}
                    onClick={() => setEditPlan(plan)}
                    className={`cursor-pointer ${plan.isArchived ? "opacity-50" : ""}`}
                  >
                    <Td>
                      <span className="font-medium text-gray-900 dark:text-dark-50">
                        {plan.name}
                      </span>
                      {plan.description && (
                        <div className="mt-0.5 text-xs text-gray-400 dark:text-dark-400">
                          {plan.description}
                        </div>
                      )}
                    </Td>
                    <Td className="text-center">
                      {plan.isSystem ? (
                        <Badge
                          color="primary"
                          variant="soft"
                          className="flex w-fit items-center gap-1"
                        >
                          <ShieldCheckIcon className="size-3" />
                          System
                        </Badge>
                      ) : plan.isArchived ? (
                        <Badge
                          color="warning"
                          variant="soft"
                          className="flex w-fit items-center gap-1"
                        >
                          <ArchiveBoxIcon className="size-3" />
                          Archived
                        </Badge>
                      ) : (
                        <Badge color="success" variant="soft">
                          Active
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      {plan.pricingModel === "per_seat" ? (
                        <>
                          {plan.monthlyPriceCents > 0 &&
                            `${formatPrice(plan.monthlyPriceCents)} + `}
                          {formatPrice(plan.perSeatPriceCents)}/seat/mo
                          {plan.includedSeats > 0 && (
                            <span className="ml-1 text-xs text-gray-400 dark:text-dark-400">
                              ({plan.includedSeats} incl)
                            </span>
                          )}
                        </>
                      ) : plan.monthlyPriceCents === 0 ? (
                        "Free"
                      ) : (
                        `${formatPrice(plan.monthlyPriceCents)}/mo`
                      )}
                      {plan.annualDiscountPct > 0 && (
                        <span className="ml-1 text-xs text-success dark:text-success-light">
                          ({plan.annualDiscountPct}% annual)
                        </span>
                      )}
                    </Td>
                    <Td className="text-center">
                      <Badge
                        color={
                          (plan.subscriberCount ?? 0) > 0
                            ? "primary"
                            : "neutral"
                        }
                        variant="soft"
                        className="tabular-nums"
                      >
                        {plan.subscriberCount ?? 0}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      {plan.usageCreditsPerMonth > 0 ? (
                        <span>
                          {plan.usageCreditsPerMonth}/mo (
                          {plan.creditResetPolicy})
                        </span>
                      ) : (
                        "—"
                      )}
                      {plan.bonusCredits > 0 && (
                        <span className="ml-1 text-xs text-secondary-500 dark:text-secondary-400">
                          +{plan.bonusCredits} bonus
                        </span>
                      )}
                    </Td>
                    <Td>
                      {Object.keys(plan.entitlements || {}).length === 0 ? (
                        <span className="text-gray-400 dark:text-dark-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(plan.entitlements).map(
                            ([key, val]) => (
                              <Badge
                                key={key}
                                color={
                                  val.type === "bool"
                                    ? val.boolValue
                                      ? "success"
                                      : "neutral"
                                    : val.numericValue > 0
                                      ? "primary"
                                      : "neutral"
                                }
                                variant="soft"
                                className="text-xs"
                              >
                                {key}
                                {val.type === "numeric"
                                  ? `: ${val.numericValue}`
                                  : val.boolValue
                                    ? ""
                                    : ": off"}
                              </Badge>
                            ),
                          )}
                        </div>
                      )}
                    </Td>
                    <Td className="text-right">
                      {canWrite && (
                        <div className="flex items-center justify-end gap-1">
                          {!plan.isSystem && !plan.isArchived && (
                            <Button
                              isIcon
                              variant="flat"
                              color="warning"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setArchiveTarget(plan);
                              }}
                              title="Archive plan"
                              aria-label="Archive plan"
                            >
                              <ArchiveBoxIcon className="size-4" />
                            </Button>
                          )}
                          {!plan.isSystem && plan.isArchived && (
                            <Button
                              isIcon
                              variant="flat"
                              color="success"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setArchiveTarget(plan);
                              }}
                              title="Unarchive plan"
                              aria-label="Unarchive plan"
                            >
                              <ArrowPathIcon className="size-4" />
                            </Button>
                          )}
                          {!plan.isSystem &&
                            (plan.subscriberCount ?? 0) === 0 && (
                              <Button
                                isIcon
                                variant="flat"
                                color="error"
                                className="size-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(plan);
                                }}
                                title="Delete plan"
                                aria-label="Delete plan"
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            )}
                        </div>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>

        {/* Create Modal */}
        {canWrite && showCreate && (
          <PlanFormModal
            onClose={() => setShowCreate(false)}
            onSaved={() => {
              setShowCreate(false);
              void fetchPlans();
            }}
          />
        )}

        {/* Edit Modal */}
        {editPlan && (
          <PlanFormModal
            plan={editPlan}
            subscriberCount={editPlan.subscriberCount}
            readOnly={!canWrite}
            onClose={() => setEditPlan(null)}
            onSaved={() => {
              setEditPlan(null);
              void fetchPlans();
            }}
          />
        )}

        {/* Delete Confirm Modal */}
        <Transition
          appear
          show={deleteTarget !== null}
          as={Dialog}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError("");
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
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-soft transition-all dark:bg-dark-700"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-error/10">
                <ExclamationTriangleIcon className="size-5 text-error" />
              </div>
              <DialogTitle className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
                Delete Plan
              </DialogTitle>
            </div>
            <p className="mb-6 text-gray-700 dark:text-dark-200">
              Are you sure you want to delete{" "}
              <strong className="text-gray-900 dark:text-dark-50">
                {deleteTarget?.name}
              </strong>
              ? This cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="flat"
                color="neutral"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                color="error"
                onClick={confirmDelete}
                disabled={deleting}
                className="h-9"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </TransitionChild>
        </Transition>

        {/* ─── Credit Bundles Section ─────────────────────────────────────── */}
        <div className="mt-12">
          <div className="flex items-center justify-between pb-5">
            <div>
              <h2 className="flex items-center gap-3 text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                <BoltIcon className="size-6 text-secondary-500 dark:text-secondary-400" />
                Credit Bundles
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                {bundles.length} bundle{bundles.length !== 1 ? "s" : ""}
                {bundles.length === 0 &&
                  " — end users cannot purchase one-time credits"}
              </p>
            </div>
            {canWrite && (
              <Button
                color="primary"
                onClick={() => setShowCreateBundle(true)}
                className="h-9"
              >
                <PlusIcon className="size-4" />
                Add Bundle
              </Button>
            )}
          </div>

          {bundles.length > 0 && (
            <Card className="mt-3">
              <div className="min-w-full overflow-x-auto">
                <Table className="w-full min-w-[760px]">
                  <THead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Credits</Th>
                      <Th>Price</Th>
                      <Th>Active</Th>
                      <Th>Sort Order</Th>
                      <Th className="text-right">Actions</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {bundles.map((bundle) => (
                      <Tr
                        key={bundle.id}
                        onClick={() => setEditBundle(bundle)}
                        className="cursor-pointer"
                      >
                        <Td>
                          {bundle.name}
                        </Td>
                        <Td>
                          {bundle.credits.toLocaleString()}
                        </Td>
                        <Td>
                          {formatPrice(bundle.priceCents)}
                        </Td>
                        <Td>
                          {bundle.isActive ? (
                            <Badge color="success" variant="soft">
                              Active
                            </Badge>
                          ) : (
                            <Badge color="neutral" variant="soft">
                              Inactive
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          {bundle.sortOrder}
                        </Td>
                        <Td className="text-right">
                          {canWrite && (
                            <Button
                              isIcon
                              variant="flat"
                              color="error"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteBundleTarget(bundle);
                              }}
                              title="Delete bundle"
                              aria-label="Delete bundle"
                            >
                              <TrashIcon className="size-4" />
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>
          )}
        </div>

        {/* Create Bundle Modal */}
        {canWrite && showCreateBundle && (
          <BundleFormModal
            onClose={() => setShowCreateBundle(false)}
            onSaved={() => {
              setShowCreateBundle(false);
              void fetchBundles();
            }}
          />
        )}

        {/* Edit Bundle Modal */}
        {editBundle && (
          <BundleFormModal
            bundle={editBundle}
            readOnly={!canWrite}
            onClose={() => setEditBundle(null)}
            onSaved={() => {
              setEditBundle(null);
              void fetchBundles();
            }}
          />
        )}

        {/* Archive/Unarchive Confirm Modal */}
        <ConfirmModal
          show={archiveTarget !== null}
          onClose={() => setArchiveTarget(null)}
          onOk={handleArchiveConfirm}
          state="pending"
          confirmLoading={archiveLoading}
          messages={{
            pending: {
              title: archiveTarget?.isArchived
                ? "Unarchive Plan"
                : "Archive Plan",
              description: archiveTarget?.isArchived
                ? `Are you sure you want to unarchive ${archiveTarget?.name}? It will become available for new subscriptions.`
                : `Are you sure you want to archive ${archiveTarget?.name}? Existing subscribers will keep their plan, but no new subscriptions can be created.`,
              actionText: archiveTarget?.isArchived
                ? "Unarchive"
                : "Archive",
            },
          }}
        />

        {/* Delete Bundle Confirm Modal */}
        <Transition
          appear
          show={deleteBundleTarget !== null}
          as={Dialog}
          onClose={() => {
            setDeleteBundleTarget(null);
            setDeleteBundleError("");
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
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-soft transition-all dark:bg-dark-700"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-error/10">
                <ExclamationTriangleIcon className="size-5 text-error" />
              </div>
              <DialogTitle className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
                Delete Credit Bundle
              </DialogTitle>
            </div>
            <p className="mb-6 text-gray-700 dark:text-dark-200">
              Are you sure you want to delete{" "}
              <strong className="text-gray-900 dark:text-dark-50">
                {deleteBundleTarget?.name}
              </strong>
              ? This cannot be undone.
            </p>
            {deleteBundleError && (
              <div className="mb-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
                {deleteBundleError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="flat"
                color="neutral"
                onClick={() => {
                  setDeleteBundleTarget(null);
                  setDeleteBundleError("");
                }}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                color="error"
                onClick={confirmDeleteBundle}
                disabled={deletingBundle}
                className="h-9"
              >
                {deletingBundle ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </TransitionChild>
        </Transition>
      </div>
    </Page>
  );
}

// ─── Plan Form Modal (Create / Edit) ────────────────────────────────────────

interface PlanFormModalProps {
  plan?: Plan;
  subscriberCount?: number;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function PlanFormModal({
  plan,
  subscriberCount,
  readOnly,
  onClose,
  onSaved,
}: PlanFormModalProps) {
  const isEdit = !!plan;

  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [monthlyPriceDollars, setMonthlyPriceDollars] = useState(
    plan ? (plan.monthlyPriceCents / 100).toFixed(2) : "0.00",
  );
  const [annualDiscountPct, setAnnualDiscountPct] = useState(
    String(plan?.annualDiscountPct ?? 0),
  );
  const [usageCreditsPerMonth, setUsageCreditsPerMonth] = useState(
    String(plan?.usageCreditsPerMonth ?? 0),
  );
  const [creditResetPolicy, setCreditResetPolicy] = useState<
    "reset" | "accrue"
  >(plan?.creditResetPolicy ?? "reset");
  const [bonusCredits, setBonusCredits] = useState(
    String(plan?.bonusCredits ?? 0),
  );
  const [userLimit, setUserLimit] = useState(String(plan?.userLimit ?? 0));
  const [pricingModel, setPricingModel] = useState<"flat" | "per_seat">(
    plan?.pricingModel ?? "flat",
  );
  const [perSeatPriceDollars, setPerSeatPriceDollars] = useState(
    plan ? (plan.perSeatPriceCents / 100).toFixed(2) : "0.00",
  );
  const [includedSeats, setIncludedSeats] = useState(
    String(plan?.includedSeats ?? 0),
  );
  const [minSeats, setMinSeats] = useState(String(plan?.minSeats ?? 1));
  const [maxSeats, setMaxSeats] = useState(String(plan?.maxSeats ?? 0));
  const [trialDays, setTrialDays] = useState(String(plan?.trialDays ?? 0));
  const [entitlements, setEntitlements] = useState<
    Record<string, EntitlementValue>
  >(plan?.entitlements ?? {});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [knownKeys, setKnownKeys] = useState<EntitlementKeyInfo[]>([]);
  useEffect(() => {
    adminApi
      .listEntitlementKeys()
      .then((data) => setKnownKeys(data.keys))
      .catch(() => {
        /* non-critical */
      });
  }, []);

  const [newKey, setNewKey] = useState("");
  const [newType, setNewType] = useState<EntitlementType>("bool");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const priceCents = Math.round(
      parseFloat(monthlyPriceDollars || "0") * 100,
    );
    if (isNaN(priceCents) || priceCents < 0) {
      setError("Invalid price");
      setSaving(false);
      return;
    }

    const discount = parseInt(annualDiscountPct) || 0;
    if (discount < 0 || discount > 100) {
      setError("Annual discount must be between 0 and 100");
      setSaving(false);
      return;
    }

    const trial = parseInt(trialDays) || 0;
    if (trial < 0) {
      setError("Trial days cannot be negative");
      setSaving(false);
      return;
    }

    const parsedMinSeats = parseInt(minSeats) || 1;
    const parsedMaxSeats = parseInt(maxSeats) || 0;
    if (
      pricingModel === "per_seat" &&
      parsedMaxSeats > 0 &&
      parsedMaxSeats < parsedMinSeats
    ) {
      setError("Max seats cannot be less than min seats");
      setSaving(false);
      return;
    }

    const perSeatPriceCents = Math.round(
      parseFloat(perSeatPriceDollars || "0") * 100,
    );

    const payload = {
      name: name.trim(),
      description: description.trim(),
      monthlyPriceCents: priceCents,
      annualDiscountPct: discount,
      usageCreditsPerMonth: parseInt(usageCreditsPerMonth) || 0,
      creditResetPolicy,
      bonusCredits: parseInt(bonusCredits) || 0,
      userLimit: parseInt(userLimit) || 0,
      pricingModel,
      perSeatPriceCents,
      includedSeats: parseInt(includedSeats) || 0,
      minSeats: parsedMinSeats,
      maxSeats: parsedMaxSeats,
      trialDays: trial,
      entitlements,
    };

    try {
      if (isEdit) {
        await adminApi.updatePlan(plan!.id, payload);
      } else {
        await adminApi.createPlan(payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const addEntitlement = () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || entitlements[key] !== undefined) return;
    const known = knownKeys.find((k) => k.key === key);
    const desc = known?.description ?? "";
    setEntitlements((prev) => ({
      ...prev,
      [key]:
        newType === "bool"
          ? {
              type: "bool",
              boolValue: false,
              numericValue: 0,
              description: desc,
            }
          : {
              type: "numeric",
              boolValue: false,
              numericValue: 0,
              description: desc,
            },
    }));
    setNewKey("");
  };

  const removeEntitlement = (key: string) => {
    setEntitlements((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateEntitlementValue = (key: string, val: EntitlementValue) => {
    setEntitlements((prev) => ({ ...prev, [key]: val }));
  };

  // Merge known keys that aren't already in entitlements, for display
  const allKeys = Array.from(
    new Set([
      ...Object.keys(entitlements),
      ...knownKeys.map((k) => k.key),
    ]),
  );

  return (
    <Transition
      appear
      show
      as={Dialog}
      onClose={onClose}
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
        className="scrollbar-sm relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-soft transition-all dark:bg-dark-700"
      >
        <div className="flex items-center justify-between pb-5">
          <DialogTitle className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            {readOnly ? "View Plan" : isEdit ? "Edit Plan" : "Create Plan"}
          </DialogTitle>
          <Button
            isIcon
            variant="flat"
            color="neutral"
            className="size-8"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="size-5" />
          </Button>
        </div>

        {isEdit && (subscriberCount ?? 0) > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-sm text-warning">
              <strong>
                {subscriberCount} tenant{subscriberCount !== 1 ? "s" : ""}
              </strong>{" "}
              subscribed to this plan. Changes to pricing, credits, limits, and
              entitlements will affect existing subscribers.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Basics */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300">
              Basics
            </h4>
            <div className="space-y-3">
              <Input
                label="Name"
                placeholder="e.g. Pro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={readOnly || (isEdit && plan?.isSystem)}
              />
              <Input
                label="Description"
                placeholder="Short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300">
              Pricing
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Monthly Price ($)"
                inputMode="decimal"
                value={monthlyPriceDollars}
                onChange={(e) => setMonthlyPriceDollars(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={() => {
                  const n = parseFloat(monthlyPriceDollars);
                  setMonthlyPriceDollars(
                    isNaN(n) ? "0.00" : n.toFixed(2),
                  );
                }}
                disabled={readOnly}
              />
              <Input
                label="Annual Discount %"
                inputMode="numeric"
                value={annualDiscountPct}
                onChange={(e) => setAnnualDiscountPct(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={() =>
                  setAnnualDiscountPct(String(parseInt(annualDiscountPct) || 0))
                }
                description="Set to 0 to hide annual option"
                disabled={readOnly}
              />
              <Input
                label="Trial Days"
                inputMode="numeric"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={() =>
                  setTrialDays(String(parseInt(trialDays) || 0))
                }
                description="0 = no trial"
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Pricing Model */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300">
              Pricing Model
            </h4>
            <div className="mb-3 flex gap-3">
              <Button
                variant={pricingModel === "flat" ? "filled" : "outlined"}
                color={pricingModel === "flat" ? "primary" : "neutral"}
                className="h-10 flex-1"
                onClick={() => setPricingModel("flat")}
                disabled={readOnly}
              >
                Flat Rate
              </Button>
              <Button
                variant={pricingModel === "per_seat" ? "filled" : "outlined"}
                color={pricingModel === "per_seat" ? "primary" : "neutral"}
                className="h-10 flex-1"
                onClick={() => setPricingModel("per_seat")}
                disabled={readOnly}
              >
                Per Seat
              </Button>
            </div>

            {pricingModel === "per_seat" && (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-100 p-3 dark:border-dark-600 dark:bg-dark-600/40">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Per Seat Price ($/mo)"
                    inputMode="decimal"
                    value={perSeatPriceDollars}
                    onChange={(e) => setPerSeatPriceDollars(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => {
                      const n = parseFloat(perSeatPriceDollars);
                      setPerSeatPriceDollars(
                        isNaN(n) ? "0.00" : n.toFixed(2),
                      );
                    }}
                    disabled={readOnly}
                  />
                  <Input
                    label="Included Seats"
                    inputMode="numeric"
                    value={includedSeats}
                    onChange={(e) => setIncludedSeats(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() =>
                      setIncludedSeats(String(parseInt(includedSeats) || 0))
                    }
                    description="Seats included in base price (0 = purely per-seat)"
                    disabled={readOnly}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min Seats"
                    inputMode="numeric"
                    value={minSeats}
                    onChange={(e) => setMinSeats(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() =>
                      setMinSeats(String(parseInt(minSeats) || 1))
                    }
                    disabled={readOnly}
                  />
                  <Input
                    label="Max Seats"
                    inputMode="numeric"
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() =>
                      setMaxSeats(String(parseInt(maxSeats) || 0))
                    }
                    description="0 = unlimited"
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Credits */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300">
              Credits
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Usage Credits / Month"
                inputMode="numeric"
                value={usageCreditsPerMonth}
                onChange={(e) => setUsageCreditsPerMonth(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={() =>
                  setUsageCreditsPerMonth(
                    String(parseInt(usageCreditsPerMonth) || 0),
                  )
                }
                disabled={readOnly}
              />
              {(parseInt(usageCreditsPerMonth) || 0) > 0 && (
                <Select
                  label="Reset Policy"
                  value={creditResetPolicy}
                  onChange={(e) =>
                    setCreditResetPolicy(
                      e.target.value as "reset" | "accrue",
                    )
                  }
                  disabled={readOnly}
                  data={[
                    { label: "Reset each month", value: "reset" },
                    { label: "Accrue (roll over)", value: "accrue" },
                  ]}
                />
              )}
            </div>
            <div className="mt-3">
              <Input
                label="Bonus Credits (one-time)"
                inputMode="numeric"
                value={bonusCredits}
                onChange={(e) => setBonusCredits(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={() =>
                  setBonusCredits(String(parseInt(bonusCredits) || 0))
                }
                description="Added once when plan is activated"
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Limits */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300">
              Limits
            </h4>
            <Input
              label="User Limit"
              inputMode="numeric"
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={() => setUserLimit(String(parseInt(userLimit) || 0))}
              description="0 = unlimited"
              disabled={readOnly}
            />
          </div>

          {/* Entitlements */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300">
              Entitlements
            </h4>
            {allKeys.length > 0 && (
              <div className="mb-3 space-y-2">
                {allKeys.map((key) => {
                  const knownKey = knownKeys.find((k) => k.key === key);
                  const type =
                    entitlements[key]?.type ?? knownKey?.type ?? "bool";
                  const val = entitlements[key];
                  const isBool = type === "bool";
                  const desc =
                    val?.description ?? knownKey?.description ?? "";

                  return (
                    <div
                      key={key}
                      className="space-y-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-dark-600/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-1 font-mono text-sm text-gray-900 dark:text-dark-50">
                          {key}
                        </span>
                        <span className="text-xs uppercase text-gray-400 dark:text-dark-400">
                          {type}
                        </span>
                        {isBool ? (
                          <Switch
                            color="primary"
                            checked={val?.boolValue ?? false}
                            onChange={(e) =>
                              updateEntitlementValue(key, {
                                type: "bool",
                                boolValue: e.target.checked,
                                numericValue: 0,
                                description: desc,
                              })
                            }
                            disabled={readOnly}
                          />
                        ) : (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={val?.numericValue ?? 0}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const n =
                                raw === "" ? 0 : parseInt(raw) || 0;
                              updateEntitlementValue(key, {
                                type: "numeric",
                                boolValue: false,
                                numericValue: n,
                                description: desc,
                              });
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={readOnly}
                            className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-50 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-50"
                          />
                        )}
                        {!readOnly && (
                          <Button
                            isIcon
                            variant="flat"
                            color="error"
                            className="size-7"
                            onClick={() => removeEntitlement(key)}
                            aria-label="Remove entitlement"
                          >
                            <TrashIcon className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      <input
                        value={val?.description ?? desc}
                        onChange={(e) =>
                          updateEntitlementValue(key, {
                            ...(val ?? {
                              type: type as EntitlementType,
                              boolValue: false,
                              numericValue: 0,
                              description: "",
                            }),
                            description: e.target.value,
                          })
                        }
                        placeholder="Description (shown to end users)"
                        disabled={readOnly}
                        className="w-full rounded border border-gray-300/50 bg-gray-100 px-2 py-1 text-xs text-gray-700 focus:border-primary-500 focus:outline-none disabled:opacity-50 dark:border-dark-500/50 dark:bg-dark-700/50 dark:text-dark-300"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new entitlement */}
            {!readOnly && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="entitlement_name"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addEntitlement();
                  }}
                  className="h-9 flex-1 font-mono"
                />
                <Select
                  value={newType}
                  onChange={(e) =>
                    setNewType(e.target.value as EntitlementType)
                  }
                  className="h-9 w-32"
                  data={[
                    { label: "Boolean", value: "bool" },
                    { label: "Numeric", value: "numeric" },
                  ]}
                />
                <Button
                  variant="outlined"
                  color="neutral"
                  isIcon
                  className="size-9"
                  onClick={addEntitlement}
                  disabled={!newKey.trim()}
                  aria-label="Add entitlement"
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-dark-600">
          <Button
            variant="flat"
            color="neutral"
            onClick={onClose}
            className="h-9"
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button
              color="primary"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="h-9"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Plan"}
            </Button>
          )}
        </div>
      </TransitionChild>
    </Transition>
  );
}

// ─── Bundle Form Modal (Create / Edit) ─────────────────────────────────────

interface BundleFormModalProps {
  bundle?: CreditBundle;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function BundleFormModal({
  bundle,
  readOnly,
  onClose,
  onSaved,
}: BundleFormModalProps) {
  const isEdit = !!bundle;

  const [name, setName] = useState(bundle?.name ?? "");
  const [credits, setCredits] = useState(String(bundle?.credits ?? 100));
  const [priceDollars, setPriceDollars] = useState(
    bundle ? (bundle.priceCents / 100).toFixed(2) : "9.99",
  );
  const [isActive, setIsActive] = useState(bundle?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(bundle?.sortOrder ?? 0));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const priceCents = Math.round(parseFloat(priceDollars || "0") * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Price must be greater than $0");
      setSaving(false);
      return;
    }
    const creditsNum = parseInt(credits) || 0;
    if (creditsNum <= 0) {
      setError("Credits must be greater than 0");
      setSaving(false);
      return;
    }

    const sortOrderNum = parseInt(sortOrder) || 0;
    if (sortOrderNum < 0) {
      setError("Sort order cannot be negative");
      setSaving(false);
      return;
    }

    const payload = {
      name: name.trim(),
      credits: creditsNum,
      priceCents,
      isActive,
      sortOrder: sortOrderNum,
    };

    try {
      if (isEdit) {
        await adminApi.updateBundle(bundle!.id, payload);
      } else {
        await adminApi.createBundle(payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition
      appear
      show
      as={Dialog}
      onClose={onClose}
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
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-soft transition-all dark:bg-dark-700"
      >
        <div className="flex items-center justify-between pb-5">
          <DialogTitle className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            {readOnly
              ? "View Credit Bundle"
              : isEdit
                ? "Edit Credit Bundle"
                : "Create Credit Bundle"}
          </DialogTitle>
          <Button
            isIcon
            variant="flat"
            color="neutral"
            className="size-8"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="size-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. Starter Pack"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={readOnly}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Credits"
              inputMode="numeric"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={() => setCredits(String(parseInt(credits) || 0))}
              disabled={readOnly}
            />
            <Input
              label="Price ($)"
              inputMode="decimal"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                const n = parseFloat(priceDollars);
                setPriceDollars(isNaN(n) ? "0.00" : n.toFixed(2));
              }}
              disabled={readOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sort Order"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={() => setSortOrder(String(parseInt(sortOrder) || 0))}
              description="Lower numbers display first"
              disabled={readOnly}
            />
            <div>
              <label className="input-label mb-1 block text-sm text-gray-500 dark:text-dark-300">
                Active
              </label>
              <Switch
                color="primary"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={readOnly}
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-dark-400">
                Inactive bundles are hidden from users
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-dark-600">
          <Button
            variant="flat"
            color="neutral"
            onClick={onClose}
            className="h-9"
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button
              color="primary"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="h-9"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Bundle"}
            </Button>
          )}
        </div>
      </TransitionChild>
    </Transition>
  );
}
