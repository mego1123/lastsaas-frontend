// Import Dependencies
import { useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
  Dialog,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";

// Local Imports
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { Badge, Button } from "@/components/ui";
import { useBreakpointsContext } from "@/app/contexts/breakpoint/context";
import { useDisclosure } from "@/hooks";

// ----------------------------------------------------------------------
// TableToolbar — a polished toolbar for table pages that mirrors the
// pattern from dashboards/sales/ProductsTable + tables/courses-datatable.
//
// Props:
//   title       — the toolbar title (e.g. "Users", "Activity")
//   rightSlot   — optional extra content on the far right (e.g. CSV button)
//   searchValue — current search string (controlled)
//   onSearchChange — called with the new value as the user types
//   searchPlaceholder — placeholder for the search input
//   searchDebounce — debounce ms (default 350). The component manages its
//                    own local "live" value and calls onSearchChange only
//                    after the user stops typing for this duration.
//   filters       — array of filter descriptors. Each renders as an
//                   outlined dashed-border button (like FacedtedFilter).
//   onClearAll    — optional. If provided and any filter is active, a
//                   small X icon button appears to clear everything.
//   isFiltered    — whether any filter is currently active (controls the
//                   clear-all button visibility)
// ----------------------------------------------------------------------

export interface FilterOption {
  value: string;
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterDescriptor {
  /** Stable key for this filter (e.g. "status", "billingStatus") */
  key: string;
  /** Button label when nothing is selected (e.g. "Status") */
  title: string;
  /** Optional icon to show in the button */
  Icon?: React.ComponentType<{ className?: string }>;
  /** Currently selected value (empty string = no filter) */
  value: string;
  /** Called when the user picks an option (empty string = cleared) */
  onChange: (value: string) => void;
  /** The options to show in the dropdown */
  options: FilterOption[];
  /** Whether to allow multiple selection (default: false = single) */
  multiple?: boolean;
}

function FilterButton({
  filter,
}: {
  filter: FilterDescriptor;
}) {
  const { smAndDown } = useBreakpointsContext();
  const [isOpen, { open, close }] = useDisclosure(false);

  const selectedOption = filter.options.find(
    (o) => o.value === filter.value,
  );

  const buttonContent = (
    <>
      {filter.Icon && <filter.Icon className="size-4" />}
      <span>{filter.title}</span>
      {selectedOption && (
        <>
          <div className="h-full w-px bg-gray-300 dark:bg-dark-450" />
          <Badge className="gap-1">
            {selectedOption.Icon && (
              <selectedOption.Icon className="size-4 stroke-1" />
            )}
            <span>{selectedOption.label}</span>
          </Badge>
        </>
      )}
    </>
  );

  const handleSelect = (value: string) => {
    if (filter.multiple) {
      // For multiple, toggle the value in a comma-separated string
      const current = filter.value
        ? filter.value.split(",")
        : [];
      const idx = current.indexOf(value);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      filter.onChange(current.join(","));
    } else {
      // Single-select: clicking the selected option clears it
      filter.onChange(value === filter.value ? "" : value);
    }
    if (!filter.multiple) close();
  };

  const selectedValues = filter.value
    ? filter.value.split(",")
    : [];

  const dropdownContent = (
    <div className="flex max-h-80 w-56 flex-col">
      <div className="max-h-80 overflow-y-auto py-1 outline-hidden">
        {filter.options.length === 0 ? (
          <div className="px-2.5 py-2 text-xs text-gray-500 dark:text-dark-300">
            No options
          </div>
        ) : (
          filter.options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={clsx(
                  "relative flex w-full cursor-pointer select-none items-center gap-2 px-2.5 py-2 text-left text-xs-plus outline-hidden transition-colors",
                  isSelected
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
                    : "text-gray-800 hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-600",
                )}
              >
                <span
                  className={clsx(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    isSelected
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-gray-300 dark:border-dark-450",
                  )}
                >
                  {isSelected && <XMarkIcon className="size-3" />}
                </span>
                {opt.Icon && <opt.Icon className="size-4.5 stroke-1" />}
                <span className="block truncate">{opt.label}</span>
              </button>
            );
          })
        )}
      </div>
      {filter.value && (
        <Button
          onClick={() => {
            filter.onChange("");
            close();
          }}
          className="w-full shrink-0 rounded-none"
          variant="flat"
          color="error"
        >
          Clear Filter
        </Button>
      )}
    </div>
  );

  if (smAndDown) {
    // Mobile: bottom-sheet Dialog
    return (
      <>
        <Button
          variant="outlined"
          onClick={open}
          className={clsx(
            "h-8 gap-2 px-2.5 text-xs whitespace-nowrap",
            isOpen
              ? "border-primary-600 ring-primary-500/50 dark:border-primary-500 ring-3"
              : "border-dashed",
          )}
        >
          {buttonContent}
        </Button>
        <Transition
          appear
          show={isOpen}
          as={Dialog}
          className="relative z-100"
          onClose={close}
        >
          <TransitionChild
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
          />
          <TransitionChild
            as={DialogPanel}
            enter="ease-out transform-gpu transition-transform duration-200"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in transform-gpu transition-transform duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
            className="dark:bg-dark-700 fixed bottom-0 left-0 flex w-full transform-gpu flex-col rounded-t-2xl bg-white transition-transform duration-200"
          >
            {dropdownContent}
          </TransitionChild>
        </Transition>
      </>
    );
  }

  // Desktop: Popover
  return (
    <Popover>
      {({ open }) => (
        <>
          <PopoverButton
            as={Button}
            variant="outlined"
            className={clsx(
              "h-8 gap-2 px-2.5 text-xs whitespace-nowrap",
              open
                ? "border-primary-600 ring-primary-500/50 dark:border-primary-500 ring-3"
                : "border-dashed",
            )}
          >
            {buttonContent}
          </PopoverButton>
          <Transition
            as={PopoverPanel}
            enter="transition ease-out"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
            anchor={{ to: "bottom start", gap: 12 }}
            className="ring-primary-500/50 dark:border-dark-500 dark:bg-dark-750 z-100 flex w-fit flex-col rounded-md border border-gray-300 bg-white shadow-lg shadow-gray-200/50 outline-hidden focus-visible:ring-3 focus-visible:outline-hidden dark:shadow-none"
          >
            <div className="flex flex-col overflow-hidden">
              {dropdownContent}
            </div>
          </Transition>
        </>
      )}
    </Popover>
  );
}

