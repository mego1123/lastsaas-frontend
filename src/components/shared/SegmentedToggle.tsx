// Import Dependencies
import { Label, Radio, RadioGroup } from "@headlessui/react";
import clsx from "clsx";
import { ElementType, ReactNode } from "react";

// ----------------------------------------------------------------------
// SegmentedToggle — a polished toggle group mimicking the Receive/Send
// toggle in dashboards/crypto-1/Exchange.tsx.
//
// Uses Headless UI's RadioGroup with the Exchange's visual style:
//   - Rounded gray container (bg-gray-150 dark:bg-dark-800)
//   - Selected option gets a white card with shadow (bg-white shadow-sm)
//   - Options are flex-1 (equal width)
//   - Optional icon + label per option
//
// Usage:
//   <SegmentedToggle
//     value={tab}
//     onChange={setTab}
//     options={[
//       { value: "identity", label: "Identity", Icon: UserIcon },
//       { value: "theme", label: "Theme", Icon: SwatchIcon },
//     ]}
//   />
// ----------------------------------------------------------------------

export interface SegmentedToggleOption {
  value: string;
  label: ReactNode;
  Icon?: ElementType;
}

export interface SegmentedToggleProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedToggleOption[];
  /** Container className override (rarely needed) */
  className?: string;
  /** Layout: "equal" (default, flex-1 each) or "auto" (sized to content) */
  layout?: "equal" | "auto";
}

export function SegmentedToggle({
  value,
  onChange,
  options,
  className,
  layout = "equal",
}: SegmentedToggleProps) {
  return (
    <div
      className={clsx(
        "rounded-lg bg-gray-150 text-gray-600 dark:bg-dark-800 dark:text-dark-200",
        className,
      )}
    >
      <RadioGroup
        value={value}
        onChange={onChange}
        as="div"
        className="flex px-1.5 py-1"
      >
        {options.map((opt) => (
          <Radio
            key={opt.value}
            value={opt.value}
            className={({ checked }) =>
              clsx(
                "flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium outline-hidden transition-colors",
                layout === "equal" && "flex-1",
                checked
                  ? "bg-white shadow-sm dark:bg-surface-2 dark:text-dark-100"
                  : "hover:text-dark-800 focus:text-dark-800 dark:hover:text-dark-100 dark:focus:text-dark-100",
              )
            }
          >
            {opt.Icon && <opt.Icon className="size-4.5" />}
            <Label className="cursor-pointer">{opt.label}</Label>
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
