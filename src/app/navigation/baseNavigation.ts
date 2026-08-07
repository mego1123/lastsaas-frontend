import { NavigationTree } from "@/@types/navigation";

export const baseNavigationObj: Record<string, NavigationTree> = {
  app: {
    id: "app",
    type: "item",
    path: "/dashboard",
    title: "App",
    icon: "app",
  },
  admin: {
    id: "admin",
    type: "item",
    path: "/last",
    title: "Admin",
    icon: "admin",
  },
  account: {
    id: "account",
    type: "item",
    path: "/settings",
    title: "Account",
    icon: "account",
  },
};

export const baseNavigation: NavigationTree[] = Array.from(
  Object.values(baseNavigationObj),
);
