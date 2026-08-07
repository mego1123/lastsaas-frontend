import { Card } from "@/components/ui/Card";
import type { SystemMetric } from "@/@types/lastsaas";
import {
  formatPercent,
  formatMs,
  statusColor,
  statusBg,
} from "./formatters";

interface CurrentStatusPanelProps {
  metrics: SystemMetric[];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

interface StatusCard {
  label: string;
  value: string;
  color: string;
  bg: string;
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

  // Each metric should have cpu/memory/disk/http — guard with optional chaining
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

  const cards: StatusCard[] = [
    {
      label: "CPU",
      value: formatPercent(cpuAvg),
      color: statusColor(cpuAvg, 70, 90),
      bg: statusBg(cpuAvg, 70, 90),
    },
    {
      label: "Memory",
      value: formatPercent(memAvg),
      color: statusColor(memAvg, 75, 90),
      bg: statusBg(memAvg, 75, 90),
    },
    {
      label: "Disk",
      value: formatPercent(diskAvg),
      color: statusColor(diskAvg, 80, 95),
      bg: statusBg(diskAvg, 80, 95),
    },
    {
      label: "Requests",
      value: `${totalRequests}`,
      color: "text-primary-500 dark:text-primary-400",
      bg: "bg-primary-500/15",
    },
    {
      label: "Latency p95",
      value: formatMs(p95Avg),
      color: statusColor(p95Avg, 200, 1000),
      bg: statusBg(p95Avg, 200, 1000),
    },
    {
      label: "Error 5xx",
      value: formatPercent(err5xxAvg),
      color: statusColor(err5xxAvg, 1, 5),
      bg: statusBg(err5xxAvg, 1, 5),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border border-gray-200 p-4 text-center dark:border-dark-600 ${card.bg}`}
        >
          <p className="mb-1 text-xs text-gray-500 dark:text-dark-300">
            {card.label}
          </p>
          <p className={`text-xl font-semibold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
