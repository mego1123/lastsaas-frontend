import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

// ----------------------------------------------------------------------
// Chart card — Tailux CMS-Analytics PageViews pattern:
// Card with overflow-hidden, header row with title left.
// ----------------------------------------------------------------------

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card className="overflow-hidden pb-4">
      <div className="flex min-w-0 items-center justify-between px-4 pt-3 sm:px-5">
        <h3 className="truncate text-sm-plus font-medium tracking-wide text-gray-800 dark:text-dark-100">
          {title}
        </h3>
      </div>
      <div className="mt-4 h-64 px-2">{children}</div>
    </Card>
  );
}
