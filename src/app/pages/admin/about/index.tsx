// Import Dependencies
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { adminApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type { AboutInfo } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/AboutPage.tsx`.
// ----------------------------------------------------------------------

export default function AboutPage() {
  const [about, setAbout] = useState<AboutInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAbout()
      .then(setAbout)
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page title="About">
      <div className="transition-content px-(--margin-x) pb-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-50">
            About
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-8 w-8" color="primary" />
          </div>
        ) : (
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <p className="mb-1 text-sm text-gray-500 dark:text-dark-300">
                  Software
                </p>
                <p className="text-lg font-semibold">LastSaaS</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-500 dark:text-dark-300">
                  Version
                </p>
                <p className="text-lg font-semibold">
                  {about?.version ?? "Unknown"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-500 dark:text-dark-300">
                  Copyright
                </p>
                <p>{about?.copyright}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Page>
  );
}
