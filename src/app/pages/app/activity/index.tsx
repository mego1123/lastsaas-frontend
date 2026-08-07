// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UserPlusIcon,
  UserMinusIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  XCircleIcon,
  KeyIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Local Imports
import { Page } from "@/components/shared/Page";
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { ResponsiveFilter } from "@/components/shared/table/ResponsiveFilter";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Card,
  Badge,
  Button,
  Tag,
  Timeline,
  TimelineItem,
} from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner";
import { useDebounceValue } from "@/hooks";
import { tenantApi } from "@/utils/api";
import type { ActivityLogEntry } from "@/@types/lastsaas";
import type { ColorType } from "@/constants/app";

// ----------------------------------------------------------------------
// Activity page — redesigned with the polished Tailux toolbar pattern.
//
// Two UX upgrades inspired by the Tailux template:
//   1. CollapsibleSearch (from dashboards/sales/ProductsTable)
//      - Small magnifying-glass icon button on the right of the header
//      - Click → expands into a 32-character input
//      - Typing debounces 350ms then triggers server-side search
//
//   2. Action filter (from tables/courses-datatable — FacedtedFilter look)
//      - Outlined dashed-border button with icon + "Action" label
//      - When a filter is active, shows a Badge with the action's short name
//      - Opens a Popover with a scrollable list of action categories
//      - Single-select (matches the backend's single-action regex filter)
//      - "Clear Filter" button at the bottom when something is selected
// ----------------------------------------------------------------------

const PAGE_SIZE = 25;

// ---- Action taxonomy ---------------------------------------------------
// Each action gets: an icon, a Tailux color theme, and a short label
// used in the timeline title and in the filter dropdown.

type ActionStyle = {
  Icon: React.ComponentType<{ className?: string }>;
  color: ColorType;
  title: string;
};

const ACTION_STYLES: Record<string, ActionStyle> = {
  "tenant.settings_updated": {
    Icon: Cog6ToothIcon,
    color: "primary",
    title: "Settings Updated",
  },
  "tenant.member_invited": {
    Icon: UserPlusIcon,
    color: "info",
    title: "Member Invited",
  },
  "tenant.member_removed": {
    Icon: UserMinusIcon,
    color: "warning",
    title: "Member Removed",
  },
  "admin.root_member_invited": {
    Icon: UserPlusIcon,
    color: "secondary",
    title: "Root Member Invited",
  },
  "admin.root_member_removed": {
    Icon: UserMinusIcon,
    color: "error",
    title: "Root Member Removed",
  },
  "admin.root_member_role_changed": {
    Icon: ShieldCheckIcon,
    color: "warning",
    title: "Member Role Changed",
  },
  "admin.root_invitation_canceled": {
    Icon: XCircleIcon,
    color: "error",
    title: "Invitation Canceled",
  },
};

const DEFAULT_STYLE: ActionStyle = {
  Icon: DocumentTextIcon,
  color: "neutral",
  title: "Activity",
};

function styleForAction(action: string | undefined): ActionStyle {
  if (!action) return DEFAULT_STYLE;
  if (ACTION_STYLES[action]) return ACTION_STYLES[action];

  // Prefix-based fallbacks for action families we haven't explicitly mapped
  if (action.startsWith("auth.")) {
    return { Icon: KeyIcon, color: "info", title: "Auth Event" };
  }
  if (action.startsWith("billing.")) {
    return { Icon: CreditCardIcon, color: "success", title: "Billing Event" };
  }
  if (action.startsWith("admin.")) {
    return { Icon: ShieldCheckIcon, color: "secondary", title: "Admin Event" };
  }
  if (action.startsWith("tenant.")) {
    return { Icon: Cog6ToothIcon, color: "primary", title: "Tenant Event" };
  }
  return DEFAULT_STYLE;
}

// Ordered list of action options for the filter dropdown
const ACTION_OPTIONS = Object.keys(ACTION_STYLES).map((value) => ({
  value,
  label: ACTION_STYLES[value].title,
  Icon: ACTION_STYLES[value].Icon,
}));

// Severity → Tag color
const SEVERITY_TAG_COLOR: Record<string, ColorType> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "info",
  debug: "neutral",
};

// ----------------------------------------------------------------------
// ActionFilter — mimics the FacedtedFilter visual pattern from
// tables/courses-datatable, but with single-select behavior to match our
// server-side single-action regex filter.
// ----------------------------------------------------------------------
function ActionFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const selectedOption = ACTION_OPTIONS.find((o) => o.value === value);

  return (
    <ResponsiveFilter
      buttonContent={
        <>
          <FunnelIcon className="size-4" />
          <span>Action</span>
          {selectedOption && (
            <>
              <div className="h-full w-px bg-gray-300 dark:bg-dark-450" />
              <Badge className="gap-1">
                <selectedOption.Icon className="size-4 stroke-1" />
                <span>{selectedOption.label}</span>
              </Badge>
            </>
          )}
        </>
      }
    >
      <div className="flex max-h-80 w-56 flex-col">
        <div className="max-h-80 overflow-y-auto py-1 outline-hidden">
          {ACTION_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(isSelected ? "" : opt.value)}
                className={[
                  "relative flex w-full cursor-pointer select-none items-center gap-2 px-2.5 py-2 text-left text-xs-plus transition-colors outline-hidden",
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
                <opt.Icon className="size-4.5 stroke-1" />
                <span className="block truncate">{opt.label}</span>
                <span className="ml-auto truncate font-mono text-[10px] text-gray-400 dark:text-dark-400">
                  {opt.value.split(".").pop()}
                </span>
              </button>
            );
          })}
        </div>
        {selectedOption && (
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
    </ResponsiveFilter>
  );
}

