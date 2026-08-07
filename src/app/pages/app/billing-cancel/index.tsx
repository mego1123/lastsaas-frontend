// Import Dependencies
import { Link } from "react-router";
import { XCircle } from "lucide-react";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Button } from "@/components/ui/Button";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/BillingCancelPage.tsx` (26 LOC).
// ----------------------------------------------------------------------

export default function BillingCancelPage() {
  return (
    <Page title="Payment Canceled">
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="mb-6 h-16 w-16 text-gray-400 dark:text-dark-400" />
        <h2 className="mb-2 text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
          Payment Canceled
        </h2>
        <p className="mb-6 text-gray-500 dark:text-dark-300">
          No charges were made.
        </p>
        <div className="flex gap-4">
          <Button
            component={Link}
            to="/plan"
            color="primary"
            variant="filled"
            className="h-9 min-w-[8rem]"
          >
            View Plans
          </Button>
          <Button
            component={Link}
            to="/buy-credits"
            variant="outlined"
            color="neutral"
            className="h-9 min-w-[8rem]"
          >
            Buy Credits
          </Button>
        </div>
      </div>
    </Page>
  );
}
