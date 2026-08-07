// Import Dependencies
import { useMemo } from "react";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useBranding } from "@/app/contexts/branding/context";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import SessionsTab from "./SessionsTab";
import BillingTab from "./BillingTab";

// ----------------------------------------------------------------------
// Settings page — redesigned to match the Tailux docs/hooks/useBoxPosition
// layout (DemoLayout + DemoCard pattern).
//
// Each section (Profile, Security, Sessions, Billing) is rendered as its
// own Card with:
//   - px-4 pb-4 sm:px-5 padding
//   - h-14 header with icon + title
//   - content below
//
// All sections are stacked in a grid (grid-cols-1 gap-4 sm:gap-5 lg:gap-6),
// not behind tabs — so everything is visible on one scrollable page.
// ----------------------------------------------------------------------

type SectionKey = "profile" | "security" | "sessions" | "billing";

interface Section {
  key: SectionKey;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
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
        {
          key: "profile",
          title: "Profile",
          Icon: UserCircleIcon,
          Component: ProfileTab,
        },
        ...(showSecurityTab
          ? [
              {
                key: "security" as const,
                title: "Security",
                Icon: ShieldCheckIcon,
                Component: SecurityTab,
              },
            ]
          : []),
        {
          key: "sessions",
          title: "Sessions",
          Icon: ClockIcon,
          Component: SessionsTab,
        },
        {
          key: "billing",
          title: "Billing",
          Icon: CreditCardIcon,
          Component: BillingTab,
        },
      ],
    [showSecurityTab],
  );

  return (
    <Page title="Settings">
      <div className="transition-content px-(--margin-x) pt-6 pb-8">
        {/* Header */}
        <div className="pb-5">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-50">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
            Manage your account
          </p>
        </div>

        {/* Sections — each in its own Card with h-14 header
            (DemoLayout + DemoCard pattern from docs/hooks/useBoxPosition) */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">
          {sections.map(({ key, title, Icon, Component }) => (
            <Card key={key} className="px-4 pb-4 sm:px-5">
              {/* Card header — h-14, matches DemoCard header */}
              <header className="flex h-14 items-center gap-3 py-3">
                <Icon className="size-5 text-gray-500 dark:text-dark-300" />
                <h2 className="truncate font-medium tracking-wide text-gray-800 dark:text-dark-100">
                  {title}
                </h2>
              </header>
              {/* Card content */}
              <div className="mt-1">
                <Component />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}
