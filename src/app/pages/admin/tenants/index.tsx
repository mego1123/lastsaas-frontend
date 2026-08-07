// Import Dependencies
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ShieldCheckIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form/Input";
import { Select } from "@/components/ui/Form/Select";
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

  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchTenants = useCallback(
    async (p: number, q: string, s: string, st: string, bs: string) => {
      setLoading(true);
      try {
        const data = await adminApi.listTenants({
          page: p,
          limit: PAGE_SIZE,
          search: q || undefined,
          sort: s,
          status: st || undefined,
          billingStatus: bs || undefined,
        });
        setTenants(data.tenants || []);
        setTotal(data.total);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

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

  // Fetch on page/sort/filter change
  useEffect(() => {
    fetchTenants(page, search, sort, status, billingStatus);
  }, [page, sort, status, billingStatus, fetchTenants]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchTenants(1, value, sort, status, billingStatus);
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
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id ? { ...t, isActive: !t.isActive } : t,
        ),
      );
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
      <div className="transition-content px-(--margin-x) pt-6 pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between py-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-50">
              Tenants
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {total.toLocaleString()} total tenants
            </p>
          </div>
          <Button
            variant="outlined"
            color="neutral"
            onClick={handleExport}
            title="Download CSV"
            className="h-9"
          >
            <ArrowDownTrayIcon className="size-4" />
            CSV
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by name or slug..."
            prefix={<MagnifyingGlassIcon className="size-4" />}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-10 w-full sm:max-w-md"
          />
          <Select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-10 sm:w-44"
            data={[
              { label: "All statuses", value: "" },
              { label: "Active", value: "active" },
              { label: "Disabled", value: "disabled" },
            ]}
          />
          <Select
            value={billingStatus}
            onChange={(e) => handleBillingStatusChange(e.target.value)}
            className="h-10 sm:w-44"
            data={[
              { label: "All billing", value: "" },
              { label: "Active", value: "active" },
              { label: "Past Due", value: "past_due" },
              { label: "Canceled", value: "canceled" },
              { label: "None", value: "none" },
            ]}
          />
        </div>

        {/* Table */}
        <Card className="mt-3">
          {loading && tenants.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8" color="primary" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-dark-300">
              {search ? "No tenants match your search." : "No tenants yet."}
            </div>
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
