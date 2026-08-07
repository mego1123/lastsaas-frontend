import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_ACCOUNT = "";

const path = (root: string, item: string) => `${root}${item}`;

export const account: NavigationTree = {
  ...baseNavigationObj["account"],
  type: "root",
  childs: [
    {
      id: "account.settings",
      path: path(ROOT_ACCOUNT, "/settings"),
      type: "item",
      title: "Settings",
      icon: "settings",
    },
    {
      id: "account.profile",
      path: path(ROOT_ACCOUNT, "/settings"),
      type: "item",
      title: "Profile",
      icon: "settings",
    },
  ],
};
