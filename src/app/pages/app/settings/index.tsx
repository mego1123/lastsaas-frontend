// Import Dependencies
import { useMemo, useState } from "react";
import { ListBulletIcon } from "@heroicons/react/24/outline";
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
// Matches the STRUCTURAL PATTERN of the Tailux Hooks docs page:
//   - Header: h2 title + vertical divider + Breadcrumbs (DemoLayout pattern)
//     Breadcrumbs update to include the active section name.
//   - Left: DocsNavigation-style nav list (col-span-1, no icons, border-l
//     active state, sticky)
//   - Right: content pane (col-span-3) showing ONLY the selected section
// ----------------------------------------------------------------------

type SectionKey = "profile" | "security" | "sessions" | "billing";

interface Section {
  key: SectionKey;
  label: string;
  Component: React.ComponentType;
}

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
        { key: "profile", label: "Profile", Component: ProfileTab },
        ...(showSecurityTab
          ? [{ key: "security" as const, label: "Security", Component: SecurityTab }]
          : []),
        { key: "sessions", label: "Sessions", Component: SessionsTab },
        { key: "billing", label: "Billing", Component: BillingTab },
      ],
    [showSecurityTab],
  );

  const [activeSection, setActiveSection] = useState<SectionKey>("profile");
  const active = sections.find((s) => s.key === activeSection) || sections[0];
  const ActiveComponent = active.Component;

  // Breadcrumbs update when switching sections — includes the active
  // section name as the last (non-link) item, matching the docs/hooks
  // pattern where the last breadcrumb is the current page name.
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "App", path: "/dashboard" },
    { title: "Settings", path: "/settings" },
    { title: active.label },
  ];

  return (
    <Page title="Settings">
      <div className="transition-content px-(--margin-x) pt-6 pb-8">
        {/* Header — DemoLayout pattern: h2 + divider + Breadcrumbs
            All in one flex row, left-to-right, on the LEFT side */}
        <div className="flex items-center space-x-4 pb-5 rtl:space-x-reverse">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Settings
          </h2>
          <div className="hidden self-stretch py-1 sm:flex">
            <div className="h-full w-px bg-gray-300 dark:bg-dark-600"></div>
          </div>
          <Breadcrumbs items={breadcrumbs} className="max-sm:hidden" />
        </div>

        {/* Master-detail layout — matches docs/hooks pattern exactly:
            grid grid-cols-4, left nav (col-span-1) + content (col-span-3) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* Left navigation — DocsNavigation pattern:
              sticky, col-span-1, no icons, border-l active state */}
          <nav className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
            {/* Title (desktop only) */}
            <h3 className="hidden items-center gap-4 text-base font-medium text-gray-800 dark:text-dark-100 lg:flex">
              <ListBulletIcon className="size-6" />
              <span>Sections</span>
            </h3>

            {/* Nav items — vertical list on desktop, horizontal scroll on mobile */}
            <div className="mt-3 flex min-w-0 flex-col gap-0 overflow-x-auto lg:overflow-visible">
              <ul className="flex gap-1 pb-1 lg:flex-col lg:gap-0 lg:pb-0">
                {sections.map(({ key, label }) => {
                  const isActive = key === activeSection;
                  return (
                    <li key={key} className="shrink-0 lg:shrink">
                      <button
                        type="button"
                        onClick={() => setActiveSection(key)}
                        className={clsx(
                          "relative inline-flex h-9 min-w-0 shrink-0 items-center border-l px-3 transition-colors lg:w-full",
                          isActive
                            ? "border-primary-500 bg-primary-500/10 font-medium text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 hover:text-gray-900 dark:border-dark-600 dark:text-dark-300 dark:hover:text-dark-50",
                        )}
                      >
                        <span className="truncate">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
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
