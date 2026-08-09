// Import Dependencies
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Squares2X2Icon,
  UsersIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  BoltIcon,
  DocumentTextIcon,
  PhotoIcon,
  GlobeAltIcon,
  StarIcon,
  HeartIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ArrowLeftStartOnRectangleIcon,
  ChevronDownIcon,
  BellIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

// Local Imports
import Logo from "@/assets/appLogo.svg?react";
import LogoType from "@/assets/logotype.svg?react";
import { Avatar, Badge, Button } from "@/components/ui";
import { Search } from "@/components/template/Search";
import { SidebarToggleBtn } from "@/components/shared/SidebarToggleBtn";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { useSidebarContext } from "@/app/contexts/sidebar/context";
import { useBreakpointsContext } from "@/app/contexts/breakpoint/context";
import { messagesApi, announcementsApi, plansApi, bundlesApi } from "@/utils/api";
import { useBranding } from "@/app/contexts/branding/context";
import { isRouteActive } from "@/utils/isRouteActive";

// ----------------------------------------------------------------------

type NavIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface NavItem {
  path: string;
  icon: NavIcon;
  label: string;
  exact?: boolean;
}

// Icon map: maps backend lucide-style icon names to heroicons.
// Used when branding.navItems is populated from backend config.
const iconMap: Record<string, NavIcon> = {
  LayoutDashboard: Squares2X2Icon,
  Users: UsersIcon,
  Settings: Cog6ToothIcon,
  CreditCard: CreditCardIcon,
  FileText: DocumentTextIcon,
  Image: PhotoIcon,
  Globe: GlobeAltIcon,
  Shield: ShieldCheckIcon,
  Zap: BoltIcon,
  Star: StarIcon,
  Heart: HeartIcon,
  BookOpen: BookOpenIcon,
  MessageCircle: ChatBubbleLeftRightIcon,
  HelpCircle: QuestionMarkCircleIcon,
};

// Fallback nav items when branding.navItems is empty.
function buildDefaultNavItems(showTeam: boolean): NavItem[] {
  const items: NavItem[] = [
    { path: "/dashboard", icon: Squares2X2Icon, label: "Dashboard" },
  ];
  if (showTeam) {
    items.push({ path: "/team", icon: UsersIcon, label: "Team" });
  }
  items.push(
    { path: "/plan", icon: CreditCardIcon, label: "Plan" },
    { path: "/settings", icon: Cog6ToothIcon, label: "Settings" },
  );
  return items;
}

