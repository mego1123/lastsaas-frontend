import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Form/Select";
import type {
  TimeRange,
  NodeFilterMode,
  SystemNode,
} from "@/@types/lastsaas";

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  filterMode: NodeFilterMode;
  onFilterModeChange: (mode: NodeFilterMode) => void;
  selectedNode: string;
  onSelectedNodeChange: (nodeId: string) => void;
  nodes: SystemNode[];
}

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

const filterModes: { value: NodeFilterMode; label: string }[] = [
  { value: "aggregate", label: "Aggregate" },
  { value: "all", label: "All Nodes" },
  { value: "single", label: "Single Node" },
];

export default function TimeRangeSelector({
  timeRange,
  onTimeRangeChange,
  filterMode,
  onFilterModeChange,
  selectedNode,
  onSelectedNodeChange,
  nodes,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-dark-600">
        {timeRanges.map((r) => (
          <Button
            key={r.value}
            variant={timeRange === r.value ? "filled" : "flat"}
            color={timeRange === r.value ? "primary" : "neutral"}
            className="h-8 min-w-9 px-3 text-sm"
            onClick={() => onTimeRangeChange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-dark-600">
        {filterModes.map((m) => (
          <Button
            key={m.value}
            variant={filterMode === m.value ? "filled" : "flat"}
            color={filterMode === m.value ? "primary" : "neutral"}
            className="h-8 min-w-9 px-3 text-sm"
            onClick={() => onFilterModeChange(m.value)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {filterMode === "single" && nodes.length > 0 && (
        <Select
          value={selectedNode}
          onChange={(e) => onSelectedNodeChange(e.target.value)}
          className="h-9 w-56"
          data={nodes.map((n) => ({
            label: `${n.hostname} (${n.machineId.slice(0, 8)})`,
            value: n.machineId,
          }))}
        />
      )}
    </div>
  );
}
