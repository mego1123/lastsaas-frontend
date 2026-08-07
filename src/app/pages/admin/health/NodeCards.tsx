import { ServerIcon } from "@heroicons/react/24/outline";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { SystemNode } from "@/@types/lastsaas";

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
      <Card className="p-8 text-center text-gray-500 dark:text-dark-300">
        No nodes registered yet. Metrics will appear after the first
        collection cycle (~60s).
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => (
        <Card key={node.id} className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-xl ${
                node.status === "active"
                  ? "bg-success/15"
                  : "bg-warning/15"
              }`}
            >
              <ServerIcon
                className={`size-5 ${
                  node.status === "active"
                    ? "text-success dark:text-success-light"
                    : "text-warning"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-gray-900 dark:text-dark-50">
                  {node.hostname}
                </span>
                <Badge
                  color={node.status === "active" ? "success" : "warning"}
                  variant="soft"
                  className="capitalize"
                >
                  {node.status}
                </Badge>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-gray-400 dark:text-dark-400">
                {node.machineId}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-dark-300">
            <div>
              Version:{" "}
              <span className="text-gray-700 dark:text-dark-200">
                {node.version}
              </span>
            </div>
            <div>
              Go:{" "}
              <span className="text-gray-700 dark:text-dark-200">
                {node.goVersion}
              </span>
            </div>
            <div>
              Last seen:{" "}
              <span className="text-gray-700 dark:text-dark-200">
                {timeAgo(node.lastSeen)}
              </span>
            </div>
            <div>
              Up since:{" "}
              <span className="text-gray-700 dark:text-dark-200">
                {timeAgo(node.startedAt)}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