// ----------------------------------------------------------------------

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, memberships } = useAuthContext();
  const { currentTenant } = useTenantContext();
  const { branding } = useBranding();
  const { isExpanded: isSidebarExpanded, close: closeSidebar } =
    useSidebarContext();
  const { lgAndDown } = useBreakpointsContext();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [
    latestAnnouncement,
    setLatestAnnouncement,
  ] = useState<{ id: string; title: string } | null>(null);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState("");
  const [showCredits, setShowCredits] = useState(false);
  const [tenantCredits, setTenantCredits] = useState(0);
  const [hasBundles, setHasBundles] = useState(false);
  const [showTeam, setShowTeam] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const tenantRef = useRef<HTMLDivElement>(null);

  const isRootTenant =
    currentTenant?.isRoot || memberships.some((m) => m.isRoot);

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

  // Fetch unread messages, announcements, plans (for credits/team info),
  // and bundles (for buy-credits routing).
  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.allSettled([
      messagesApi.unreadCount(),
      announcementsApi.list(),
      plansApi.list(),
      bundlesApi.list(),
    ]).then(([messagesResult, announcementsResult, plansResult, bundlesResult]) => {
      if (messagesResult.status === "fulfilled") {
        setUnreadCount(messagesResult.value.count);
      }
      if (announcementsResult.status === "fulfilled") {
        const anns = announcementsResult.value.announcements || [];
        const published = anns.filter((a) => a.isPublished);
        if (published.length > 0) {
          const latest = published[0];
          setLatestAnnouncement({ id: latest.id, title: latest.title });
          setDismissedAnnouncement(
            localStorage.getItem("dismissed_announcement") || "",
          );
        }
      }
      if (plansResult.status === "fulfilled") {
        const data = plansResult.value;
        const hasCredits = data.plans.some(
          (p) => p.usageCreditsPerMonth > 0 || p.bonusCredits > 0,
        );
        setShowCredits(hasCredits);
        setTenantCredits(data.tenantSubscriptionCredits + data.tenantPurchasedCredits);
        setShowTeam(data.maxPlanUserLimit !== 1);
      }
      if (bundlesResult.status === "fulfilled") {
        setHasBundles(bundlesResult.value.bundles.length > 0);
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  // Build nav items from branding config or fallback to defaults.
  // Matches original lastsaas logic: branding.navItems takes priority,
  // filtered by visible + showTeam, sorted by sortOrder.
  const navItems: NavItem[] = (() => {
    const brandingNav = branding.navItems;
    if (brandingNav && brandingNav.length > 0) {
      return brandingNav
        .filter((item) => item.visible)
        .filter((item) => {
          if (item.id === "team" && !showTeam) return false;
          return true;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          path: item.target,
          icon: iconMap[item.icon] || DocumentTextIcon,
          label: item.label,
        }));
    }
    return buildDefaultNavItems(showTeam);
  })();

  // Click-outside handler for the user and tenant dropdown menus.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (tenantRef.current && !tenantRef.current.contains(e.target as Node)) {
        setShowTenantMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const showAnnouncement =
    !!latestAnnouncement && latestAnnouncement.id !== dismissedAnnouncement;

  return (
    <>
      {/* ============================================================= */}
      {/* Header — Tailux Sideblock style                                */}
      {/* ============================================================= */}
      <header className="app-header transition-content sticky top-0 z-20 flex h-[65px] items-center gap-1 border-b border-gray-200 bg-white/80 px-(--margin-x) backdrop-blur-sm backdrop-saturate-150 dark:border-dark-600 dark:bg-dark-900/80">
        {/* Mobile sidebar toggle (hamburger) */}
        <div className="contents xl:hidden">
          <SidebarToggleBtn />
        </div>

        {/* Mobile-only compact logo (desktop sidebar shows the full logo) */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 xl:hidden"
          aria-label="lastsaas home"
        >
          <Logo className="size-8 text-primary-600 dark:text-primary-400" />
        </Link>

          {/* Search bar — Tailux Sideblock Header pattern */}
          <div className="hidden flex-1 sm:block">
            <Search
              renderButton={(open: () => void) => (
                <button
                  onClick={open}
                  className="flex items-center gap-4 outline-hidden max-sm:hidden"
                >
                  <div className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="size-5" />
                    <span>Search here...</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="20"
                    aria-hidden="true"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      d="M3.5.5h12c1.7 0 3 1.3 3 3v13c0 1.7-1.3 3-3 3h-12c-1.7 0-3-1.3-3-3v-13c0-1.7 1.3-3 3-3z"
                      opacity="0.4"
                    />
                    <path
                      fill="currentColor"
                      d="M11.8 6L8 15.1h-.9L10.8 6h1z"
                    />
                  </svg>
                </button>
              )}
            />
          </div>

          {/* Tenant switcher */}
          {memberships.length > 1 && (
          <div ref={tenantRef} className="relative">
            <button
              onClick={() => setShowTenantMenu((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-300/10"
            >
              <span className="max-w-[10rem] truncate">
                {currentTenant?.tenantName || "Select Tenant"}
              </span>
              <ChevronDownIcon className="size-4 text-gray-400" />
            </button>
            {showTenantMenu && (
              <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-soft dark:border-dark-600 dark:bg-dark-700">
                {memberships.map((m) => (
                  <button
                    key={m.tenantId}
                    onClick={() => {
                      localStorage.setItem("lastsaas_tenant_id", m.tenantId);
                      window.location.reload();
                    }}
                    className="flex w-full flex-col items-start px-4 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-dark-600"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {m.tenantName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-dark-300">
                      {m.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {/* Search bar — mobile icon button */}
          <div className="sm:hidden">
            <Search
              renderButton={(open: () => void) => (
                <Button
                  onClick={open}
                  variant="flat"
                  isIcon
                  className="size-9 rounded-full"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="size-5" />
                </Button>
              )}
            />
          </div>

          {/* Credits indicator — conditional, matches original lastsaas pattern.
              Navigates to /buy-credits if bundles exist, else /plan. */}
          {showCredits && (
            <button
              onClick={() => navigate(hasBundles ? "/buy-credits" : "/plan")}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-300/10"
              title="Usage credits"
            >
              <BoltIcon className="size-4 text-primary-600 dark:text-primary-400" />
              <span>{tenantCredits.toLocaleString()}</span>
            </button>
          )}

          {/* Messages bell */}
          <Link
            to="/messages"
            className="relative flex size-9 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-300/10"
            aria-label="Messages"
          >
            <BellIcon className="size-5 stroke-[1.5]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold leading-4 text-white">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Admin link */}
          {isRootTenant && (
            <Link
              to="/last"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-300/10"
            >
              <ShieldCheckIcon className="size-5 stroke-[1.5]" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* User menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 transition-colors ltr:pl-1 ltr:pr-2 rtl:pr-1 rtl:pl-2 hover:bg-gray-100 dark:hover:bg-dark-300/10"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              <Avatar
                size={9}
                name={user?.displayName || "U"}
                initialColor="primary"
                classNames={{ display: "rounded-full" }}
              />
              <span className="hidden text-sm font-medium text-gray-800 sm:inline dark:text-dark-100">
                {user?.displayName}
              </span>
              <ChevronDownIcon className="size-4 text-gray-400" />
            </button>
            {showUserMenu && (
              <div className="absolute top-full right-0 z-50 mt-1 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-soft dark:border-dark-600 dark:bg-dark-700">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-dark-600">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {user?.displayName}
                  </div>
                  <div className="truncate text-xs text-gray-500 dark:text-dark-300">
                    {user?.email}
                  </div>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100 dark:text-dark-100 dark:hover:bg-dark-600"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-error transition-colors hover:bg-gray-100 dark:hover:bg-dark-600"
                >
                  <ArrowLeftStartOnRectangleIcon className="size-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Announcement banner */}
      {showAnnouncement && latestAnnouncement && (
        <div className="relative bg-primary-600 px-(--margin-x) py-2 text-center text-sm text-white">
          <MegaphoneIcon className="mr-2 inline size-4" />
          {latestAnnouncement.title}
          <button
            onClick={() => {
              localStorage.setItem(
                "dismissed_announcement",
                latestAnnouncement.id,
              );
              setDismissedAnnouncement(latestAnnouncement.id);
            }}
            className="absolute top-1/2 ltr:right-4 rtl:left-4 -translate-y-1/2 hover:opacity-70"
            aria-label="Dismiss announcement"
          >
            ✕
          </button>
        </div>
      )}

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
              <Link to="/dashboard" aria-label="lastsaas home">
                <Logo className="size-10 text-primary-600 dark:text-primary-400" />
              </Link>
              <LogoType className="h-5 w-auto text-gray-800 dark:text-dark-50" />
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

          {/* Sidebar nav — flat list from branding.navItems or defaults.
              No group titles (matches original lastsaas pattern). */}
          <nav className="hide-scrollbar flex-1 space-y-1 overflow-y-auto px-2 py-4">
            {navItems.map((item) => (
              <AppNavItem
                key={item.path}
                item={item}
                pathname={location.pathname}
                unreadCount={
                  item.path === "/messages" ? unreadCount : 0
                }
                onNavigate={() => lgAndDown && closeSidebar()}
              />
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

interface AppNavItemProps {
  item: NavItem;
  pathname: string;
  unreadCount: number;
  onNavigate: () => void;
}

function AppNavItem({
  item,
  pathname,
  unreadCount,
  onNavigate,
}: AppNavItemProps) {
  const Icon = item.icon;
  const isActive = item.exact
    ? pathname === item.path
    : isRouteActive(item.path, pathname);

  return (
    <div className="relative flex px-1">
      <NavLink
        to={item.path}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={clsx(
          "group min-w-0 flex-1 rounded-md px-3 py-2 font-medium outline-hidden transition-colors ease-in-out",
          isActive
            ? "bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400"
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
      </NavLink>
    </div>
  );
}
