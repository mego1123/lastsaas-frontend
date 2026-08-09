import {
  CpuChipIcon,
  CircleStackIcon,
  ServerStackIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Card } from "@/components/ui/Card";
import type { SystemMetric } from "@/@types/lastsaas";
import { formatPercent, formatMs } from "./formatters";

// ----------------------------------------------------------------------
// Statistics tiles — Tailux CRM-Analytics pattern:
// Uniform Card, number top-left, colored icon top-right, label below.
// No ad-hoc background tints.
// ----------------------------------------------------------------------

interface CurrentStatusPanelProps {
  metrics: SystemMetric[];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

interface StatTile {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "success" | "warning" | "error" | "info" | "secondary";
}

export default function CurrentStatusPanel({
  metrics,
}: CurrentStatusPanelProps) {
  if (metrics.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500 dark:text-dark-300">
        Waiting for metrics...
      </Card>
    );
  }

  const cpuValues = metrics
    .map((m) => m.cpu?.usagePercent)
    .filter((v): v is number => typeof v === "number");
  const memValues = metrics
    .map((m) => m.memory?.usedPercent)
    .filter((v): v is number => typeof v === "number");
  const diskValues = metrics
    .map((m) => m.disk?.usedPercent)
    .filter((v): v is number => typeof v === "number");
  const reqValues = metrics
    .map((m) => m.http?.requestCount)
    .filter((v): v is number => typeof v === "number");
  const p95Values = metrics
    .map((m) => m.http?.latencyP95)
    .filter((v): v is number => typeof v === "number");
  const err5xxValues = metrics
    .map((m) => m.http?.errorRate5xx)
    .filter((v): v is number => typeof v === "number");

  const cpuAvg = avg(cpuValues);
  const memAvg = avg(memValues);
  const diskAvg = avg(diskValues);
  const totalRequests = reqValues.reduce((sum, v) => sum + v, 0);
  const p95Avg = avg(p95Values);
  const err5xxAvg = avg(err5xxValues);

  // Determine color based on threshold
  const cpuColor = cpuAvg > 90 ? "error" : cpuAvg > 70 ? "warning" : "success";
  const memColor = memAvg > 90 ? "error" : memAvg > 75 ? "warning" : "success";
  const diskColor = diskAvg > 95 ? "error" : diskAvg > 80 ? "warning" : "success";
  const latColor = p95Avg > 1000 ? "error" : p95Avg > 200 ? "warning" : "success";
  const errColor = err5xxAvg > 5 ? "error" : err5xxAvg > 1 ? "warning" : "success";

  const tiles: StatTile[] = [
    { label: "CPU", value: formatPercent(cpuAvg), Icon: CpuChipIcon, color: cpuColor },
    { label: "Memory", value: formatPercent(memAvg), Icon: CircleStackIcon, color: memColor },
    { label: "Disk", value: formatPercent(diskAvg), Icon: ServerStackIcon, color: diskColor },
    { label: "Requests", value: `${totalRequests}`, Icon: ArrowTrendingUpIcon, color: "primary" },
    { label: "Latency p95", value: formatMs(p95Avg), Icon: ClockIcon, color: latColor },
    { label: "Error 5xx", value: formatPercent(err5xxAvg), Icon: ExclamationTriangleIcon, color: errColor },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
      {tiles.map((tile) => (
        <Card key={tile.label} className="p-3 lg:p-4">
          <div className="flex justify-between gap-1">
            <p className="text-xl font-semibold text-gray-800 dark:text-dark-100">
              {tile.value}
            </p>
            <tile.Icon
              className={`this:${tile.color} size-5 text-this dark:text-this-light`}
            />
          </div>
          <p className="mt-1 text-xs-plus text-gray-500 dark:text-dark-300">
            {tile.label}
          </p>
        </Card>
      ))}
    </div>
  );
}
