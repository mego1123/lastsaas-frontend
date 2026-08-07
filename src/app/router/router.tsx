// Import Dependencies
import { createBrowserRouter, RouteObject } from "react-router";

// Local Imports
import Root from "@/app/layouts/Root";
import RootErrorBoundary from "@/app/pages/errors/RootErrorBoundary";
import { SplashScreen } from "@/components/template/SplashScreen";
import protectedRoutes from "./protected";
import { ghostRoutes } from "./ghost";
import publicRoutes from "./public";

/**
 * Main application router configuration
 * Combines protected, ghost, and public routes under a common root.
 * Uses basename from VITE_BASE_PATH env (set in vite.config.ts base) so
 * the app works when served from a subpath (e.g. /frontend-new/).
 */
const basePath = import.meta.env.BASE_URL.replace(/\/$/, ""); // e.g. "/frontend-new" or ""

const router = createBrowserRouter(
  [
    {
      id: "root",
      Component: Root,
      hydrateFallbackElement: <SplashScreen />,
      ErrorBoundary: RootErrorBoundary,
      children: [protectedRoutes, ghostRoutes, publicRoutes] as RouteObject[],
    },
  ],
  basePath ? { basename: basePath } : undefined,
);

export default router;
