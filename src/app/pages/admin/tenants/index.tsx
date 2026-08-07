// Import Dependencies
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheckIcon,
  BoltIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CreditCardIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { ResponsiveFilter } from "@/components/shared/table/ResponsiveFilter";
import { EmptyState } from "@/components/shared/EmptyState";
import { adminApi } from "@/utils/api";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { getErrorMessage } from "@/utils/errors";
import type { TenantListItem } from "@/@types/lastsaas";

// ----------------------------------------------------------------------

const PAGE_SIZE = 25;

function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-3 dark:border-dark-600">
      <p className="text-sm text-gray-500 dark:text-dark-300">
        Showing {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outlined"
          color="neutral"
          isIcon
          className="size-8"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p: number;
          if (totalPages <= 7) {
            p = i + 1;
          } else if (page <= 4) {
            p = i + 1;
          } else if (page >= totalPages - 3) {
            p = totalPages - 6 + i;
          } else {
            p = page - 3 + i;
          }
          return (
            <Button
              key={p}
              variant={p === page ? "filled" : "outlined"}
              color={p === page ? "primary" : "neutral"}
              className="h-8 min-w-8 px-2 text-sm"
              onClick={() => onChange(p)}
            >
              {p}
            </Button>
          );
        })}
        <Button
          variant="outlined"
          color="neutral"
          isIcon
          className="size-8"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------

