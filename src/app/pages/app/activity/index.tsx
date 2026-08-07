// Import Dependencies
import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { TableToolbar } from "@/components/shared/TableToolbar";
import type { FilterOption } from "@/components/shared/TableToolbar";
import {
  Card,
  Avatar,
  Badge,
  Button,
  Tag,
  Timeline,
  TimelineItem,
} from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner";
import { tenantApi } from "@/utils/api";
import type { ActivityLogEntry } from "@/@types/lastsaas";
import { getErrorMessage } from "@/utils/errors";
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

// Pull the user's display info out of the log entry's metadata, if present.
function userInitialsFromMetadata(meta?: Record<string, unknown>): string | undefined {
  if (!meta) return undefined;
  const email = typeof meta.email === "string" ? meta.email : undefined;
  if (email) {
    const name = email.split("@")[0];
    return name
      .split(/[._-]/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return undefined;
}

// ----------------------------------------------------------------------
// ActionFilter options for the TableToolbar
// ----------------------------------------------------------------------
const ACTION_FILTER_OPTIONS: FilterOption[] = ACTION_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
  Icon: opt.Icon,
}));

// ----------------------------------------------------------------------

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // The "committed" filter values that get sent to the API
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  const fetchActivity = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = {
      page,
      perPage: PAGE_SIZE,
    };
    if (action) params.action = action;
    if (search) params.search = search;
    tenantApi
      .getActivity(params)
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, action, search]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleActionChange = (v: string) => {
    setAction(v);
    setPage(1);
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const clearAllFilters = () => {
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
      <div className="transition-content px-(--margin-x) pt-6 pb-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-50">
            Activity
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
            Recent activity in your organization
          </p>
        </div>

        <Card className="px-4 pb-5 sm:px-5">
          <TableToolbar
            title="Users Activity"
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search activity..."
            isFiltered={hasFilters}
            onClearAll={clearAllFilters}
            filters={[
              {
                key: "action",
                title: "Action",
                Icon: FunnelIcon,
                value: action,
                onChange: handleActionChange,
                options: ACTION_FILTER_OPTIONS,
              },
            ]}
          />

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
            <div className="py-16 text-center text-gray-500 dark:text-dark-300">
              {hasFilters
                ? "No activity matches your filters."
                : "No activity recorded yet."}
            </div>
          ) : (
            <>
              <div className="max-w-2xl">
                <Timeline pointSize="1.5rem">
                  {styledLogs.map(({ log, style }) => {
                    const { Icon, color, title } = style;
                    const initials = userInitialsFromMetadata(log.metadata);
                    return (
                      <TimelineItem
                        key={log.id}
                        title={title}
                        time={new Date(log.createdAt).getTime()}
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

                        {/* Avatar if we can derive an identity from metadata */}
                        {initials && (
                          <Avatar
                            size={8}
                            name={initials}
                            initialColor={color}
                            classNames={{
                              root: "mt-2",
                            }}
                          />
                        )}

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
