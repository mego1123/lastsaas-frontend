// Import Dependencies
import { useEffect, useState } from "react";
import { CreditCard, Receipt, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// Local Imports
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TBody,
  THead,
  Tr,
  Th,
  Td,
} from "@/components/ui/Table";
import { billingApi, plansApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type {
  FinancialTransaction,
  BillingStatus,
} from "@/@types/lastsaas";
import InvoiceModal from "./InvoiceModal";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/settings/BillingTab.tsx` (201 LOC).
// ----------------------------------------------------------------------

export default function BillingTab() {
  const [billingStatus, setBillingStatus] =
    useState<BillingStatus>("none");
  const [billingInterval, setBillingInterval] = useState("");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState("");
  const [currentPlanName, setCurrentPlanName] = useState("");
  const [tenantName] = useState("");
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(
    [],
  );
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [billingLoading, setBillingLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(
    null,
  );

  const loadBillingData = () => {
    setBillingLoading(true);
    Promise.all([
      plansApi.list(),
      billingApi.listTransactions({ page: txPage, perPage: 10 }),
    ])
      .then(([planData, txData]) => {
        setBillingStatus(planData.billingStatus || "none");
        setBillingInterval(planData.billingInterval || "");
        setCurrentPeriodEnd(planData.currentPeriodEnd || "");
        const plan = planData.plans.find(
          (p) => p.id === planData.currentPlanId,
        );
        setCurrentPlanName(plan?.name || "Free");
        setTransactions(txData.transactions);
        setTxTotal(txData.total);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setBillingLoading(false));
  };

  useEffect(() => {
    loadBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txPage]);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const result = await billingApi.portal();
      window.location.href = result.portalUrl;
    } catch {
      // Error handled by interceptor
    } finally {
      setPortalLoading(false);
    }
  };

  const totalPages = Math.ceil(txTotal / 10);

  if (billingLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Summary */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
          <CreditCard className="h-5 w-5 text-gray-400 dark:text-dark-400" />
          Subscription
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Plan
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-dark-50">
              {currentPlanName}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Status
            </span>
            <span
              className={`text-sm font-medium ${
                billingStatus === "active"
                  ? "text-success"
                  : billingStatus === "past_due"
                    ? "text-error"
                    : billingStatus === "canceled"
                      ? "text-warning"
                      : "text-gray-500 dark:text-dark-300"
              }`}
            >
              {billingStatus === "active"
                ? "Active"
                : billingStatus === "past_due"
                  ? "Past Due"
                  : billingStatus === "canceled"
                    ? "Canceled"
                    : "None"}
            </span>
          </div>
          {billingInterval && (
            <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
              <span className="text-sm text-gray-500 dark:text-dark-300">
                Billing Interval
              </span>
              <span className="text-sm capitalize text-gray-900 dark:text-dark-50">
                {billingInterval}ly
              </span>
            </div>
          )}
          {currentPeriodEnd && (
            <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
              <span className="text-sm text-gray-500 dark:text-dark-300">
                {billingStatus === "canceled"
                  ? "Benefits Until"
                  : "Next Billing"}
              </span>
              <span className="text-sm text-gray-900 dark:text-dark-50">
                {new Date(currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {billingStatus !== "none" && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-dark-600">
            <Button
              variant="outlined"
              color="neutral"
              onClick={handlePortal}
              disabled={portalLoading}
              className="h-9 min-w-[12rem]"
            >
              {portalLoading ? (
                <Spinner className="h-4 w-4" color="primary" />
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" /> Update Payment Method
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Transaction History */}
      <Card className="mt-3">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-dark-600">
          <h2 className="flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
            <Receipt className="h-5 w-5 text-gray-400 dark:text-dark-400" />
            Transaction History
          </h2>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            Icon={Receipt}
            title="No transactions yet"
            description="Billing transactions will appear here once they occur."
          />
        ) : (
          <>
            <div className="min-w-full overflow-x-auto">
              <Table hoverable className="w-full min-w-[640px]">
                <THead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Description</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Invoice</Th>
                    <Th></Th>
                  </Tr>
                </THead>
                <TBody>
                  {transactions.map((tx) => (
                    <Tr key={tx.id}>
                      <Td>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </Td>
                      <Td>
                        {tx.description}
                      </Td>
                      <Td className="text-right font-mono">
                        ${(tx.amountCents / 100).toFixed(2)}
                        {tx.taxAmountCents > 0 && (
                          <span className="mt-0.5 block text-xs text-gray-400 dark:text-dark-400">
                            incl. ${(tx.taxAmountCents / 100).toFixed(2)} tax
                          </span>
                        )}
                      </Td>
                      <Td className="font-mono">
                        {tx.invoiceNumber}
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => setSelectedTx(tx)}
                          className="text-xs text-primary-500 transition-colors hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          View
                        </button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-dark-600">
                <span className="text-xs text-gray-500 dark:text-dark-300">
                  {txTotal} total
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 disabled:opacity-40 dark:bg-dark-600 dark:text-dark-200"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 text-xs text-gray-500 dark:text-dark-300">
                    {txPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setTxPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={txPage === totalPages}
                    className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 disabled:opacity-40 dark:bg-dark-600 dark:text-dark-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {selectedTx && (
        <InvoiceModal
          tx={selectedTx}
          tenantName={tenantName || "Your Organization"}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