export default function TenantsPage() {
  const navigate = useNavigate();
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role ?? null;
  const canWrite = role === "owner" || role === "admin";
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [sort, setSort] = useState(searchParams.get("sort") || "-createdAt");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [billingStatus, setBillingStatus] = useState(
    searchParams.get("billingStatus") || "",
  );
  const [statusTarget, setStatusTarget] = useState<TenantListItem | null>(
    null,
  );
  const [statusLoading, setStatusLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // React Query — cached data, no refetch within staleTime (60s)
  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin", "tenants", page, search, sort, status, billingStatus],
    queryFn: () =>
      adminApi.listTenants({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        sort,
        status: status || undefined,
        billingStatus: billingStatus || undefined,
      }),
  });
  const tenants = data?.tenants ?? [];
  const total = data?.total ?? 0;

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 1) params.page = String(page);
    if (search) params.search = search;
    if (sort && sort !== "-createdAt") params.sort = sort;
    if (status) params.status = status;
    if (billingStatus) params.billingStatus = billingStatus;
    setSearchParams(params, { replace: true });
  }, [page, search, sort, status, billingStatus, setSearchParams]);

  // Debounced search — updates the 'search' state which changes the query key
  const handleSearchChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  const toggleSort = (field: string) => {
    setSort((prev) =>
      prev === field ? `-${field}` : prev === `-${field}` ? field : field,
    );
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleBillingStatusChange = (value: string) => {
    setBillingStatus(value);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportTenantsCSV({
        search: search || undefined,
        status: status || undefined,
        billingStatus: billingStatus || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tenants.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const toggleStatus = async (tenant: TenantListItem) => {
    if (tenant.isRoot) return;
    setStatusLoading(true);
    try {
      await adminApi.updateTenantStatus(tenant.id, !tenant.isActive);
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success(
        `${tenant.name} ${tenant.isActive ? "disabled" : "enabled"}`,
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStatusLoading(false);
      setStatusTarget(null);
      setConfirmOpen(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Page title="Tenants">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header — unified title + controls in one row */}
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Tenants
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {total.toLocaleString()} total tenants
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <ResponsiveFilter
              buttonContent={
                <>
                  <FunnelIcon className="size-4" />
                  <span>Status</span>
                  {status && (
                    <>
                      <div className="h-full w-px bg-gray-300 dark:bg-dark-450" />
                      <Badge className="gap-1">
                        {status === "active" ? "Active" : "Disabled"}
                      </Badge>
                    </>
                  )}
                </>
              }
            >
              <FilterList
                value={status}
                onChange={handleStatusChange}
                options={[
                  { value: "active", label: "Active" },
                  { value: "disabled", label: "Disabled" },
                ]}
              />
            </ResponsiveFilter>

            {/* Billing filter */}
            <ResponsiveFilter
              buttonContent={
                <>
                  <CreditCardIcon className="size-4" />
                  <span>Billing</span>
                  {billingStatus && (
                    <>
                      <div className="h-full w-px bg-gray-300 dark:bg-dark-450" />
                      <Badge className="gap-1">
                        {billingStatus === "past_due"
                          ? "Past Due"
                          : billingStatus === "canceled"
                            ? "Canceled"
                            : billingStatus === "active"
                              ? "Active"
                              : "None"}
                      </Badge>
                    </>
                  )}
                </>
              }
            >
              <FilterList
                value={billingStatus}
                onChange={handleBillingStatusChange}
                options={[
                  { value: "active", label: "Active" },
                  { value: "past_due", label: "Past Due" },
                  { value: "canceled", label: "Canceled" },
                  { value: "none", label: "None" },
                ]}
              />
            </ResponsiveFilter>

            <CollapsibleSearch
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <Button
              variant="outlined"
              color="neutral"
              onClick={handleExport}
              title="Download CSV"
              className="h-8 gap-2 rounded-md px-3 text-xs"
            >
              <ArrowDownTrayIcon className="size-4" />
              <span>CSV</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          {loading && tenants.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8" color="primary" />
            </div>
          ) : tenants.length === 0 ? (
            <EmptyState
              Icon={ShieldCheckIcon}
              title={search ? "No tenants match your search" : "No tenants yet"}
              description={
                search
                  ? "Try a different search term or clear filters."
                  : "Tenants will appear here once they are created."
              }
            />
          ) : (
            <>
              <div className="min-w-full overflow-x-auto">
                <Table hoverable className="w-full min-w-[860px]">
                  <THead>
                    <Tr>
                      <Th>
                        <button
                          onClick={() => toggleSort("name")}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-dark-300"
                        >
                          Tenant
                          <ArrowsUpDownIcon className="size-3" />
                        </button>
                      </Th>
                      <Th>
                        Plan
                      </Th>
                      <Th>
                        Credits
                      </Th>
                      <Th>
                        Members
                      </Th>
                      <Th>
                        <button
                          onClick={() => toggleSort("createdAt")}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-dark-300"
                        >
                          Created
                          <ArrowsUpDownIcon className="size-3" />
                        </button>
                      </Th>
                      <Th>
                        Status
                      </Th>
                      {canWrite && (
                        <Th className="text-right">
                          Actions
                        </Th>
                      )}
                    </Tr>
                  </THead>
                  <TBody>
                    {tenants.map((tenant) => (
                      <Tr
                        key={tenant.id}
                        onClick={() => navigate(`/last/tenants/${tenant.id}`)}
                        className="cursor-pointer"
                      >
                        <Td>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                              {tenant.name}
                            </p>
                            {tenant.isRoot && (
                              <Badge
                                color="secondary"
                                variant="soft"
                                className="flex items-center gap-1"
                              >
                                <ShieldCheckIcon className="size-3" />
                                Root
                              </Badge>
                            )}
                          </div>
                          <p className="font-mono text-xs text-gray-400 dark:text-dark-400">
                            {tenant.slug}
                          </p>
                        </Td>
                        <Td>
                          {tenant.planName}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-dark-200">
                            <BoltIcon className="size-3.5 text-primary-500 dark:text-primary-400" />
                            {(
                              tenant.subscriptionCredits +
                              tenant.purchasedCredits
                            ).toLocaleString()}
                          </div>
                        </Td>
                        <Td>
                          {tenant.memberCount}
                        </Td>
                        <Td>
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </Td>
                        <Td>
                          {tenant.isActive ? (
                            <Badge color="success" variant="soft">
                              Active
                            </Badge>
                          ) : (
                            <Badge color="error" variant="soft">
                              Disabled
                            </Badge>
                          )}
                        </Td>
                        {canWrite && (
                          <Td className="text-right">
                            {!tenant.isRoot && (
                              <Button
                                variant="outlined"
                                color={
                                  tenant.isActive ? "error" : "success"
                                }
                                className="h-8 px-3 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStatusTarget(tenant);
                                  setConfirmOpen(true);
                                }}
                              >
                                {tenant.isActive ? "Disable" : "Enable"}
                              </Button>
                            )}
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onChange={setPage}
              />
            </>
          )}
        </Card>

        <ConfirmModal
          show={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setStatusTarget(null);
          }}
          onOk={() => statusTarget && void toggleStatus(statusTarget)}
          state="pending"
          confirmLoading={statusLoading}
          messages={{
            pending: {
              title: statusTarget?.isActive
                ? "Disable Tenant"
                : "Enable Tenant",
              description: `Are you sure you want to ${
                statusTarget?.isActive ? "disable" : "enable"
              } ${statusTarget?.name}?${
                statusTarget?.isActive
                  ? " All members will lose access."
                  : ""
              }`,
              actionText: statusTarget?.isActive ? "Disable" : "Enable",
            },
          }}
        />
      </div>
    </Page>
  );
}

// ----------------------------------------------------------------------
// FilterList — single-select dropdown list used inside ResponsiveFilter.
// Mirrors the FacedtedFilter option list markup from
// tables/courses-datatable, but without the TanStack Table coupling.
// ----------------------------------------------------------------------
function FilterList({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex max-h-80 w-56 flex-col">
      <div className="max-h-80 overflow-y-auto py-1 outline-hidden">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(isSelected ? "" : opt.value)}
              className={[
                "relative flex w-full cursor-pointer select-none items-center gap-2 px-2.5 py-2 text-left text-xs-plus outline-hidden transition-colors",
                isSelected
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
                  : "text-gray-800 hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-600",
              ].join(" ")}
            >
              <span
                className={[
                  "flex size-4 shrink-0 items-center justify-center rounded border",
                  isSelected
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-gray-300 dark:border-dark-450",
                ].join(" ")}
              >
                {isSelected && <XMarkIcon className="size-3" />}
              </span>
              <span className="block truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {value && (
        <Button
          onClick={() => onChange("")}
          className="w-full shrink-0 rounded-none"
          variant="flat"
          color="error"
        >
          Clear Filter
        </Button>
      )}
    </div>
  );
}
