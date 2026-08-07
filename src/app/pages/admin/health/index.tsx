// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";

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
import NodeCards from "./NodeCards";
import IntegrationsPanel from "./IntegrationsPanel";
import CurrentStatusPanel from "./CurrentStatusPanel";
import TimeRangeSelector from "./TimeRangeSelector";
import MetricsCharts from "./MetricsCharts";

// ----------------------------------------------------------------------

export default function HealthPage() {
  const [nodes, setNodes] = useState<SystemNode[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetric[]>([]);
  const [historicalMetrics, setHistoricalMetrics] = useState<SystemMetric[]>(
    [],
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [filterMode, setFilterMode] = useState<NodeFilterMode>("aggregate");
  const [selectedNode, setSelectedNode] = useState("");
  const [integrations, setIntegrations] = useState<IntegrationCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrent = useCallback(async () => {
    try {
      const [nodesData, currentData, intData] = await Promise.all([
        adminApi.listHealthNodes(),
        adminApi.getHealthCurrent(),
        adminApi.getHealthIntegrations(),
      ]);
      setNodes(nodesData.nodes);
      setCurrentMetrics(currentData.metrics);
      setIntegrations(intData.integrations);
      if (!selectedNode && nodesData.nodes.length > 0) {
        setSelectedNode(nodesData.nodes[0].machineId);
      }
    } catch {
      // silently ignore
    }
  }, [selectedNode]);

  const fetchHistorical = useCallback(async () => {
    try {
      const params: { node?: string; range?: string } = { range: timeRange };
      if (filterMode === "single" && selectedNode) {
        params.node = selectedNode;
      }
      const data = await adminApi.getHealthMetrics(params);
      setHistoricalMetrics(data.metrics);
    } catch {
      // silently ignore
    }
  }, [timeRange, filterMode, selectedNode]);

  // Initial load
  useEffect(() => {
    Promise.all([fetchCurrent(), fetchHistorical()]).finally(() =>
      setLoading(false),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch historical when filters change
  useEffect(() => {
    if (!loading) void fetchHistorical();
  }, [timeRange, filterMode, selectedNode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 60s (pauses when tab is in background)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchCurrent();
        void fetchHistorical();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchCurrent, fetchHistorical]);

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
        {/* Header */}
        <div className="pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-success/15">
              <HeartIcon className="size-5 text-success dark:text-success-light" />
            </div>
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                System Health
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-300">
                Real-time server monitoring and metrics
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <NodeCards nodes={nodes} />
          <IntegrationsPanel integrations={integrations} />
          <CurrentStatusPanel metrics={currentMetrics} />
          <TimeRangeSelector
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
            selectedNode={selectedNode}
            onSelectedNodeChange={setSelectedNode}
            nodes={nodes}
          />
          <MetricsCharts metrics={historicalMetrics} filterMode={filterMode} />
        </div>
      </div>
    </Page>
  );
}
