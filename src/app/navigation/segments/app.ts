import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_APP = "";

const path = (root: string, item: string) => `${root}${item}`;

export const app: NavigationTree = {
  ...baseNavigationObj["app"],
  type: "root",
  childs: [
    {
      id: "app.dashboard",
      path: path(ROOT_APP, "/dashboard"),
      type: "item",
      title: "Dashboard",
      icon: "dashboard",
    },
    {
      id: "app.team",
      path: path(ROOT_APP, "/team"),
      type: "item",
      title: "Team",
      icon: "team",
    },
    {
      id: "app.plan",
      path: path(ROOT_APP, "/plan"),
      type: "item",
      title: "Plan",
      icon: "plan",
    },
    {
      id: "app.buy-credits",
      path: path(ROOT_APP, "/buy-credits"),
      type: "item",
      title: "Buy Credits",
      icon: "credits",
    },
    {
      id: "app.activity",
      path: path(ROOT_APP, "/activity"),
      type: "item",
      title: "Activity",
      icon: "activity",
    },
    {
      id: "app.messages",
      path: path(ROOT_APP, "/messages"),
      type: "item",
      title: "Messages",
      icon: "messages",
    },
  ],
};
