import { Table, TBody, THead, Tr, Th, Td, Badge } from "@/components/ui";
import type { SystemNode } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Node table — Tailux basic-table pattern:
// <Table> with THead (uppercase col titles) + TBody rows.
// No ad-hoc card grid, no left-border color soup.
// ----------------------------------------------------------------------

interface NodeTableProps {
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

export default function NodeTable({ nodes }: NodeTableProps) {
  if (nodes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-dark-500 dark:text-dark-300">
        No nodes registered yet. Metrics will appear after the first
        collection cycle (~60s).
      </div>
    );
  }

  return (
    <div className="hide-scrollbar min-w-full overflow-x-auto">
      <Table className="w-full text-left rtl:text-right">
        <THead>
          <Tr className="border-y border-transparent border-b-gray-200 dark:border-b-dark-500">
            <Th className="font-semibold uppercase text-gray-800 dark:text-dark-100">
              Hostname
            </Th>
            <Th className="font-semibold uppercase text-gray-800 dark:text-dark-100">
              Machine ID
            </Th>
            <Th className="font-semibold uppercase text-gray-800 dark:text-dark-100">
              Status
            </Th>
            <Th className="font-semibold uppercase text-gray-800 dark:text-dark-100">
              Version
            </Th>
            <Th className="font-semibold uppercase text-gray-800 dark:text-dark-100">
              Go
            </Th>
            <Th className="font-semibold uppercase text-gray-800 dark:text-dark-100">
              Last Seen
            </Th>
            <Th className="font-semibold uppercase text-gray-800 dark:text-dark-100">
              Up Since
            </Th>
          </Tr>
        </THead>
        <TBody>
          {nodes.map((node) => {
            const isActive = node.status === "active";
            const color = isActive ? "success" : "warning";
            return (
              <Tr
                key={node.id}
                className="border-y border-transparent border-b-gray-200 dark:border-b-dark-500"
              >
                <Td className="font-medium text-gray-800 dark:text-dark-100">
                  {node.hostname}
                </Td>
                <Td className="font-mono text-xs text-gray-500 dark:text-dark-300">
                  {node.machineId}
                </Td>
                <Td>
                  <Badge color={color} variant="soft" className="capitalize">
                    {node.status}
                  </Badge>
                </Td>
                <Td className="text-gray-700 dark:text-dark-200">
                  {node.version}
                </Td>
                <Td className="text-gray-700 dark:text-dark-200">
                  {node.goVersion}
                </Td>
                <Td className="text-gray-700 dark:text-dark-200">
                  {timeAgo(node.lastSeen)}
                </Td>
                <Td className="text-gray-700 dark:text-dark-200">
                  {timeAgo(node.startedAt)}
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
