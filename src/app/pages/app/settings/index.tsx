// Import Dependencies
import { useMemo, useState } from "react";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

// Local Imports
import { Page } from "@/components/shared/Page";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useBranding } from "@/app/contexts/branding/context";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import SessionsTab from "./SessionsTab";
import BillingTab from "./BillingTab";

// ----------------------------------------------------------------------

type TabKey = "profile" | "security" | "sessions" | "billing";

const TAB_ICONS: Record<TabKey, React.ComponentType<{ className?: string }>> = {
  profile: UserCircleIcon,
  security: ShieldCheckIcon,
  sessions: ClockIcon,
  billing: CreditCardIcon,
};

export default function SettingsPage() {
  const { user } = useAuthContext();
  const { branding } = useBranding();
  const passkeysEnabled = branding?.authProviders?.passkeys ?? false;
  const mfaConfigEnabled = branding?.authProviders?.mfa ?? false;
  const showMfaSection = mfaConfigEnabled || user?.totpEnabled;
  const showSecurityTab = passkeysEnabled || showMfaSection;

  const tabs = useMemo(
    () =>
      [
        { key: "profile" as const, label: "Profile" },
        ...(showSecurityTab
          ? [{ key: "security" as const, label: "Security" }]
          : []),
        { key: "sessions" as const, label: "Sessions" },
        { key: "billing" as const, label: "Billing" },
      ],
    [showSecurityTab],
  );

  const [tab, setTab] = useState<TabKey>("profile");

  return (
    <Page title="Settings">
      <div className="transition-content px-(--margin-x) pt-6 pb-8">
        <div className="mb-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-50">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
            Manage your account
          </p>
        </div>

        {/* Tab Navigation — Exchange-style segmented toggle
            (from dashboards/crypto-1) */}
        <div className="mb-6">
          <SegmentedToggle
            value={tab}
            onChange={(v) => setTab(v as TabKey)}
            options={tabs.map((t) => ({
              value: t.key,
              label: t.label,
              Icon: TAB_ICONS[t.key],
            }))}
          />
        </div>

        {tab === "profile" && <ProfileTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "sessions" && <SessionsTab />}
        {tab === "billing" && <BillingTab />}
      </div>
    </Page>
  );
}