// ----------------------------------------------------------------------

export default function ActivityPage() {
  const [page, setPage] = useState(1);

  // The "committed" filter values that get sent to the API
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  // The "live" search input value (what the user is typing).
  // CollapsibleSearch writes here; we debounce 350ms before committing.
  const [debouncedSearch, setDebouncedSearch] = useDebounceValue("", 350);
  useEffect(() => {
    // Only commit when the debounced value actually differs — avoids
    // a redundant refetch on first render.
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // React Query — cached data, no refetch within staleTime (60s)
  const { data, isLoading: loading } = useQuery({
    queryKey: ["activity", page, action, search],
    queryFn: () => {
      const params: Record<string, string | number> = {
        page,
        perPage: PAGE_SIZE,
      };
      if (action) params.action = action;
      if (search) params.search = search;
      return tenantApi.getActivity(params);
    },
  });
  const logs: ActivityLogEntry[] = data?.logs ?? [];
  const total = data?.total ?? 0;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleActionChange = (v: string) => {
    setAction(v);
    setPage(1);
  };

  const clearAllFilters = () => {
    setDebouncedSearch("");
    setSearch("");
    setAction("");
    setPage(1);
  };

  const hasFilters = Boolean(search || action);

  // Pre-compute action styles so we don't re-run the lookup on every render
  // of the same row.
  const styledLogs = useMemo(
    () =>
      logs.map((log) => ({
        log,
        style: styleForAction(log.action),
      })),
    [logs],
  );

  return (
    <Page title="Activity">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header — unified title + controls in one row */}
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Activity
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Recent activity in your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ActionFilter value={action} onChange={handleActionChange} />
            <CollapsibleSearch
              placeholder="Search activity..."
              value={debouncedSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDebouncedSearch(e.target.value)
              }
            />
            {hasFilters && (
              <Button
                variant="flat"
                color="error"
                isIcon
                className="size-8 rounded-full"
                onClick={clearAllFilters}
                title="Clear all filters"
                aria-label="Clear all filters"
              >
                <XMarkIcon className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <Card className="px-4 pt-5 pb-5 sm:px-5">
          {/* Optional second row: when a filter is active, show a small
              summary line so the user knows what's filtered. */}
          {hasFilters && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-dark-300">
              <span>Filtering by:</span>
              {action && (
                <Badge color="primary" variant="soft" className="gap-1">
                  {styleForAction(action).title}
                </Badge>
              )}
              {search && (
                <Badge color="info" variant="soft" className="gap-1">
                  &ldquo;{search}&rdquo;
                </Badge>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
              >
                clear all
              </button>
            </div>
          )}

          {/* Body */}
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-8 w-8" color="primary" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              Icon={DocumentTextIcon}
              title={hasFilters ? "No activity matches your filters" : "No activity recorded yet"}
              description={
                hasFilters
                  ? "Try adjusting your search or filters."
                  : "Activity will appear here as actions occur in your organization."
              }
            />
          ) : (
            <>
              <div className="max-w-2xl">
                <Timeline pointSize="1.5rem">
                  {styledLogs.map(({ log, style }) => {
                    const { Icon, color, title } = style;
                    return (
                      <TimelineItem
                        key={log.id}
                        title={title}
                        time={new Date(log.createdAt).getTime()}
                        classNames={{
                          contentWrapper: "ltr:pl-6 sm:ltr:pl-10 rtl:pr-6 sm:rtl:pr-10",
                        }}
                        point={
                          <div
                            className={`timeline-item-point this:${color} text-this dark:text-this-light relative flex shrink-0 items-center justify-center rounded-full border border-current`}
                          >
                            <Icon className="text-xs" />
                          </div>
                        }
                      >
                        {/* Main message */}
                        <p className="text-sm text-gray-700 dark:text-dark-100">
                          {log.message}
                        </p>

                        {/* Tag chips: action + severity */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {log.action && (
                            <Tag
                              variant="soft"
                              color={color}
                              className="rounded-full border border-this-darker/40 dark:border-this-lighter/30"
                            >
                              {log.action}
                            </Tag>
                          )}
                          {log.severity && (
                            <Tag
                              variant="soft"
                              color={
                                SEVERITY_TAG_COLOR[log.severity] || "neutral"
                              }
                              className="rounded-full border border-this-darker/40 dark:border-this-lighter/30"
                            >
                              {log.severity}
                            </Tag>
                          )}
                        </div>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-1 py-3 dark:border-dark-600">
                  <p className="text-sm text-gray-500 dark:text-dark-300">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outlined"
                      color="neutral"
                      isIcon
                      className="size-8"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="px-3 py-1 text-sm text-gray-500 dark:text-dark-300">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outlined"
                      color="neutral"
                      isIcon
                      className="size-8"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      aria-label="Next page"
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </Page>
  );
}
