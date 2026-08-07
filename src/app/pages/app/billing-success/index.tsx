// Import Dependencies
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle } from "lucide-react";

// Local Imports
import { Page } from "@/components/shared/Page";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/BillingSuccessPage.tsx` (20 LOC).
// ----------------------------------------------------------------------

export default function BillingSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/plan"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Page title="Payment Successful">
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle className="mb-6 h-16 w-16 text-success" />
        <h2 className="mb-2 text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
          Payment Successful!
        </h2>
        <p className="text-gray-500 dark:text-dark-300">
          Redirecting to your plan...
        </p>
      </div>
    </Page>
  );
}
