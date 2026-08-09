import { ServerIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Box, Badge } from "@/components/ui";
import type { SystemNode } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Node cards — Tailux CRM-Analytics ProjectCard pattern:
// Box with colored left border (border-l-this), Badge for status,
// metric rows below. No ad-hoc background-color soup.
// ----------------------------------------------------------------------

interface NodeCardsProps {
  nodes: SystemNode[];
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NodeCards({ nodes }: NodeCardsProps) {
  if (nodes.length === 0) {
    return (
      <Box className="p-8 text-center text-gray-500 dark:text-dark-300">
        No nodes registered yet. Metrics will appear after the first
        collection cycle (~60s).
      </Box>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => {
        const isActive = node.status === "active";
        const color = isActive ? "success" : "warning";
        return (
          <Box
            key={node.id}
            className={clsx(
              `this:${color}`,
              "border-l-this dark:border-l-this-light flex flex-col justify-between border-4 border-transparent px-4 py-3",
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-base font-medium text-gray-800 dark:text-dark-100">
                  {node.hostname}
                </p>
                <Badge color={color} variant="outlined" className="capitalize shrink-0">
                  {node.status}
                </Badge>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-gray-400 dark:text-dark-400">
                {node.machineId}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-dark-300">
              <div>
                <span className="text-gray-400 dark:text-dark-400">Version:</span>{" "}
                <span className="text-gray-700 dark:text-dark-200">{node.version}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-dark-400">Go:</span>{" "}
                <span className="text-gray-700 dark:text-dark-200">{node.goVersion}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-dark-400">Last seen:</span>{" "}
                <span className="text-gray-700 dark:text-dark-200">{timeAgo(node.lastSeen)}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-dark-400">Up since:</span>{" "}
                <span className="text-gray-700 dark:text-dark-200">{timeAgo(node.startedAt)}</span>
              </div>
            </div>
          </Box>
        );
      })}
    </div>
  );
}
