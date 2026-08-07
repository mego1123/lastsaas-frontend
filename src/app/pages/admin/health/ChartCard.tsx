import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-medium text-gray-500 dark:text-dark-300">
        {title}
      </h3>
      <div className="h-64">{children}</div>
    </Card>
  );
}
