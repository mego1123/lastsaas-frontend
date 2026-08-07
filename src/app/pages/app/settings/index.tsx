// Import Dependencies
import { useMemo, useState } from "react";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/shared/Breadcrumbs";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useBranding } from "@/app/contexts/branding/context";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import SessionsTab from "./SessionsTab";
import BillingTab from "./BillingTab";

// ----------------------------------------------------------------------
// Settings page — master-detail (list-detail) layout.
//
// Matches the STRUCTURAL PATTERN of the Tailux Hooks docs page
// (src/app/pages/docs/hooks/index.tsx + DocsNavigation.tsx):
//   - Header: h2 title + vertical divider + Breadcrumbs (DemoLayout pattern)
//   - Left: a secondary in-page navigation list with active-state highlight
//   - Right: a focused content pane showing ONLY the selected item's content
//
// On desktop: grid grid-cols-4 — left nav (1 col) + content (3 cols)
// On mobile: the nav becomes a horizontal scrollable list above the content
// ----------------------------------------------------------------------

type SectionKey = "profile" | "security" | "sessions" | "billing";

interface Section {
  key: SectionKey;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  Component: React.ComponentType;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "App", path: "/dashboard" },
  { title: "Settings" },
];

export default function SettingsPage() {
  const { user } = useAuthContext();
  const { branding } = useBranding();
  const passkeysEnabled = branding?.authProviders?.passkeys ?? false;
  const mfaConfigEnabled = branding?.authProviders?.mfa ?? false;
  const showMfaSection = mfaConfigEnabled || user?.totpEnabled;
  const showSecurityTab = passkeysEnabled || showMfaSection;

  const sections = useMemo<Section[]>(
    () =>
      [
        {
          key: "profile",
          label: "Profile",
          Icon: UserCircleIcon,
          Component: ProfileTab,
        },
        ...(showSecurityTab
          ? [
              {
                key: "security" as const,
                label: "Security",
                Icon: ShieldCheckIcon,
                Component: SecurityTab,
              },
            ]
          : []),
        {
          key: "sessions",
          label: "Sessions",
          Icon: ClockIcon,
          Component: SessionsTab,
        },
        {
          key: "billing",
          label: "Billing",
          Icon: CreditCardIcon,
          Component: BillingTab,
        },
      ],
    [showSecurityTab],
  );

  const [activeSection, setActiveSection] = useState<SectionKey>("profile");
  const active = sections.find((s) => s.key === activeSection) || sections[0];
  const ActiveComponent = active.Component;

  return (
    <Page title="Settings">
      <div className="transition-content px-(--margin-x) pt-6 pb-8">
        {/* Header — DemoLayout pattern: h2 title + divider + Breadcrumbs */}
        <div className="flex items-center space-x-4 pb-5 rtl:space-x-reverse">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Settings
          </h2>
          <div className="hidden self-stretch py-1 sm:flex">
            <div className="h-full w-px bg-gray-300 dark:bg-dark-600"></div>
          </div>
          <Breadcrumbs items={breadcrumbs} className="max-sm:hidden" />
        </div>

        {/* Master-detail layout — matches docs/hooks pattern:
            grid grid-cols-4, left nav (1 col) + content (3 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* Left navigation — sticky on desktop, horizontal scroll on mobile */}
          <nav className="lg:sticky lg:top-24 lg:self-start">
            {/* Title (desktop only, matches DocsNavigation h3) */}
            <h3 className="hidden items-center gap-4 text-base font-medium text-gray-800 dark:text-dark-100 lg:flex">
              <ListBulletIcon className="size-6" />
              <span>Sections</span>
            </h3>

            {/* Nav items — vertical list on desktop, horizontal scroll on mobile */}
            <ul className="flex gap-1 overflow-x-auto pb-1 lg:mt-3 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
              {sections.map(({ key, label, Icon }) => {
                const isActive = key === activeSection;
                return (
                  <li key={key} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setActiveSection(key)}
                      className={clsx(
                        "relative inline-flex h-9 min-w-0 items-center gap-2 whitespace-nowrap border-l px-3 py-2 text-sm transition-colors lg:w-full",
                        isActive
                          ? "border-primary-500 bg-primary-500/10 font-medium text-primary-600 dark:text-primary-400"
                          : "border-transparent text-gray-500 hover:text-gray-900 dark:text-dark-300 dark:hover:text-dark-50",
                      )}
                    >
                      <Icon className="size-4.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right content pane — shows ONLY the selected section, full width */}
          <div className="lg:col-span-3">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </Page>
  );
}
