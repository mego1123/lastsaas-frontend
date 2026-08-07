// Import Dependencies
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsUpDownIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
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
import { ACCESS_TOKEN_KEY, IMPERSONATION_KEY, REFRESH_TOKEN_KEY } from "@/configs/auth";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { getErrorMessage } from "@/utils/errors";
import type { UserListItem } from "@/@types/lastsaas";

// ----------------------------------------------------------------------

const PAGE_SIZE = 25;

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

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

export default function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuthContext();
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role ?? null;
  const canWrite = role === "owner" || role === "admin";
  const isOwner = role === "owner";
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [sort, setSort] = useState(searchParams.get("sort") || "-createdAt");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [statusTarget, setStatusTarget] = useState<UserListItem | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // React Query — cached data, no refetch within staleTime (60s)
  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin", "users", page, search, sort, status],
    queryFn: () =>
      adminApi.listUsers({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        sort,
        status: status || undefined,
      }),
  });
  const users = data?.users ?? [];
  const totalUsers = data?.total ?? 0;

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 1) params.page = String(page);
    if (search) params.search = search;
    if (sort && sort !== "-createdAt") params.sort = sort;
    if (status) params.status = status;
    setSearchParams(params, { replace: true });
  }, [page, search, sort, status, setSearchParams]);

  // Debounced search — updates the `search` state which changes the query key
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

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportUsersCSV({
        search: search || undefined,
        status: status || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const toggleStatus = async (user: UserListItem) => {
    setStatusLoading(true);
    try {
      await adminApi.updateUserStatus(user.id, !user.isActive);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(
        `${user.displayName} ${user.isActive ? "disabled" : "enabled"}`,
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStatusLoading(false);
      setStatusTarget(null);
      setConfirmOpen(false);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      const data = await adminApi.impersonateUser(userId);
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.setItem(IMPERSONATION_KEY, "true");
      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  return (
    <Page title="Users">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header — unified title + controls in one row */}
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Users
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {totalUsers.toLocaleString()} total users
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              <div className="flex max-h-80 w-56 flex-col">
                <div className="max-h-80 overflow-y-auto py-1 outline-hidden">
                  {[
                    { value: "active", label: "Active" },
                    { value: "disabled", label: "Disabled" },
                  ].map((opt) => {
                    const isSelected = opt.value === status;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          handleStatusChange(isSelected ? "" : opt.value)
                        }
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
                {status && (
                  <Button
                    onClick={() => handleStatusChange("")}
                    className="w-full shrink-0 rounded-none"
                    variant="flat"
                    color="error"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </ResponsiveFilter>
            <CollapsibleSearch
              placeholder="Search by name or email..."
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
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8" color="primary" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              Icon={UserCircleIcon}
              title={search ? "No users match your search" : "No users yet"}
              description={
                search
                  ? "Try a different search term or clear filters."
                  : "Users will appear here once they sign up."
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
                          onClick={() => toggleSort("displayName")}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-dark-300"
                        >
                          User
                          <ArrowsUpDownIcon className="size-3" />
                        </button>
                      </Th>
                      <Th>
                        Verified
                      </Th>
                      <Th>
                        Tenants
                      </Th>
                      <Th>
                        <button
                          onClick={() => toggleSort("createdAt")}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-dark-300"
                        >
                          Joined
                          <ArrowsUpDownIcon className="size-3" />
                        </button>
                      </Th>
                      <Th>
                        Last Login
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
                    {users.map((user) => (
                      <Tr
                        key={user.id}
                        onClick={() => navigate(`/last/users/${user.id}`)}
                        className="cursor-pointer"
                      >
                        <Td>
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-dark-400">
                            {user.email}
                          </p>
                        </Td>
                        <Td>
                          {user.emailVerified ? (
                            <CheckCircleIcon className="size-4 text-success dark:text-success-light" />
                          ) : (
                            <XCircleIcon className="size-4 text-gray-400 dark:text-dark-400" />
                          )}
                        </Td>
                        <Td>
                          {user.tenantCount}
                        </Td>
                        <Td>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Td>
                        <Td
                          className="text-sm text-gray-500 dark:text-dark-300"
                          title={
                            user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleString()
                              : undefined
                          }
                        >
                          {relativeTime(user.lastLoginAt)}
                        </Td>
                        <Td>
                          {user.isActive ? (
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
                            <div className="flex items-center justify-end gap-1">
                              {isOwner &&
                                currentUser &&
                                user.id !== currentUser.id && (
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    className="h-8 px-3 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleImpersonate(user.id);
                                    }}
                                    title="Impersonate user"
                                  >
                                    <UserCircleIcon className="size-4" />
                                  </Button>
                                )}
                              <Button
                                variant="outlined"
                                color={
                                  user.isActive ? "error" : "success"
                                }
                                className="h-8 px-3 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStatusTarget(user);
                                  setConfirmOpen(true);
                                }}
                              >
                                {user.isActive ? "Disable" : "Enable"}
                              </Button>
                            </div>
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
                total={totalUsers}
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
              title: statusTarget?.isActive ? "Disable User" : "Enable User",
              description: `Are you sure you want to ${
                statusTarget?.isActive ? "disable" : "enable"
              } ${statusTarget?.displayName}?`,
              actionText: statusTarget?.isActive ? "Disable" : "Enable",
            },
          }}
        />
      </div>
    </Page>
  );
}
