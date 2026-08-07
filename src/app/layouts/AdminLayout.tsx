// Import Dependencies
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  Navigate,
  useLocation,
} from "react-router";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UsersIcon,
  BuildingOffice2Icon,
  UserPlusIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  TagIcon,
  MegaphoneIcon,
  HeartIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  KeyIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

// Local Imports
import Logo from "@/assets/appLogo.svg?react";
import LogoType from "@/assets/logotype.svg?react";
import { Badge } from "@/components/ui";
import { SidebarToggleBtn } from "@/components/shared/SidebarToggleBtn";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useSidebarContext } from "@/app/contexts/sidebar/context";
import { useBreakpointsContext } from "@/app/contexts/breakpoint/context";
import { messagesApi } from "@/utils/api";
import { isRouteActive } from "@/utils/isRouteActive";

// ----------------------------------------------------------------------

type NavIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface NavItem {
  path: string;
  icon: NavIcon;
  label: string;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// 16 admin nav items grouped into logical sections.
const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { path: "/last", icon: Squares2X2Icon, label: "Dashboard", exact: true },
      { path: "/last/messages", icon: EnvelopeIcon, label: "Messages" },
    ],
  },
  {
    title: "Users & Tenants",
    items: [
      { path: "/last/users", icon: UsersIcon, label: "Users" },
      { path: "/last/tenants", icon: BuildingOffice2Icon, label: "Tenants" },
      { path: "/last/members", icon: UserPlusIcon, label: "Root Members" },
    ],
  },
  {
    title: "Monetization",
    items: [
      { path: "/last/plans", icon: CreditCardIcon, label: "Plans" },
      { path: "/last/financial", icon: BanknotesIcon, label: "Financial" },
      { path: "/last/promotions", icon: TagIcon, label: "Promotions" },
    ],
  },
  {
    title: "Insights",
    items: [
      { path: "/last/pm", icon: ChartBarIcon, label: "Product" },
      {
        path: "/last/announcements",
        icon: MegaphoneIcon,
        label: "Announcements",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      { path: "/last/health", icon: HeartIcon, label: "System Health" },
      { path: "/last/logs", icon: DocumentTextIcon, label: "Logs" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { path: "/last/config", icon: Cog6ToothIcon, label: "Configuration" },
      { path: "/last/branding", icon: PaintBrushIcon, label: "Branding" },
      { path: "/last/api", icon: KeyIcon, label: "API" },
      { path: "/last/about", icon: InformationCircleIcon, label: "About" },
    ],
  },
];

// ----------------------------------------------------------------------

export default function AdminLayout() {
  const location = useLocation();
  const { user, isInitialized, memberships } = useAuthContext();
  const { isExpanded: isSidebarExpanded, close: closeSidebar } =
    useSidebarContext();
  const { lgAndDown } = useBreakpointsContext();

  const [unreadCount, setUnreadCount] = useState(0);

  // Set the Tailux sideblock data-layout attribute on body so the CSS
  // variable defaults (sidebar width, margin-x) and grid layout apply.
  // useLayoutEffect runs synchronously before paint, avoiding a flash of
  // unstyled content where the sidebar overlaps the main content.
  useLayoutEffect(() => {
    document.body.dataset.layout = "sideblock";
    return () => {
      delete document.body.dataset.layout;
    };
  }, []);

  // Remove the 'preload' class after the layout has painted. This class
  // disables all CSS transitions (see base.css) to prevent the layout flash
  // where content renders full-width then animates to the sidebar-offset
  // position. We use a double requestAnimationFrame to ensure the browser
  // has completed at least one paint cycle with the correct layout before
  // re-enabling transitions.
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        document.body.classList.remove("preload");
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  // Fetch unread admin message count for the sidebar badge.
  useEffect(() => {
    messagesApi
      .unreadCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isRoot =
    memberships.some((m) => m.isRoot) ||
    (user as { isRoot?: boolean }).isRoot ||
    (user as { role?: string }).role === "root";

  if (!isRoot) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {/* ============================================================= */}
      {/* Header — Tailux Sideblock style                                */}
      {/* ============================================================= */}
      <header className="app-header transition-content sticky top-0 z-20 flex h-[65px] items-center gap-1 border-b border-gray-200 bg-white/80 px-(--margin-x) backdrop-blur-sm backdrop-saturate-150 dark:border-dark-600 dark:bg-dark-900/80">
        {/* Mobile sidebar toggle */}
        <div className="contents xl:hidden">
          <SidebarToggleBtn />
        </div>

        {/* Back to App */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-gray-700 transition-colors hover:text-gray-950 dark:text-dark-200 dark:hover:text-dark-50"
        >
          <ArrowLeftIcon className="size-5 stroke-[1.5]" />
          <span className="hidden text-sm font-medium sm:inline">
            Back to App
          </span>
        </Link>

        <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-dark-600" />

        {/* Admin badge */}
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-600 text-white">
            <ShieldCheckIcon className="size-5 stroke-[1.5]" />
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            Admin
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Optional unread admin messages shortcut */}
          <Link
            to="/last/messages"
            className="relative flex size-9 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-300/10"
            aria-label="Admin messages"
          >
            <EnvelopeIcon className="size-5 stroke-[1.5]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold leading-4 text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* ============================================================= */}
      {/* Main content — pages own their padding via px-(--margin-x) pb-8 */}
      {/* ============================================================= */}
      <main className="main-content transition-content grid grid-cols-1">
        <Suspense fallback={null}>
          <Outlet context={{ setUnreadCount }} />
        </Suspense>
      </main>

      {/* ============================================================= */}
      {/* Sidebar panel — Tailux Sideblock pattern                       */}
      {/* ============================================================= */}
      <div className="sidebar-panel border-gray-200 ltr:border-r rtl:border-l dark:border-dark-600/80">
        <div className="flex h-full grow flex-col bg-white dark:bg-dark-900">
          {/* Sidebar header */}
          <header className="relative flex h-[61px] shrink-0 items-center justify-between ltr:pl-6 ltr:pr-3 rtl:pl-3 rtl:pr-6">
            <div className="flex items-center gap-3 pt-3">
              <Link to="/last" aria-label="lastsaas admin">
                <Logo className="size-10 text-primary-600 dark:text-primary-400" />
              </Link>
              <LogoType className="h-5 w-auto text-gray-800 dark:text-dark-50" />
              <Badge color="primary" variant="soft" className="ml-1">
                Admin
              </Badge>
            </div>
            <div className="pt-3 xl:hidden">
              <button
                onClick={closeSidebar}
                className="flex size-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 dark:text-dark-200 dark:hover:bg-dark-600"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>
          </header>

          {/* Sidebar nav */}
          <nav className="hide-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => (
              <div key={group.title} className="pt-3">
                <div className="px-6 pb-1">
                  <span className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-dark-300">
                    {group.title}
                  </span>
                </div>
                {group.items.map((item) => (
                  <AdminNavItem
                    key={item.path}
                    item={item}
                    pathname={location.pathname}
                    unreadCount={
                      item.path === "/last/messages" ? unreadCount : 0
                    }
                    onNavigate={() => lgAndDown && closeSidebar()}
                  />
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile backdrop */}
      {lgAndDown && isSidebarExpanded && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
          aria-hidden="true"
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

interface AdminNavItemProps {
  item: NavItem;
  pathname: string;
  unreadCount: number;
  onNavigate: () => void;
}

function AdminNavItem({
  item,
  pathname,
  unreadCount,
  onNavigate,
}: AdminNavItemProps) {
  const Icon = item.icon;
  // The admin dashboard index route is exact-matched so it doesn't
  // swallow every other /last/* path.
  const isActive = item.exact
    ? pathname === item.path
    : isRouteActive(item.path, pathname);

  return (
    <div className="relative flex px-3">
      <NavLink
        to={item.path}
        onClick={onNavigate}
        end={item.exact}
        aria-current={isActive ? "page" : undefined}
        className={clsx(
          "group min-w-0 flex-1 rounded-md px-3 py-2 font-medium outline-hidden transition-colors ease-in-out",
          isActive
            ? "text-primary-600 dark:text-primary-400"
            : "text-gray-800 hover:bg-gray-100 hover:text-gray-950 focus:bg-gray-100 focus:text-gray-950 dark:text-dark-200 dark:hover:bg-dark-300/10 dark:hover:text-dark-50 dark:focus:bg-dark-300/10",
        )}
      >
        <div className="flex min-w-0 items-center justify-between gap-2 text-xs-plus tracking-wide">
          <div className="flex min-w-0 items-center gap-3">
            <Icon
              className={clsx(
                "size-5 shrink-0 stroke-[1.5]",
                !isActive && "opacity-80 group-hover:opacity-100",
              )}
            />
            <span className="truncate">{item.label}</span>
          </div>
          {unreadCount > 0 && (
            <Badge
              color="error"
              variant="soft"
              className="h-4.5 min-w-[1rem] shrink-0 p-[5px] text-tiny-plus"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
        {isActive && (
          <div className="absolute bottom-1 top-1 w-1 bg-primary-600 dark:bg-primary-400 ltr:left-0 ltr:rounded-r-full rtl:right-0 rtl:rounded-l-lg" />
        )}
      </NavLink>
    </div>
  );
}
