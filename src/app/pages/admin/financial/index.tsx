// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  TBody,
  THead,
  Tr,
  Th,
  Td,
} from "@/components/ui/Table";
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { EmptyState } from "@/components/shared/EmptyState";
import { adminApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type { FinancialTransaction } from "@/@types/lastsaas";

// ----------------------------------------------------------------------

const PER_PAGE = 50;

function currencyFormatter(currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "usd",
  });
}

function transactionTypeColor(
  type: string,
): "primary" | "success" | "warning" | "neutral" {
  if (type === "subscription") return "primary";
  if (type === "credit_purchase") return "success";
  if (type === "refund") return "warning";
  return "neutral";
}

function transactionTypeLabel(type: string): string {
  if (type === "subscription") return "Subscription";
  if (type === "credit_purchase") return "Credit Purchase";
  if (type === "refund") return "Refund";
  return type;
}

// ----------------------------------------------------------------------

export default function AdminFinancialPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(() => {
    setLoading(true);
    adminApi
      .listFinancialTransactions({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch || undefined,
      })
      .then((data) => {
        setTransactions(data.transactions);
        setTotal(data.total);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <Page title="Financial">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header — unified title + controls in one row */}
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Financial
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              All financial transactions across the platform
            </p>
          </div>
          <div className="flex">
            <CollapsibleSearch
              placeholder="Search by description, invoice #, plan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8" color="primary" />
            </div>
          </Card>
        ) : (
          <Card>
            {transactions.length === 0 ? (
              <EmptyState
                Icon={CreditCardIcon}
                title="No transactions found"
                description="Transactions will appear here once payments are processed."
              />
            ) : (
              <>
                <div className="min-w-full overflow-x-auto">
                  <Table hoverable className="w-full min-w-[860px]">
                    <THead>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Type</Th>
                        <Th>Description</Th>
                        <Th className="text-right">Amount</Th>
                        <Th>Invoice #</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {transactions.map((tx) => (
                        <Tr key={tx.id}>
                          <Td>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </Td>
                          <Td>
                            <Badge
                              color={transactionTypeColor(tx.type)}
                              variant="soft"
                            >
                              {transactionTypeLabel(tx.type)}
                            </Badge>
                          </Td>
                          <Td>
                            {tx.description}
                          </Td>
                          <Td className="text-right font-mono">
                            {currencyFormatter(tx.currency).format(
                              tx.amountCents / 100,
                            )}
                            {tx.taxAmountCents > 0 && (
                              <span className="mt-0.5 block text-xs text-gray-400 dark:text-dark-400">
                                incl.{" "}
                                {currencyFormatter(tx.currency).format(
                                  tx.taxAmountCents / 100,
                                )}{" "}
                                tax
                              </span>
                            )}
                          </Td>
                          <Td className="font-mono">
                            {tx.invoiceNumber}
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-dark-600">
                    <span className="text-xs text-gray-500 dark:text-dark-300">
                      {total} total
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outlined"
                        color="neutral"
                        className="h-7 px-3 text-xs"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Prev
                      </Button>
                      <span className="px-3 py-1 text-xs text-gray-500 dark:text-dark-300">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outlined"
                        color="neutral"
                        className="h-7 px-3 text-xs"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        )}
      </div>
    </Page>
  );
}
