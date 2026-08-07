// Import Dependencies
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  CommandLineIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Local Imports
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { bootstrapApi } from "@/utils/api";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/BootstrapPage.tsx`.
// ----------------------------------------------------------------------

export default function SetupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleCheckAgain = async () => {
    setChecking(true);
    try {
      const data = await bootstrapApi.status();
      if (data.initialized) {
        navigate("/login");
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500">
            <CommandLineIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold">System Setup Required</h1>
          <p className="mt-2 text-gray-500 dark:text-dark-300">
            Run the following command to create your initial admin account:
          </p>
        </div>

        <Card className="space-y-5 p-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm dark:border-dark-600 dark:bg-dark-600">
            <div className="mb-1 text-gray-400 dark:text-dark-300">$</div>
            <div className="text-primary-600 dark:text-primary-400">
              cd backend && go run ./cmd/lastsaas setup
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-dark-300">
            This will walk you through creating your organization and root
            administrator account. Once complete, click the button below to
            continue to login.
          </p>

          <div className="space-y-1 text-xs text-gray-400 dark:text-dark-400">
            <p>Other useful commands:</p>
            <p className="ml-2 font-mono">go run ./cmd/lastsaas status</p>
            <p className="ml-2 font-mono">
              go run ./cmd/lastsaas change-password --email you@example.com
            </p>
          </div>

          <Button
            onClick={handleCheckAgain}
            disabled={checking}
            color="primary"
            variant="filled"
            className="h-10 w-full"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${checking ? "animate-spin" : ""}`}
            />
            {checking ? "Checking..." : "Check Again"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
