// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  TagIcon,
  PlusIcon,
  XMarkIcon,
  NoSymbolIcon,
  CalendarDaysIcon,
  FunnelIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Form/Input";
import { Checkbox } from "@/components/ui/Form/Checkbox";
import { Table, TBody, THead, Tr, Th, Td } from "@/components/ui/Table";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { adminApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type { Promotion, EligibleProduct } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/PromotionsPage.tsx`.
// ----------------------------------------------------------------------

/** Deduplicate product names from Stripe Product IDs (plans have 2 products: monthly + annual). */
function uniqueProductNames(
  productIds: string[],
  nameMap: Record<string, string>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const pid of productIds) {
    const name = nameMap[pid] || pid.slice(0, 12) + "...";
    if (!seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

export default function PromotionsPage() {
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role;
  const canWrite = role === "owner" || role === "admin";

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [productNames, setProductNames] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Promotion | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<Promotion | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchPromotions = useCallback(async () => {
    try {
      const data = await adminApi.listPromotions();
      setPromotions(data.promotions);
      setProductNames(data.productNames || {});
      setLoadError("");
    } catch (err) {
      const msg = getErrorMessage(err);
      setLoadError(msg);
      toast.error(msg);
      setPromotions([]);
      setProductNames({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        const data = await adminApi.listPromotions();
        if (!controller.signal.aborted) {
          setPromotions(data.promotions);
          setProductNames(data.productNames || {});
          setLoadError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const msg = getErrorMessage(err);
          setLoadError(msg);
          toast.error(msg);
          setPromotions([]);
          setProductNames({});
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => controller.abort();
  }, []);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await adminApi.deactivatePromotion(deactivateTarget.id);
      toast.success(`${deactivateTarget.code} deactivated`);
      setDeactivateTarget(null);
      fetchPromotions();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeactivating(false);
    }
  };

  const formatExpiry = (ts: number) => {
    if (!ts) return null;
    const d = new Date(ts * 1000);
    const now = new Date();
    const isExpired = d < now;
    return (
      <span
        className={
          isExpired
            ? "text-error dark:text-error-light"
            : "text-gray-500 dark:text-dark-300"
        }
      >
        {isExpired ? "Expired " : "Expires "}
        {d.toLocaleDateString()}
      </span>
    );
  };

  return (
    <Page title="Promotions">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Promotions
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Manage Stripe promotion codes and coupons
            </p>
          </div>
          {canWrite && (
            <Button
              onClick={() => setShowCreate(true)}
              color="primary"
              variant="filled"
            >
              <PlusIcon className="h-4 w-4" />
              Create Code
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" color="primary" />
          </div>
        ) : loadError ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <TagIcon className="mb-4 h-10 w-10 text-error/60 dark:text-error-light/60" />
              <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-dark-50">
                Unable to load promotions
              </h3>
              <p className="mb-4 max-w-md text-sm text-gray-500 dark:text-dark-300">
                {loadError}
                {/\bStripe\b/i.test(loadError) && (
                  <span className="mt-2 block">
                    Configure the Stripe secret key in the admin configuration
                    page to enable promotion codes.
                  </span>
                )}
              </p>
              <Button
                variant="outlined"
                color="primary"
                onClick={fetchPromotions}
              >
                Retry
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="mt-3">
            {promotions.length === 0 ? (
              <EmptyState
                Icon={TagIcon}
                title="No promotion codes yet"
                description="Promotion codes will appear here once created."
              />
            ) : (
              <div className="min-w-full overflow-x-auto">
                <Table hoverable className="w-full">
                  <THead>
                    <Tr>
                      <Th>Code</Th>
                      <Th>Discount</Th>
                      <Th>Status</Th>
                      <Th>Applies To</Th>
                      <Th className="text-right">Redemptions</Th>
                      <Th>Expiry</Th>
                      {canWrite && <Th className="text-right">Actions</Th>}
                    </Tr>
                  </THead>
                  <TBody>
                    {promotions.map((promo) => (
                      <tr
                        key={promo.id}
                        className={`table-tr group/tr ${
                          canWrite ? "cursor-pointer" : ""
                        }`}
                        onClick={
                          canWrite
                            ? () => setEditTarget(promo)
                            : undefined
                        }
                      >
                        <Td className="font-mono">
                          {promo.code}
                        </Td>
                        <Td>
                          {promo.percentOff > 0
                            ? `${promo.percentOff}% off`
                            : `${(promo.amountOff / 100).toFixed(2)} ${(promo.currency || "usd").toUpperCase()} off`}
                        </Td>
                        <Td>
                          <Badge
                            color={promo.active ? "success" : "neutral"}
                            variant="soft"
                          >
                            {promo.active ? "Active" : "Inactive"}
                          </Badge>
                        </Td>
                        <Td>
                          {promo.appliesToProducts &&
                          promo.appliesToProducts.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {uniqueProductNames(
                                promo.appliesToProducts,
                                productNames,
                              ).map((name) => (
                                <span
                                  key={name}
                                  className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-dark-600 dark:text-dark-300"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-dark-400">
                              All products
                            </span>
                          )}
                        </Td>
                        <Td className="text-right font-mono">
                          {promo.timesRedeemed}
                          {promo.maxRedemptions > 0 &&
                            ` / ${promo.maxRedemptions}`}
                        </Td>
                        <Td>
                          {promo.expiresAt ? (
                            formatExpiry(promo.expiresAt)
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-dark-400">
                              Never
                            </span>
                          )}
                        </Td>
                        {canWrite && (
                          <Td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                isIcon
                                variant="flat"
                                color="neutral"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditTarget(promo);
                                }}
                                aria-label="Edit promotion"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </Button>
                              {promo.active && (
                                <Button
                                  isIcon
                                  variant="flat"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeactivateTarget(promo);
                                  }}
                                  aria-label="Deactivate promotion"
                                >
                                  <NoSymbolIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </Td>
                        )}
                      </tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </Card>
        )}

        {canWrite && showCreate && (
          <CreatePromotionModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              fetchPromotions();
            }}
          />
        )}

        {canWrite && editTarget && (
          <EditPromotionModal
            promo={editTarget}
            productNames={productNames}
            onClose={() => setEditTarget(null)}
            onUpdated={() => {
              setEditTarget(null);
              fetchPromotions();
            }}
          />
        )}

        {canWrite && (
          <ConfirmModal
            show={deactivateTarget !== null}
            onClose={() => setDeactivateTarget(null)}
            onOk={handleDeactivate}
            state="pending"
            confirmLoading={deactivating}
            messages={{
              pending: {
                title: "Deactivate Promotion",
                description: `Are you sure you want to deactivate the promotion code "${deactivateTarget?.code}"? It will no longer be usable at checkout.`,
                actionText: "Deactivate",
              },
            }}
          />
        )}
      </div>
    </Page>
  );
}

function EditPromotionModal({
  promo,
  productNames,
  onClose,
  onUpdated,
}: {
  promo: Promotion;
  productNames: Record<string, string>;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [couponName, setCouponName] = useState(promo.couponName || "");
  const [active, setActive] = useState(promo.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasChanges =
    couponName !== (promo.couponName || "") || active !== promo.active;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await adminApi.updatePromotion({
        id: promo.id,
        couponId: promo.couponId,
        couponName:
          couponName !== (promo.couponName || "") ? couponName : undefined,
        active: active !== promo.active ? active : undefined,
      });
      toast.success(`${promo.code} updated`);
      onUpdated();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const discount =
    promo.percentOff > 0
      ? `${promo.percentOff}% off`
      : `${(promo.amountOff / 100).toFixed(2)} ${(promo.currency || "usd").toUpperCase()} off`;

  const appliesTo =
    promo.appliesToProducts && promo.appliesToProducts.length > 0
      ? uniqueProductNames(promo.appliesToProducts, productNames)
      : null;

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
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
      >
        <div className="flex items-center justify-between pb-5">
          <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">Edit Promotion</h3>
          <Button
            isIcon
            variant="flat"
            color="neutral"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-dark-400">
                Code
              </label>
              <p className="font-mono text-sm">{promo.code}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-dark-400">
                Discount
              </label>
              <p className="text-sm">{discount}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-dark-400">
                Redemptions
              </label>
              <p className="font-mono text-sm">
                {promo.timesRedeemed}
                {promo.maxRedemptions > 0 && ` / ${promo.maxRedemptions}`}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-dark-400">
                Expiration
              </label>
              <p className="text-sm">
                {promo.expiresAt ? (
                  (() => {
                    const d = new Date(promo.expiresAt * 1000);
                    const isExpired = d < new Date();
                    return (
                      <span
                        className={
                          isExpired
                            ? "text-error dark:text-error-light"
                            : ""
                        }
                      >
                        {d.toLocaleDateString()}
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-gray-400 dark:text-dark-400">
                    Never
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Applies to */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-dark-400">
              Applies To
            </label>
            {appliesTo ? (
              <div className="flex flex-wrap gap-1">
                {appliesTo.map((name) => (
                  <span
                    key={name}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-dark-600 dark:text-dark-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-dark-300">
                All products
              </p>
            )}
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-dark-600">
            <p className="text-xs text-gray-400 dark:text-dark-400">
              Editable fields below. Code, discount, redemption limit,
              expiration, and product restrictions cannot be changed after
              creation.
            </p>

            {/* Editable: coupon name */}
            <Input
              label="Coupon Name"
              value={couponName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCouponName(e.target.value)
              }
            />

            {/* Editable: active status */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Status
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActive(true)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-success/50 bg-success/10 text-success"
                      : "border-gray-300 bg-white text-gray-500 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-300"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setActive(false)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    !active
                      ? "border-error/50 bg-error/10 text-error dark:text-error-light"
                      : "border-gray-300 bg-white text-gray-500 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-300"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-error dark:text-error-light">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outlined"
            color="neutral"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            color="primary"
            variant="filled"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </TransitionChild>
    </Transition>
  );
}

function CreatePromotionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    "percent",
  );
  const [percentOff, setPercentOff] = useState("10");
  const [amountOff, setAmountOff] = useState("5.00");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [restrictProducts, setRestrictProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [eligibleProducts, setEligibleProducts] = useState<
    EligibleProduct[]
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch eligible products when restriction toggle is enabled.
  useEffect(() => {
    if (restrictProducts && eligibleProducts.length === 0) {
      setLoadingProducts(true);
      adminApi
        .listEligibleProducts()
        .then((data) => setEligibleProducts(data.items))
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoadingProducts(false));
    }
  }, [restrictProducts, eligibleProducts.length]);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!code.trim()) {
      setError("Code is required");
      return;
    }
    if (restrictProducts && selectedProducts.size === 0) {
      setError(
        "Select at least one plan or bundle, or disable product restrictions",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const appliesTo = restrictProducts
        ? eligibleProducts
            .filter((p) => selectedProducts.has(p.id))
            .map((p) => ({ type: p.type, id: p.id }))
        : undefined;

      await adminApi.createPromotion({
        code: code.trim().toUpperCase(),
        name: name.trim() || undefined,
        percentOff:
          discountType === "percent"
            ? parseFloat(percentOff) || 0
            : undefined,
        amountOff:
          discountType === "amount"
            ? Math.round((parseFloat(amountOff) || 0) * 100)
            : undefined,
        maxRedemptions: maxRedemptions
          ? parseInt(maxRedemptions)
          : undefined,
        expiresAt: expiresAt || undefined,
        appliesTo,
      });
      toast.success(
        `Promotion code ${code.trim().toUpperCase()} created`,
      );
      onCreated();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const plans = eligibleProducts.filter((p) => p.type === "plan");
  const bundles = eligibleProducts.filter((p) => p.type === "bundle");

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
        className="scrollbar-sm relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
      >
        <div className="flex items-center justify-between pb-5">
          <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">Create Promotion Code</h3>
          <Button
            isIcon
            variant="flat"
            color="neutral"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <Input
            label="Code"
            placeholder="e.g. SAVE20"
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCode(e.target.value.toUpperCase())
            }
            className="font-mono"
          />

          <Input
            label="Name (optional)"
            placeholder="Display name for the coupon"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />

          <div>
            <label className="mb-2 block text-sm font-medium">
              Discount Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  discountType === "percent"
                    ? "border-primary-500/50 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "border-gray-300 bg-white text-gray-500 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-300"
                }`}
              >
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("amount")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  discountType === "amount"
                    ? "border-primary-500/50 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "border-gray-300 bg-white text-gray-500 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-300"
                }`}
              >
                Fixed Amount
              </button>
            </div>
          </div>

          {discountType === "percent" ? (
            <Input
              label="Percent Off"
              type="text"
              inputMode="decimal"
              value={percentOff}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPercentOff(e.target.value)
              }
            />
          ) : (
            <Input
              label="Amount Off ($)"
              type="text"
              inputMode="decimal"
              value={amountOff}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmountOff(e.target.value)
              }
            />
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Max Redemptions"
                type="text"
                inputMode="numeric"
                value={maxRedemptions}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMaxRedemptions(e.target.value)
                }
                placeholder="Unlimited"
              />
            </div>
            <div className="flex-1">
              <Input
                label={
                  <span className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    Expiration Date
                  </span>
                }
                type="date"
                value={expiresAt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExpiresAt(e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Product restrictions */}
          <div className="border-t border-gray-200 pt-4 dark:border-dark-600">
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={restrictProducts}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRestrictProducts(e.target.checked)
                }
              />
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">
                Restrict to specific plans or credit bundles
              </span>
            </label>

            {restrictProducts && (
              <div className="mt-3 space-y-3">
                {loadingProducts ? (
                  <p className="text-xs text-gray-400 dark:text-dark-400">
                    Loading products...
                  </p>
                ) : eligibleProducts.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-dark-400">
                    No paid plans or credit bundles configured
                  </p>
                ) : (
                  <>
                    {plans.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-dark-400">
                          Plans
                        </p>
                        <div className="space-y-1.5">
                          {plans.map((p) => (
                            <label
                              key={p.id}
                              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors hover:border-gray-300 dark:border-dark-600 dark:bg-dark-600/50 dark:hover:border-dark-500"
                            >
                              <Checkbox
                                checked={selectedProducts.has(p.id)}
                                onChange={() => toggleProduct(p.id)}
                              />
                              <span className="text-sm">{p.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {bundles.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-dark-400">
                          Credit Bundles
                        </p>
                        <div className="space-y-1.5">
                          {bundles.map((b) => (
                            <label
                              key={b.id}
                              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors hover:border-gray-300 dark:border-dark-600 dark:bg-dark-600/50 dark:hover:border-dark-500"
                            >
                              <Checkbox
                                checked={selectedProducts.has(b.id)}
                                onChange={() => toggleProduct(b.id)}
                              />
                              <span className="text-sm">{b.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-error dark:text-error-light">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outlined"
            color="neutral"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !code.trim()}
            color="primary"
            variant="filled"
          >
            {saving ? "Creating..." : "Create"}
          </Button>
        </div>
      </TransitionChild>
    </Transition>
  );
}
