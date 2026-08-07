import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_ADMIN = "/last";

const path = (root: string, item: string) => `${root}${item}`;

export const admin: NavigationTree = {
  ...baseNavigationObj["admin"],
  type: "root",
  childs: [
    {
      id: "admin.dashboard",
      path: path(ROOT_ADMIN, ""),
      type: "item",
      title: "Dashboard",
      icon: "admin-dashboard",
    },
    {
      id: "admin.users",
      path: path(ROOT_ADMIN, "/users"),
      type: "item",
      title: "Users",
      icon: "users",
    },
    {
      id: "admin.tenants",
      path: path(ROOT_ADMIN, "/tenants"),
      type: "item",
      title: "Tenants",
      icon: "tenants",
    },
    {
      id: "admin.members",
      path: path(ROOT_ADMIN, "/members"),
      type: "item",
      title: "Members",
      icon: "members",
    },
    {
      id: "admin.plans",
      path: path(ROOT_ADMIN, "/plans"),
      type: "item",
      title: "Plans",
      icon: "plans",
    },
    {
      id: "admin.financial",
      path: path(ROOT_ADMIN, "/financial"),
      type: "item",
      title: "Financial",
      icon: "financial",
    },
    {
      id: "admin.promotions",
      path: path(ROOT_ADMIN, "/promotions"),
      type: "item",
      title: "Promotions",
      icon: "promotions",
    },
    {
      id: "admin.announcements",
      path: path(ROOT_ADMIN, "/announcements"),
      type: "item",
      title: "Announcements",
      icon: "announcements",
    },
    {
      id: "admin.health",
      path: path(ROOT_ADMIN, "/health"),
      type: "item",
      title: "Health",
      icon: "health",
    },
    {
      id: "admin.logs",
      path: path(ROOT_ADMIN, "/logs"),
      type: "item",
      title: "Logs",
      icon: "logs",
    },
    {
      id: "admin.config",
      path: path(ROOT_ADMIN, "/config"),
      type: "item",
      title: "Config",
      icon: "config",
    },
    {
      id: "admin.api",
      path: path(ROOT_ADMIN, "/api"),
      type: "item",
      title: "API Keys",
      icon: "api",
    },
    {
      id: "admin.branding",
      path: path(ROOT_ADMIN, "/branding"),
      type: "item",
      title: "Branding",
      icon: "branding",
    },
    {
      id: "admin.about",
      path: path(ROOT_ADMIN, "/about"),
      type: "item",
      title: "About",
      icon: "about",
    },
  ],
};
