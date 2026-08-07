// Import Dependencies
import { useEffect, useState } from "react";
import { Zap, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { bundlesApi, plansApi, billingApi } from "@/utils/api";
import type { CreditBundle } from "@/@types/lastsaas";
import { getErrorMessage } from "@/utils/errors";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/BuyCreditsPage.tsx` (128 LOC).
// ----------------------------------------------------------------------

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BuyCreditsPage() {
  const [bundles, setBundles] = useState<CreditBundle[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([bundlesApi.list(), plansApi.list()])
      .then(([bundleData, planData]) => {
        setBundles(bundleData.bundles);
        setTotalCredits(
          planData.tenantSubscriptionCredits + planData.tenantPurchasedCredits,
        );
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (bundleId: string) => {
    setCheckoutLoading(bundleId);
    try {
      const result = await billingApi.checkout({ bundleId });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch {
      // Error handled by interceptor
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <Page title="Buy Credits">
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" color="primary" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Buy Credits">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Buy Credits
          </h2>
          <p className="mt-1 text-gray-500 dark:text-dark-300">
            Purchase additional usage credits for your account
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 dark:border-dark-600 dark:bg-dark-700">
            <Zap className="h-4 w-4 text-primary-500 dark:text-primary-400" />
            <span className="text-sm text-gray-700 dark:text-dark-200">
              Current balance:{" "}
              <span className="font-semibold text-gray-900 dark:text-dark-50">
                {totalCredits.toLocaleString()}
              </span>{" "}
              credits
            </span>
          </div>
        </div>

        {bundles.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-dark-300">
            No credit bundles are available for purchase at this time.
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              bundles.length === 1
                ? "grid-cols-1"
                : bundles.length === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : bundles.length === 3
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {bundles.map((bundle) => (
              <Card
                key={bundle.id}
                className="p-6 transition-all hover:border-primary-500/40"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-dark-50">
                    {bundle.name}
                  </h3>
                </div>

                <div className="mb-2 flex items-baseline gap-2">
                  <Zap className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-dark-50">
                    {bundle.credits.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-dark-300">
                    credits
                  </span>
                </div>

                <div className="mb-6">
                  <span className="text-xl font-semibold text-primary-500 dark:text-primary-400">
                    {formatPrice(bundle.priceCents)}
                  </span>
                  <span className="ml-1 text-sm text-gray-400 dark:text-dark-400">
                    (
                    {formatPrice(
                      Math.round((bundle.priceCents / bundle.credits) * 100),
                    )}
                    /100 credits)
                  </span>
                </div>

                <Button
                  color="primary"
                  variant="filled"
                  onClick={() => handleBuy(bundle.id)}
                  disabled={checkoutLoading !== null}
                  className="h-10 w-full"
                >
                  {checkoutLoading === bundle.id ? (
                    <Spinner className="h-4 w-4" color="primary" />
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Buy Now
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
