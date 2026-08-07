// Import Dependencies
import { useMemo, useState } from "react";

// Local Imports
import { Page } from "@/components/shared/Page";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useBranding } from "@/app/contexts/branding/context";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import SessionsTab from "./SessionsTab";
import BillingTab from "./BillingTab";

// ----------------------------------------------------------------------

type TabKey = "profile" | "security" | "sessions" | "billing";

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

        {/* Tab Navigation — scrollable on mobile, fixed on desktop */}
        <div
          className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-gray-200 p-1 dark:border-dark-600"
          role="tablist"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              role="tab"
              aria-selected={tab === t.key}
              className={`min-h-11 flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary-500/10 text-primary-600 dark:bg-primary-400/15 dark:text-primary-400"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-dark-300 dark:hover:bg-dark-300/10 dark:hover:text-dark-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && <ProfileTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "sessions" && <SessionsTab />}
        {tab === "billing" && <BillingTab />}
      </div>
    </Page>
  );
}
