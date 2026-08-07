import { useRouteError, Link } from "react-router";

export default function RootErrorBoundary() {
  const error = useRouteError() as Error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100">500</h1>
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mt-4">
          Something went wrong
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {error?.message || "An unexpected error occurred"}
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
