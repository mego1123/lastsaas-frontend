// Import Dependencies
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Spinner } from "@/components/ui/Spinner";
import { adminApi } from "@/utils/api";
import type {
  SystemNode,
  SystemMetric,
  TimeRange,
  NodeFilterMode,
  IntegrationCheck,
} from "@/@types/lastsaas";
import NodeTable from "./NodeTable";
import IntegrationsPanel from "./IntegrationsPanel";
import CurrentStatusPanel from "./CurrentStatusPanel";
import TimeRangeSelector from "./TimeRangeSelector";
import MetricsCharts from "./MetricsCharts";

// ----------------------------------------------------------------------

export default function HealthPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [filterMode, setFilterMode] = useState<NodeFilterMode>("aggregate");
  const [selectedNode, setSelectedNode] = useState("");

  // React Query — current data (short staleTime for monitoring)
  const { data: nodesData, isLoading: nodesLoading } = useQuery({
    queryKey: ["admin", "health", "nodes"],
    queryFn: () => adminApi.listHealthNodes(),
    staleTime: 15 * 1000,
  });
  const nodes: SystemNode[] = nodesData?.nodes ?? [];

  const { data: currentData } = useQuery({
    queryKey: ["admin", "health", "current"],
    queryFn: () => adminApi.getHealthCurrent(),
    staleTime: 15 * 1000,
  });
  const currentMetrics: SystemMetric[] = currentData?.metrics ?? [];

  const { data: intData } = useQuery({
    queryKey: ["admin", "health", "integrations"],
    queryFn: () => adminApi.getHealthIntegrations(),
    staleTime: 30 * 1000,
  });
  const integrations: IntegrationCheck[] = intData?.integrations ?? [];

  // Historical metrics — depends on filters
  const { data: histData } = useQuery({
    queryKey: ["admin", "health", "metrics", timeRange, filterMode, selectedNode],
    queryFn: () => {
      const params: { node?: string; range?: string } = { range: timeRange };
      if (filterMode === "single" && selectedNode) {
        params.node = selectedNode;
      }
      return adminApi.getHealthMetrics(params);
    },
    staleTime: 15 * 1000,
  });
  const historicalMetrics: SystemMetric[] = histData?.metrics ?? [];

  // Auto-select first node when nodes load
  if (!selectedNode && nodes.length > 0) {
    setSelectedNode(nodes[0].machineId);
  }

  const loading = nodesLoading;

  if (loading) {
    return (
      <Page title="System Health">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <Spinner className="size-8" color="primary" />
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="System Health">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">
          {/* 1. Current status stat tiles (CPU/Memory/Disk/Requests/Latency/Error) */}
          <CurrentStatusPanel metrics={currentMetrics} />

          {/* 2. Nodes table */}
          <div>
            <h2 className="mb-3 text-sm font-medium tracking-wide text-gray-500 uppercase dark:text-dark-300">
              Nodes
            </h2>
            <NodeTable nodes={nodes} />
          </div>

          {/* 3. Integrations */}
          <IntegrationsPanel integrations={integrations} />

          {/* 4. Time range + filter controls */}
          <TimeRangeSelector
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
            selectedNode={selectedNode}
            onSelectedNodeChange={setSelectedNode}
            nodes={nodes}
          />

          {/* 5. Historical metrics charts */}
          <MetricsCharts metrics={historicalMetrics} filterMode={filterMode} />
        </div>
      </div>
    </Page>
  );
}