export interface TableToolbarProps {
  title: string;
  rightSlot?: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchDebounce?: number;
  filters?: FilterDescriptor[];
  isFiltered?: boolean;
  onClearAll?: () => void;
}

export function TableToolbar({
  title,
  rightSlot,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchDebounce = 350,
  filters = [],
  isFiltered = false,
  onClearAll,
}: TableToolbarProps) {
  // Local "live" search value — the user types here, we debounce before
  // calling onSearchChange. This keeps the input responsive while avoiding
  // a refetch on every keystroke.
  const [liveSearch, setLiveSearch] = useState(searchValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // If the parent's searchValue changes externally (e.g. cleared), sync
  // the local input.
  useEffect(() => {
    if (searchValue !== liveSearch) {
      setLiveSearch(searchValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setLiveSearch(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(v);
      }, searchDebounce);
    },
    [onSearchChange, searchDebounce],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasFilters = isFiltered || filters.some((f) => f.value);

  return (
    <div className="flex h-14 min-w-0 flex-wrap items-center justify-between gap-2 py-3">
      <h2 className="truncate font-medium tracking-wide text-gray-800 dark:text-dark-100">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <FilterButton key={filter.key} filter={filter} />
        ))}
        <CollapsibleSearch
          placeholder={searchPlaceholder}
          value={liveSearch}
          onChange={handleInputChange}
        />
        {hasFilters && onClearAll && (
          <Button
            variant="flat"
            color="error"
            isIcon
            className="size-8 rounded-full"
            onClick={onClearAll}
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <XMarkIcon className="size-4" />
          </Button>
        )}
        {rightSlot}
      </div>
    </div>
  );
}

// Re-export the search icon for convenience
export { MagnifyingGlassIcon, FunnelIcon };
