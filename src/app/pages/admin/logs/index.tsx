// Import Dependencies
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { ResponsiveFilter } from "@/components/shared/table/ResponsiveFilter";
import { EmptyState } from "@/components/shared/EmptyState";
import { adminApi } from "@/utils/api";
import type { SystemLog, LogSeverity, LogCategory } from "@/@types/lastsaas";

// ----------------------------------------------------------------------

const severityConfig: Record<
  LogSeverity,
  {
    label: string;
    color: "error" | "warning" | "primary" | "secondary" | "neutral";
    bg: string;
    text: string;
  }
> = {
  critical: {
    label: "Critical",
    color: "error",
    bg: "bg-error/10",
    text: "text-error",
  },
  high: {
    label: "High",
    color: "warning",
    bg: "bg-warning/10",
    text: "text-warning",
  },
  medium: {
    label: "Medium",
    color: "warning",
    bg: "bg-warning/10",
    text: "text-warning",
  },
  low: {
    label: "Low",
    color: "primary",
    bg: "bg-primary-500/10",
    text: "text-primary-500 dark:text-primary-400",
  },
  debug: {
    label: "Debug",
    color: "neutral",
    bg: "bg-gray-200/50 dark:bg-dark-700/50",
    text: "text-gray-500 dark:text-dark-300",
  },
};

const categoryLabels: Record<LogCategory, string> = {
  auth: "Auth",
  billing: "Billing",
  admin: "Admin",
  system: "System",
  security: "Security",
  tenant: "Tenant",
};

const DATE_PRESETS = [
  { label: "Last hour", hours: 1 },
  { label: "Last 24h", hours: 24 },
  { label: "Last 7d", hours: 168 },
  { label: "Last 30d", hours: 720 },
];

const ALL_SEVERITIES: LogSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "debug",
];

const PER_PAGE_OPTIONS = [25, 50, 100];

// ----------------------------------------------------------------------

