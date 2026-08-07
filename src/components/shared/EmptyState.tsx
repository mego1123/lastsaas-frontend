// Import Dependencies
import { ElementType, ReactNode } from "react";
import clsx from "clsx";

// ----------------------------------------------------------------------
// EmptyState — a polished "no data" placeholder matching the Tailux
// aesthetic. Used when a table, list, or page has no data to show.
//
// Inspired by:
//   - tables/courses-datatable empty filter result ("Nothing found for X")
//   - apps/chat/ConversationPanel/Placeholder centered grid pattern
//   - errors/404 icon + title + description + action pattern
//
// Usage:
//   <EmptyState
//     Icon={DocumentTextIcon}
//     title="No users yet"
//     description="Users will appear here once they sign up."
//     action={<Button onClick={...}>Invite User</Button>}
//   />
// ----------------------------------------------------------------------

export interface EmptyStateProps {
  /** Heroicon or other icon component */
  Icon?: ElementType;
  /** Main title text */
  title: string;
  /** Optional description below the title */
  description?: ReactNode;
  /** Optional action button/element below the description */
  action?: ReactNode;
  /** Container className override */
  className?: string;
  /** Icon size class (default: size-12) */
  iconSize?: string;
  /** Icon color class (default: text-gray-300 dark:text-dark-500) */
  iconColor?: string;
}

export function EmptyState({
  Icon,
  title,
  description,
  action,
  className,
  iconSize = "size-12",
  iconColor = "text-gray-300 dark:text-dark-500",
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "grid place-content-center place-items-center gap-3 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <Icon
          className={clsx(iconSize, iconColor)}
          aria-hidden="true"
        />
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700 dark:text-dark-100">
          {title}
        </p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-dark-300">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
