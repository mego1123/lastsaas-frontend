// Import Dependencies
import { useQuery } from "@tanstack/react-query";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { adminApi } from "@/utils/api";

// ----------------------------------------------------------------------

export default function AboutPage() {
  const { data: about, isLoading: loading } = useQuery({
    queryKey: ["admin", "about"],
    queryFn: () => adminApi.getAbout(),
    staleTime: 5 * 60 * 1000, // 5 minutes — version info rarely changes
  });

  return (
    <Page title="About">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="mb-8">
          <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            About
          </h2>
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
