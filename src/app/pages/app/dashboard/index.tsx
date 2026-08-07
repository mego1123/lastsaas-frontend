// Import Dependencies
import DOMPurify from "dompurify";
import {
  Squares2X2Icon,
  UsersIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { useBranding } from "@/app/contexts/branding/context";

// ----------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { currentTenant } = useTenantContext();
  const { branding } = useBranding();

  const isRootTenant = !!currentTenant?.isRoot;
  const showTeam = !isRootTenant;

  return (
    <Page title="Dashboard">
      <div className="px-(--margin-x) pt-6 pb-8">
        {branding.dashboardHtml && (
          <div
            className="pb-5"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(branding.dashboardHtml),
            }}
          />
        )}

        <div className="pb-5">
          <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Welcome back, {user?.displayName?.split(" ")[0]}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
            {currentTenant?.tenantName} &middot;{" "}
            <span className="capitalize">{currentTenant?.role}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          <Card
            component={Link}
            to="/dashboard"
            className="p-5 transition-colors hover:border-primary-500/40"
          >
            <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary-500/10">
              <Squares2X2Icon className="size-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-dark-300">
              Dashboard
            </h3>
            <p className="text-sm-plus font-medium text-gray-900 dark:text-dark-50">
              View your organization's activity and metrics.
            </p>
          </Card>

          {showTeam && (
            <Card
              component={Link}
              to="/team"
              className="p-5 transition-colors hover:border-secondary-500/40"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-secondary-500/10">
                <UsersIcon className="size-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-dark-300">
                Team
              </h3>
              <p className="text-sm-plus font-medium text-gray-900 dark:text-dark-50">
                Manage your team members and invitations.
              </p>
            </Card>
          )}

          <Card
            component={Link}
            to="/settings"
            className="p-5 transition-colors hover:border-info/40"
          >
            <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-info/10">
              <Cog6ToothIcon className="size-6 text-info dark:text-info-light" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-dark-300">
              Settings
            </h3>
            <p className="text-sm-plus font-medium text-gray-900 dark:text-dark-50">
              Manage your account and preferences.
            </p>
          </Card>

          {isRootTenant && (
            <Card
              component={Link}
              to="/test-entitlements"
              className="p-5 transition-colors hover:border-success/40"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-success/10">
                <ShieldCheckIcon className="size-6 text-success dark:text-success-light" />
              </div>
              <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-dark-300">
                Test Entitlements
              </h3>
              <p className="text-sm-plus font-medium text-gray-900 dark:text-dark-50">
                Test plan entitlements and verify upgrade flows.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
