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
// Layout structure (matching the Tailux docs/hooks pattern):
//
//   ┌──────────────────────┬─────────────────────────────────────────┐
//   │ Sections             │ Settings │ App › Settings › Profile      │  ← SAME ROW
//   ├──────────────────────┼─────────────────────────────────────────┤
//   │ Profile              │                                         │
//   │ Sessions             │              PAGE CONTENT               │
//   │ Billing              │                                         │
//   └──────────────────────┴─────────────────────────────────────────┘
//
// The "Sections" heading and the "Settings | breadcrumbs" header are on
// the SAME horizontal row. Below that row: left = nav list, right = content.
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

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "App", path: "/dashboard" },
    { title: active.label },
  ];

  return (
    <Page title="Settings">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* ============================================================ */}
        {/* TOP HEADER ROW — spans both columns                          */}
        {/* Left: "Sections" heading    Right: h2 + divider + Breadcrumbs */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-6 pb-5 lg:grid-cols-4 lg:gap-8">
          {/* Left column header — "Settings" heading (sidebar-side header) */}
          <div className="hidden lg:block">
            <h3 className="flex items-center gap-4 text-base font-medium text-gray-800 dark:text-dark-100">
              <ListBulletIcon className="size-6" />
              <span>Settings</span>
            </h3>
          </div>

          {/* Right column header — h2 title + divider + Breadcrumbs
              All in one flex row, left-aligned. The breadcrumb is
              positioned IMMEDIATELY AFTER the title (not right-aligned). */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse lg:col-span-3">
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Settings
            </h2>
            <div className="hidden self-stretch py-1 sm:flex">
              <div className="h-full w-px bg-gray-300 dark:bg-dark-600"></div>
            </div>
            <Breadcrumbs items={breadcrumbs} className="max-sm:hidden" />
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONTENT ROW — left nav (1 col) + right content (3 cols)      */}
        {/* Both start at the same baseline below the shared header       */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* Left navigation — sticky on desktop, horizontal scroll on mobile */}
          <nav className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
            {/* Mobile title (desktop title is in the header row above) */}
            <h3 className="flex items-center gap-4 text-base font-medium text-gray-800 dark:text-dark-100 lg:hidden">
              <ListBulletIcon className="size-6" />
              <span>Settings</span>
            </h3>

            <div className="mt-3 flex min-w-0 flex-col gap-0 overflow-x-auto lg:mt-0 lg:overflow-visible">
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

          {/* Right content pane — ALL sections stay mounted, only the active
              one is visible. This gives instant tab switching with no
              refetch/loading flash (SPA behavior, matching Tailux docs pages
              where switching nav items shows content instantly). */}
          <div className="lg:col-span-3">
            {sections.map(({ key, Component }) => (
              <div key={key} className={key === activeSection ? undefined : "hidden"}>
                <Component />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
