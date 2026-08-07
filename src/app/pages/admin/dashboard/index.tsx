// Import Dependencies
import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UsersIcon,
  BuildingOffice2Icon,
  HeartIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  UserCircleIcon,
  PlusIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Local Imports
import { Page } from "@/components/shared/Page";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { adminApi } from "@/utils/api";
import type {
  DailyMetricPoint,
  IntegrationCheck,
} from "@/@types/lastsaas";

// ----------------------------------------------------------------------

const INTEGRATION_LABELS: Record<string, string> = {
  stripe: "Stripe",
  resend: "Resend",
  mongodb: "MongoDB",
  google_oauth: "Google Login",
  github_oauth: "GitHub Login",
  microsoft_oauth: "Microsoft Login",
  webauthn: "Passkeys",
  saml_sso: "SSO/SAML",
};

function MetricChart({
  data,
  color,
  formatter,
}: {
  data: DailyMetricPoint[];
  color: string;
  formatter: (v: number) => string;
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        Icon={ChartBarSquareIcon}
        title="No data yet"
        description="Chart data will appear once available."
        className="h-40"
      />
    );
  }

  const gradientId = `grad-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value) => [formatter(Number(value) || 0), ""]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={`url(#${gradientId})`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function KpiCard({
  to,
  icon,
  iconColor,
  label,
  value,
  warning,
  issues,
}: {
  to?: string;
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string | number;
  warning?: boolean;
  issues?: string[];
}) {
  const content = (
    <Card
      className={`p-5 transition-colors ${
        to
          ? "hover:border-primary-500 dark:hover:border-primary-500"
          : ""
      } ${warning ? "border-error/30 dark:border-error-lighter/30" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-dark-300">{label}</p>
          <p className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            {value}
          </p>
        </div>
      </div>
      {issues && issues.length > 0 && (
        <div className="mt-3 space-y-1">
          {issues.map((issue, i) => (
            <p key={i} className="text-xs text-error">
              {issue}
            </p>
          ))}
        </div>
      )}
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

// ----------------------------------------------------------------------

export default function AdminDashboardPage() {
  const [chartRange, setChartRange] = useState<"7d" | "30d" | "1y">("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [dashData, intData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getHealthIntegrations(),
      ]);
      const unconfigured = (intData.integrations || [])
        .filter((i: IntegrationCheck) => i.status === "not_configured")
        .map((i: IntegrationCheck) => i.name);
      return { ...dashData, unconfiguredIntegrations: unconfigured };
    },
  });

  const { data: chartsData } = useQuery({
    queryKey: ["admin", "dashboard-charts", chartRange],
    queryFn: async () => {
      const [rev, arr, dau] = await Promise.all([
        adminApi.getFinancialMetrics({ range: chartRange, metric: "revenue" }),
        adminApi.getFinancialMetrics({ range: chartRange, metric: "arr" }),
        adminApi.getFinancialMetrics({ range: chartRange, metric: "dau" }),
      ]);
      return { revenue: rev.data, arr: arr.data, dau: dau.data };
    },
  });

  if (isLoading) {
    return (
      <Page title="Admin Dashboard">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <Spinner className="size-8" color="primary" />
          </div>
        </div>
      </Page>
    );
  }

  const healthy = data?.health?.healthy ?? true;
  const issues = data?.health?.issues ?? [];
  const unconfiguredIntegrations = data?.unconfiguredIntegrations ?? [];
  const revenueData = chartsData?.revenue ?? [];
  const arrData = chartsData?.arr ?? [];
  const dauData = chartsData?.dau ?? [];

  const latestRevenue =
    revenueData.length > 0 ? revenueData[revenueData.length - 1].value : 0;
  const latestArr =
    arrData.length > 0 ? arrData[arrData.length - 1].value : 0;
  const latestDau =
    dauData.length > 0 ? dauData[dauData.length - 1].value : 0;

  const formatCents = (v: number) => `$${(v / 100).toFixed(2)}`;
  const formatNum = (v: number) => v.toLocaleString();

  return (
    <Page title="Admin Dashboard">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header */}
        <div className="pb-5">
          <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
            System overview and management
          </p>
        </div>

        {/* Unconfigured Integrations Warning */}
        {unconfiguredIntegrations.length > 0 && (
          <Link
            to="/last/health#integrations"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4 transition-colors hover:border-warning/30 dark:border-warning/20"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
              <PlusIcon className="size-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-warning">
                {unconfiguredIntegrations.length} integration
                {unconfiguredIntegrations.length > 1 ? "s" : ""} not
                configured
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-dark-300">
                {unconfiguredIntegrations
                  .map(
                    (n: string) =>
                      INTEGRATION_LABELS[n] ||
                      n.charAt(0).toUpperCase() + n.slice(1),
                  )
                  .join(", ")}{" "}
                {unconfiguredIntegrations.length > 1 ? "need" : "needs"} setup.
                Click to view details.
              </p>
            </div>
          </Link>
        )}

        {/* Top Stats */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <KpiCard
            to="/last/users"
            icon={<UsersIcon className="size-6 text-primary-500 dark:text-primary-400" />}
            iconColor="bg-primary-500/10 dark:bg-primary-500/15"
            label="Total Users"
            value={data?.users ?? 0}
          />
          <KpiCard
            to="/last/tenants"
            icon={
              <BuildingOffice2Icon className="size-6 text-secondary-500 dark:text-secondary-400" />
            }
            iconColor="bg-secondary-500/10 dark:bg-secondary-500/15"
            label="Tenants"
            value={data?.tenants ?? 0}
          />
          <KpiCard
            to="/last/health"
            icon={
              healthy ? (
                <HeartIcon className="size-6 text-success dark:text-success-light" />
              ) : (
                <ExclamationTriangleIcon className="size-6 text-error" />
              )
            }
            iconColor={
              healthy
                ? "bg-success/10 dark:bg-success/15"
                : "bg-error/10 dark:bg-error/15"
            }
            label="System Status"
            value={healthy ? "Healthy" : "Unhealthy"}
            warning={!healthy}
            issues={!healthy ? issues : undefined}
          />
        </div>

        {/* Business Metrics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <KpiCard
            to="/last/financial"
            icon={
              <BoltIcon className="size-6 text-success dark:text-success-light" />
            }
            iconColor="bg-success/10 dark:bg-success/15"
            label="Revenue Today"
            value={formatCents(latestRevenue)}
          />
          <KpiCard
            icon={
              <ArrowTrendingUpIcon className="size-6 text-primary-500 dark:text-primary-400" />
            }
            iconColor="bg-primary-500/10 dark:bg-primary-500/15"
            label="ARR"
            value={formatCents(latestArr)}
          />
          <KpiCard
            icon={<UserCircleIcon className="size-6 text-warning" />}
            iconColor="bg-warning/10 dark:bg-warning/15"
            label="DAU"
            value={formatNum(latestDau)}
          />
        </div>

        {/* Charts */}
        <div className="flex items-center justify-between pb-5">
          <h2 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Business Metrics
          </h2>
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-dark-600 dark:bg-dark-800/50">
            {(["7d", "30d", "1y"] as const).map((range) => (
              <Button
                key={range}
                variant={chartRange === range ? "filled" : "flat"}
                color={chartRange === range ? "primary" : "neutral"}
                className="h-7 min-w-10 px-3 text-xs"
                onClick={() => setChartRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-dark-300">
              Revenue
            </h3>
            <MetricChart
              data={revenueData}
              color="#10b981"
              formatter={formatCents}
            />
          </Card>
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-dark-300">
              ARR
            </h3>
            <MetricChart
              data={arrData}
              color="#6366f1"
              formatter={formatCents}
            />
          </Card>
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-dark-300">
              DAU
            </h3>
            <MetricChart
              data={dauData}
              color="#eab308"
              formatter={formatNum}
            />
          </Card>
        </div>

        {/* Footer status badge */}
        <div className="mt-8 flex items-center justify-end">
          <Badge
            color={healthy ? "success" : "warning"}
            variant="soft"
            className="capitalize"
          >
            {healthy ? "Healthy" : "Issues"}
          </Badge>
        </div>
      </div>
    </Page>
  );
}
