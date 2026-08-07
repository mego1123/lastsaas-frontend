import { Navigate, RouteObject } from "react-router";

import AuthGuard from "@/middleware/AuthGuard";
import AppLayout from "../layouts/AppLayout";
import AdminLayout from "../layouts/AdminLayout";

const protectedRoutes: RouteObject = {
  id: "protected",
  Component: AuthGuard,
  children: [
    // ════ App Routes (with AppLayout sidebar) ════
    {
      Component: AppLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: "/dashboard",
          lazy: async () => ({ Component: (await import("@/app/pages/app/dashboard")).default }),
        },
        {
          path: "/team",
          lazy: async () => ({ Component: (await import("@/app/pages/app/team")).default }),
        },
        {
          path: "/settings",
          lazy: async () => ({ Component: (await import("@/app/pages/app/settings")).default }),
        },
        {
          path: "/plan",
          lazy: async () => ({ Component: (await import("@/app/pages/app/plan")).default }),
        },
        {
          path: "/buy-credits",
          lazy: async () => ({ Component: (await import("@/app/pages/app/buy-credits")).default }),
        },
        {
          path: "/billing/success",
          lazy: async () => ({ Component: (await import("@/app/pages/app/billing-success")).default }),
        },
        {
          path: "/billing/cancel",
          lazy: async () => ({ Component: (await import("@/app/pages/app/billing-cancel")).default }),
        },
        {
          path: "/activity",
          lazy: async () => ({ Component: (await import("@/app/pages/app/activity")).default }),
        },
        {
          path: "/onboarding",
          lazy: async () => ({ Component: (await import("@/app/pages/app/onboarding")).default }),
        },
        {
          path: "/messages",
          lazy: async () => ({ Component: (await import("@/app/pages/app/messages")).default }),
        },
        {
          path: "/test-entitlements",
          lazy: async () => ({ Component: (await import("@/app/pages/app/test-entitlements")).default }),
        },
      ],
    },

    // ════ Admin Routes (with AdminLayout — separate sidebar, NO AppLayout) ════
    {
      path: "/last",
      Component: AdminLayout,
      children: [
        {
          index: true,
          lazy: async () => ({ Component: (await import("@/app/pages/admin/dashboard")).default }),
        },
        {
          path: "users",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/users")).default }),
        },
        {
          path: "users/:userId",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/user-profile")).default }),
        },
        {
          path: "tenants",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/tenants")).default }),
        },
        {
          path: "tenants/:tenantId",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/tenant-profile")).default }),
        },
        {
          path: "members",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/members")).default }),
        },
        {
          path: "messages",
          lazy: async () => ({ Component: (await import("@/app/pages/app/messages")).default }),
        },
        {
          path: "plans",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/plans")).default }),
        },
        {
          path: "financial",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/financial")).default }),
        },
        {
          path: "pm",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/pm")).default }),
        },
        {
          path: "promotions",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/promotions")).default }),
        },
        {
          path: "announcements",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/announcements")).default }),
        },
        {
          path: "health",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/health")).default }),
        },
        {
          path: "logs",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/logs")).default }),
        },
        {
          path: "config",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/config")).default }),
        },
        {
          path: "api",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/api")).default }),
        },
        {
          path: "branding",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/branding")).default }),
        },
        {
          path: "about",
          lazy: async () => ({ Component: (await import("@/app/pages/admin/about")).default }),
        },
      ],
    },
  ],
};

export default protectedRoutes;
