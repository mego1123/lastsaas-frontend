import clsx from "clsx";
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

// Pill-track toggle — matches ItemViewTypeSelect pattern from
// tables/users-datatable (gray track + white floating pill for active)
function PillToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md bg-gray-200 px-1 py-1 text-xs-plus text-gray-800 dark:bg-dark-700 dark:text-dark-200">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <Button
            key={opt.value}
            unstyled
            className={clsx(
              "shrink-0 rounded-sm px-2.5 py-1 font-medium whitespace-nowrap",
              isActive
                ? "bg-white shadow-sm dark:bg-dark-500 dark:text-dark-100"
                : "hover:text-gray-900 focus:text-gray-900 dark:hover:text-dark-100 dark:focus:text-dark-100",
            )}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

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
      <PillToggle
        options={timeRanges}
        value={timeRange}
        onChange={onTimeRangeChange}
      />
      <PillToggle
        options={filterModes}
        value={filterMode}
        onChange={onFilterModeChange}
      />

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
