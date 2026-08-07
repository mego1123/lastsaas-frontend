import { RouteObject } from "react-router";

/**
 * lastsaas public routes configuration
 * These routes are accessible without authentication
 */
const publicRoutes: RouteObject = {
  id: "public",
  children: [
    // Landing page
    {
      path: "/",
      lazy: async () => ({
        Component: (await import("@/app/pages/public/landing")).default,
      }),
    },
    // Custom public pages
    {
      path: "/p/:slug",
      lazy: async () => ({
        Component: (await import("@/app/pages/public/custom")).default,
      }),
    },
    // Auth routes
    {
      path: "/login",
      lazy: async () => ({
        Component: (await import("@/app/pages/auth/login")).default,
      }),
    },
    {
      path: "/signup",
      lazy: async () => ({
        Component: (await import("@/app/pages/auth/signup")).default,
      }),
    },
    {
      path: "/verify-email",
      lazy: async () => ({
        Component: (await import("@/app/pages/auth/verify-email")).default,
      }),
    },
    {
      path: "/forgot-password",
      lazy: async () => ({
        Component: (await import("@/app/pages/auth/forgot-password")).default,
      }),
    },
    {
      path: "/reset-password",
      lazy: async () => ({
        Component: (await import("@/app/pages/auth/reset-password")).default,
      }),
    },
    {
      path: "/auth/callback",
      lazy: async () => ({
        Component: (await import("@/app/pages/auth/callback")).default,
      }),
    },
    {
      path: "/auth/mfa",
      lazy: async () => ({
        Component: (await import("@/app/pages/auth/mfa-challenge")).default,
      }),
    },
    {
      path: "/auth/magic-link",
      lazy: async () => ({
        Component: (await import("@/app/pages/auth/magic-link-verify")).default,
      }),
    },
    // Bootstrap (initial setup)
    {
      path: "/setup",
      lazy: async () => ({
        Component: (await import("@/app/pages/public/bootstrap")).default,
      }),
    },
  ],
};

export default publicRoutes;