export default function LogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [activeSeverities, setActiveSeverities] = useState<Set<LogSeverity>>(
    () => new Set(ALL_SEVERITIES),
  );
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [severityCounts, setSeverityCounts] = useState<
    Record<string, number>
  >({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchLogs = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, perPage };
      if (activeSeverities.size > 0 && activeSeverities.size < 5) {
        params.severity = Array.from(activeSeverities).join(",");
      }
      if (category) params.category = category;
      if (search) params.search = search;
      if (userId) params.userId = userId;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const data = await adminApi.listLogs(params);
      if (!controller.signal.aborted) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch {
      // ignore
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, perPage, activeSeverities, category, search, userId, fromDate, toDate]);

  const fetchSeverityCounts = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (category) params.category = category;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const data = await adminApi.logSeverityCounts(params);
      setSeverityCounts(data.counts);
    } catch {
      // ignore
    }
  }, [category, fromDate, toDate]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);
  useEffect(() => {
    void fetchSeverityCounts();
  }, [fetchSeverityCounts]);

  // Auto-refresh (pauses when tab is in background)
  useEffect(() => {
    if (!autoRefresh) return;

    const tick = () => {
      if (document.visibilityState === "visible") {
        void fetchLogs();
        void fetchSeverityCounts();
      }
    };
    autoRefreshRef.current = setInterval(tick, 10000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefresh, fetchLogs, fetchSeverityCounts]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const toggleSeverity = (sev: LogSeverity) => {
    setPage(1);
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) {
        next.delete(sev);
        // Deselecting the last one re-selects all
        if (next.size === 0) return new Set(ALL_SEVERITIES);
      } else {
        next.add(sev);
      }
      return next;
    });
  };

  const handleCategoryChange = (cat: string) => {
    setPage(1);
    setCategory(cat);
  };

  const clearUserFilter = () => {
    setUserId("");
    setPage(1);
    setSearchParams({});
  };

  const applyDatePreset = (hours: number) => {
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    setFromDate(from.toISOString());
    setToDate("");
    setPage(1);
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (activeSeverities.size > 0 && activeSeverities.size < 5) {
        params.severity = Array.from(activeSeverities).join(",");
      }
      if (category) params.category = category;
      if (search) params.search = search;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const blob = await adminApi.exportLogsCSV(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "system_logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const handleRefresh = () => {
    void fetchLogs();
    void fetchSeverityCounts();
  };

  return (
    <Page title="System Logs">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header — unified title + controls in one row */}
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              System Logs
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {total.toLocaleString()} entries
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Category filter */}
            <ResponsiveFilter
              buttonContent={
                <>
                  <FunnelIcon className="size-4" />
                  <span>Category</span>
                  {category && (
                    <>
                      <div className="h-full w-px bg-gray-300 dark:bg-dark-450" />
                      <Badge className="gap-1">
                        {categoryLabels[category as LogCategory] || category}
                      </Badge>
                    </>
                  )}
                </>
              }
            >
              <FilterList
                value={category}
                onChange={handleCategoryChange}
                options={Object.entries(categoryLabels).map(([val, label]) => ({
                  value: val,
                  label,
                }))}
              />
            </ResponsiveFilter>

            {/* Severity filter (multi-select) */}
            <ResponsiveFilter
              buttonContent={
                <>
                  <ExclamationTriangleIcon className="size-4" />
                  <span>Level</span>
                  {activeSeverities.size < 5 && activeSeverities.size > 0 && (
                    <>
                      <div className="h-full w-px bg-gray-300 dark:bg-dark-450" />
                      <Badge className="gap-1">
                        {activeSeverities.size} selected
                      </Badge>
                    </>
                  )}
                </>
              }
            >
              <div className="flex max-h-80 w-56 flex-col">
                <div className="max-h-80 overflow-y-auto py-1 outline-hidden">
                  {ALL_SEVERITIES.map((sev) => {
                    const cfg = severityConfig[sev];
                    const count = severityCounts[sev] || 0;
                    const isSelected = activeSeverities.has(sev);
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => toggleSeverity(sev)}
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
                        <span className={`size-2 rounded-full ${cfg.bg.replace("/10", "/60")}`} />
                        <span className="block flex-1 truncate">{cfg.label}</span>
                        {count > 0 && (
                          <span className="font-mono text-[10px] text-gray-400 dark:text-dark-400">
                            {count.toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {activeSeverities.size < 5 && (
                  <Button
                    onClick={() => setActiveSeverities(new Set(ALL_SEVERITIES))}
                    className="w-full shrink-0 rounded-none"
                    variant="flat"
                    color="error"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </ResponsiveFilter>

            {/* Date filter */}
            <ResponsiveFilter
              buttonContent={
                <>
                  <CalendarDaysIcon className="size-4" />
                  <span>Date</span>
                  {fromDate && (
                    <>
                      <div className="h-full w-px bg-gray-300 dark:bg-dark-450" />
                      <Badge className="gap-1">
                        {DATE_PRESETS.find(
                          (p) =>
                            !toDate &&
                            Math.abs(
                              new Date().getTime() -
                                new Date(fromDate).getTime() -
                                p.hours * 3600000,
                            ) < 60000,
                        )?.label || "Custom"}
                      </Badge>
                    </>
                  )}
                </>
              }
            >
              <div className="flex w-56 flex-col">
                <div className="py-1 outline-hidden">
                  <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-medium tracking-wider text-gray-400 uppercase dark:text-dark-400">
                    Quick ranges
                  </p>
                  {DATE_PRESETS.map((p) => {
                    const isSelected =
                      fromDate &&
                      !toDate &&
                      Math.abs(
                        new Date().getTime() -
                          new Date(fromDate).getTime() -
                          p.hours * 3600000,
                      ) < 60000;
                    return (
                      <button
                        key={p.hours}
                        type="button"
                        onClick={() => applyDatePreset(p.hours)}
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
                        <span className="block truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
                {fromDate && (
                  <Button
                    onClick={clearDateFilter}
                    className="w-full shrink-0 rounded-none"
                    variant="flat"
                    color="error"
                  >
                    Clear Date Filter
                  </Button>
                )}
              </div>
            </ResponsiveFilter>

            <CollapsibleSearch
              placeholder="Search logs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Button
              variant={autoRefresh ? "filled" : "outlined"}
              color={autoRefresh ? "primary" : "neutral"}
              className="h-8 gap-2 rounded-md px-3 text-xs"
              onClick={() => setAutoRefresh((a) => !a)}
            >
              <ArrowPathIcon
                className={`size-4 ${autoRefresh ? "animate-spin" : ""}`}
              />
              <span>Auto</span>
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              className="h-8 gap-2 rounded-md px-3 text-xs"
              onClick={handleRefresh}
            >
              <ArrowPathIcon className="size-4" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              className="h-8 gap-2 rounded-md px-3 text-xs"
              onClick={handleExport}
            >
              <ArrowDownTrayIcon className="size-4" />
              <span>CSV</span>
            </Button>
          </div>
        </div>

        {/* Active user filter chip */}
        {userId && (
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary-500/20 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-500 dark:text-primary-400">
              Filtered by user:{" "}
              <span className="font-mono">{userId.slice(-8)}</span>
              <button
                onClick={clearUserFilter}
                className="ml-1 hover:text-gray-900 dark:hover:text-dark-50"
                aria-label="Clear user filter"
              >
                <XMarkIcon className="size-3.5" />
              </button>
            </span>
          </div>
        )}

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8" color="primary" />
            </div>
          </Card>
        ) : logs.length === 0 ? (
          <Card>
            <EmptyState
              Icon={DocumentTextIcon}
              title="No log entries found"
              description="Log entries will appear here as system events occur."
            />
          </Card>
        ) : (
          <>
            <Card>
              <div className="min-w-full overflow-x-auto">
                <Table hoverable className="w-full min-w-[860px]">
                  <THead>
                    <Tr>
                      <Th className="w-10" />
                      <Th className="w-44">Timestamp</Th>
                      <Th className="w-24">Severity</Th>
                      <Th className="w-24">Category</Th>
                      <Th className="w-20">User</Th>
                      <Th>Message</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {logs.map((log) => {
                      const sev =
                        severityConfig[log.severity] ||
                        severityConfig.debug;
                      const isExpanded = expandedRow === log.id;
                      return (
                        <>
                          <Tr
                            key={log.id}
                            className="cursor-pointer"
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : log.id)
                            }
                          >
                            <Td>
                              {isExpanded ? (
                                <ChevronUpIcon className="size-3.5" />
                              ) : (
                                <ChevronDownIcon className="size-3.5" />
                              )}
                            </Td>
                            <Td className="font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </Td>
                            <Td>
                              <span
                                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${sev.bg} ${sev.text}`}
                              >
                                {sev.label}
                              </span>
                            </Td>
                            <Td>
                              {log.category ? (
                                <span className="inline-block rounded bg-gray-200/50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-dark-700/50 dark:text-dark-200">
                                  {categoryLabels[log.category] ||
                                    log.category}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-dark-400">
                                  —
                                </span>
                              )}
                            </Td>
                            <Td>
                              {log.userId ? (
                                <Link
                                  to={`/last/users/${log.userId}`}
                                  className="font-mono text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {log.userId.slice(-8)}
                                </Link>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-dark-400">
                                  System
                                </span>
                              )}
                            </Td>
                            <Td>
                              {log.message}
                            </Td>
                          </Tr>
                          {isExpanded && (
                            <Tr
                              key={`${log.id}-detail`}
                              className="bg-gray-100 dark:bg-dark-600/30"
                            >
                              <Td colSpan={6} className="px-8 py-4">
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-dark-300">
                                      Full message:{" "}
                                    </span>
                                    <span className="break-all text-gray-700 dark:text-dark-200">
                                      {log.message}
                                    </span>
                                  </div>
                                  {log.action && (
                                    <div>
                                      <span className="text-gray-500 dark:text-dark-300">
                                        Action:{" "}
                                      </span>
                                      <span className="font-mono text-gray-700 dark:text-dark-200">
                                        {log.action}
                                      </span>
                                    </div>
                                  )}
                                  {log.tenantId && (
                                    <div>
                                      <span className="text-gray-500 dark:text-dark-300">
                                        Tenant:{" "}
                                      </span>
                                      <Link
                                        to={`/last/tenants/${log.tenantId}`}
                                        className="font-mono text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400"
                                      >
                                        {log.tenantId}
                                      </Link>
                                    </div>
                                  )}
                                  {log.userId && (
                                    <div>
                                      <span className="text-gray-500 dark:text-dark-300">
                                        User:{" "}
                                      </span>
                                      <Link
                                        to={`/last/users/${log.userId}`}
                                        className="font-mono text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400"
                                      >
                                        {log.userId}
                                      </Link>
                                    </div>
                                  )}
                                  {log.metadata &&
                                    Object.keys(log.metadata).length > 0 && (
                                      <div>
                                        <span className="text-gray-500 dark:text-dark-300">
                                          Metadata:{" "}
                                        </span>
                                        <pre className="mt-1 overflow-x-auto rounded bg-gray-200 p-2 text-xs text-gray-700 dark:bg-dark-700 dark:text-dark-200">
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                </div>
                              </Td>
                            </Tr>
                          )}
                        </>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
            </Card>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-dark-300">
                  Showing {(page - 1) * perPage + 1}–
                  {Math.min(page * perPage, total)} of{" "}
                  {total.toLocaleString()}
                </p>
                <Select
                  value={String(perPage)}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 text-xs"
                  data={PER_PAGE_OPTIONS.map((n) => ({
                    label: `${n} / page`,
                    value: String(n),
                  }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  color="neutral"
                  className="h-9"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeftIcon className="size-4" />
                  Prev
                </Button>
                <span className="text-sm text-gray-500 dark:text-dark-300">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outlined"
                  color="neutral"
                  className="h-9"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
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
