// Import Dependencies
import { useEffect, useRef, useState } from "react";
import {
  PaintBrushIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentTextIcon,
  PhotoIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Form/Input";
import { Select } from "@/components/ui/Form/Select";
import { Textarea } from "@/components/ui/Form/Textarea";
import { Checkbox } from "@/components/ui/Form/Checkbox";
import { Table, TBody, THead, Tr, Th, Td } from "@/components/ui/Table";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { brandingApi, brandingAdminApi } from "@/utils/api";
import { useBranding } from "@/app/contexts/branding/context";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { getErrorMessage } from "@/utils/errors";
import type {
  BrandingConfig,
  NavItem,
  MediaItem,
  CustomPage,
} from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/BrandingPage.tsx`.
// ----------------------------------------------------------------------

type Tab = "identity" | "theme" | "content" | "pages" | "media";

const inputClass =
  "form-input w-full text-sm";
const disabledInputClass =
  "form-input w-full cursor-not-allowed text-sm opacity-60";

export default function BrandingPage() {
  const { reload } = useBranding();
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role;
  const isOwner = role === "owner";
  const [tab, setTab] = useState<Tab>("identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<BrandingConfig | null>(null);

  // Media state
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Pages state
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<CustomPage> | null>(
    null,
  );
  const [pageSaving, setPageSaving] = useState(false);

  useEffect(() => {
    brandingApi
      .get()
      .then((data) => setConfig(data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "media") loadMedia();
    if (tab === "pages") loadPages();
  }, [tab]);

  const loadMedia = () => {
    setMediaLoading(true);
    brandingAdminApi
      .listMedia()
      .then((data) => setMedia(data.media))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setMediaLoading(false));
  };

  const loadPages = () => {
    setPagesLoading(true);
    brandingAdminApi
      .listPages()
      .then((data) => setPages(data.pages))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setPagesLoading(false));
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await brandingAdminApi.update(config);
      await reload();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const handleAssetUpload = async (
    key: "logo" | "favicon",
    file: File,
  ) => {
    try {
      await brandingAdminApi.uploadAsset(key, file);
      // Refresh branding to get new URLs
      const data = await brandingApi.get();
      setConfig(data);
      await reload();
    } catch {
      // error
    }
  };

  const handleAssetDelete = async (key: "logo" | "favicon") => {
    try {
      await brandingAdminApi.deleteAsset(key);
      const data = await brandingApi.get();
      setConfig(data);
      await reload();
    } catch {
      // error
    }
  };

  const handleMediaUpload = async (file: File) => {
    setUploading(true);
    try {
      await brandingAdminApi.uploadMedia(file);
      loadMedia();
    } catch {
      // error
    } finally {
      setUploading(false);
    }
  };

  const handleMediaDelete = async (key: string) => {
    try {
      await brandingAdminApi.deleteMedia(key);
      setMedia((prev) => prev.filter((m) => m.key !== key));
    } catch {
      // error
    }
  };

  const handlePageSave = async () => {
    if (!editingPage) return;
    setPageSaving(true);
    try {
      if (editingPage.id) {
        await brandingAdminApi.updatePage(editingPage.id, editingPage);
      } else {
        await brandingAdminApi.createPage(editingPage);
      }
      setEditingPage(null);
      loadPages();
      await reload();
    } catch {
      // error
    } finally {
      setPageSaving(false);
    }
  };

  const handlePageDelete = async (id: string) => {
    try {
      await brandingAdminApi.deletePage(id);
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // error
    }
  };

  const update = (field: string, value: unknown) => {
    setConfig((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateNavItem = (
    index: number,
    field: keyof NavItem,
    value: unknown,
  ) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const items = [...(prev.navItems ?? [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, navItems: items };
    });
  };

  const addNavItem = () => {
    setConfig((prev) => {
      if (!prev) return prev;
      const newItem: NavItem = {
        id: `custom_${Date.now()}`,
        label: "New Page",
        icon: "FileText",
        target: "/p/",
        isBuiltIn: false,
        visible: true,
        sortOrder: prev.navItems?.length ?? 0,
      };
      return { ...prev, navItems: [...(prev.navItems ?? []), newItem] };
    });
  };

  const removeNavItem = (index: number) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const items = (prev.navItems ?? []).filter((_, i) => i !== index);
      return { ...prev, navItems: items };
    });
  };

  if (loading) {
    return (
      <Page title="Branding">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="flex justify-center py-20">
            <Spinner className="h-8 w-8" color="primary" />
          </div>
        </div>
      </Page>
    );
  }
  if (!config) {
    return (
      <Page title="Branding">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="py-20 text-center text-gray-500 dark:text-dark-300">
            Failed to load branding config.
          </div>
        </div>
      </Page>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      key: "identity",
      label: "Identity",
      icon: GlobeAltIcon,
    },
    {
      key: "theme",
      label: "Theme",
      icon: PaintBrushIcon,
    },
    {
      key: "content",
      label: "Content",
      icon: DocumentTextIcon,
    },
    {
      key: "pages",
      label: "Pages",
      icon: DocumentTextIcon,
    },
    { key: "media", label: "Media", icon: PhotoIcon },
  ];

  return (
    <Page title="Branding">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Branding
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Customize the look and feel of your app
            </p>
          </div>
          {isOwner && (
            <Button
              onClick={handleSave}
              disabled={saving}
              color="primary"
              variant="filled"
            >
              {saved ? (
                <>
                  <CheckIcon className="h-4 w-4" /> Saved
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </div>

        {/* Tabs — Exchange-style segmented toggle (from dashboards/crypto-1) */}
        <div className="mb-6">
          <SegmentedToggle
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            options={tabs.map((t) => ({
              value: t.key,
              label: t.label,
              Icon: t.icon,
            }))}
          />
        </div>

        {/* Identity Tab */}
        {tab === "identity" && (
          <div className="space-y-6">
            <Section title="App Identity">
              <Field
                label="App Name"
                description="Replaces 'LastSaaS' everywhere in the app"
              >
                <Input
                  value={config.appName ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    update("appName", e.target.value)
                  }
                  className={isOwner ? inputClass : disabledInputClass}
                  disabled={!isOwner}
                  placeholder="My App"
                />
              </Field>
              <Field label="Tagline">
                <Input
                  value={config.tagline ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    update("tagline", e.target.value)
                  }
                  className={isOwner ? inputClass : disabledInputClass}
                  disabled={!isOwner}
                  placeholder="Your tagline here"
                />
              </Field>
            </Section>

            <Section title="Logo">
              <Field
                label="Logo Mode"
                description="How the logo is displayed in the header"
              >
                <Select
                  value={config.logoMode ?? "text"}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    update("logoMode", e.target.value)
                  }
                  className={isOwner ? inputClass : disabledInputClass}
                  disabled={!isOwner}
                  data={[
                    {
                      label: "Text only (app name)",
                      value: "text",
                    },
                    { label: "Image only", value: "image" },
                    { label: "Image + text", value: "both" },
                  ]}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <AssetUploader
                  label="Logo Image"
                  currentUrl={config.logoUrl ?? ""}
                  onUpload={(f) => handleAssetUpload("logo", f)}
                  onDelete={() => handleAssetDelete("logo")}
                  isOwner={isOwner}
                />
                <AssetUploader
                  label="Favicon"
                  currentUrl={config.faviconUrl ?? ""}
                  onUpload={(f) => handleAssetUpload("favicon", f)}
                  onDelete={() => handleAssetDelete("favicon")}
                  isOwner={isOwner}
                />
              </div>
            </Section>

            <Section title="Auth Pages">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Login Heading">
                  <Input
                    value={config.loginHeading ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      update("loginHeading", e.target.value)
                    }
                    className={isOwner ? inputClass : disabledInputClass}
                    disabled={!isOwner}
                    placeholder="Welcome back"
                  />
                </Field>
                <Field label="Login Subtext">
                  <Input
                    value={config.loginSubtext ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      update("loginSubtext", e.target.value)
                    }
                    className={isOwner ? inputClass : disabledInputClass}
                    disabled={!isOwner}
                    placeholder="Sign in to your account"
                  />
                </Field>
                <Field label="Signup Heading">
                  <Input
                    value={config.signupHeading ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      update("signupHeading", e.target.value)
                    }
                    className={isOwner ? inputClass : disabledInputClass}
                    disabled={!isOwner}
                    placeholder="Create your account"
                  />
                </Field>
                <Field label="Signup Subtext">
                  <Input
                    value={config.signupSubtext ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      update("signupSubtext", e.target.value)
                    }
                    className={isOwner ? inputClass : disabledInputClass}
                    disabled={!isOwner}
                    placeholder="Get started"
                  />
                </Field>
              </div>
            </Section>
          </div>
        )}

        {/* Theme Tab */}
        {tab === "theme" && (
          <div className="space-y-6">
            <Section
              title="Colors"
              description="Set your brand colors. The primary color generates a full shade palette automatically."
            >
              <div className="grid grid-cols-2 gap-4">
                <ColorField
                  label="Primary Color"
                  value={config.primaryColor ?? ""}
                  onChange={(v) => update("primaryColor", v)}
                  isOwner={isOwner}
                />
                <ColorField
                  label="Accent Color"
                  value={config.accentColor ?? ""}
                  onChange={(v) => update("accentColor", v)}
                  isOwner={isOwner}
                />
              </div>
            </Section>

            <Section title="Typography">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Body Font Family"
                  description="Google Fonts name (e.g., 'Inter', 'Roboto')"
                >
                  <Input
                    value={config.fontFamily ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      update("fontFamily", e.target.value)
                    }
                    className={isOwner ? inputClass : disabledInputClass}
                    disabled={!isOwner}
                    placeholder="Inter"
                  />
                </Field>
                <Field label="Heading Font Family">
                  <Input
                    value={config.headingFont ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      update("headingFont", e.target.value)
                    }
                    className={isOwner ? inputClass : disabledInputClass}
                    disabled={!isOwner}
                    placeholder="Same as body"
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Custom CSS"
              description="Injected after theme variables. Power users can fine-tune anything."
            >
              <Textarea
                value={config.customCss ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  update("customCss", e.target.value)
                }
                className={`font-mono text-xs ${isOwner ? inputClass : disabledInputClass}`}
                disabled={!isOwner}
                rows={10}
                placeholder="/* Custom CSS */"
              />
            </Section>

            <Section
              title="Custom <head> HTML"
              description="Additional HTML injected into the document head (meta tags, scripts, etc.)"
            >
              <Textarea
                value={config.headHtml ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  update("headHtml", e.target.value)
                }
                className={`font-mono text-xs ${isOwner ? inputClass : disabledInputClass}`}
                disabled={!isOwner}
                rows={8}
                placeholder="<!-- Custom head HTML -->"
              />
            </Section>
          </div>
        )}

        {/* Content Tab */}
        {tab === "content" && (
          <div className="space-y-6">
            <Section
              title="Landing Page"
              description="Public page at / for unauthenticated visitors. When disabled, visitors are redirected to the login page."
            >
              <Field label="Enable Landing Page">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={!!config.landingEnabled}
                    onChange={(
                      e: React.ChangeEvent<HTMLInputElement>,
                    ) => update("landingEnabled", e.target.checked)}
                    disabled={!isOwner}
                  />
                  <span className="text-sm text-gray-500 dark:text-dark-300">
                    Show landing page instead of redirecting to login
                  </span>
                </label>
              </Field>
              {config.landingEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Page Title (SEO)">
                      <Input
                        value={config.landingTitle ?? ""}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>,
                        ) => update("landingTitle", e.target.value)}
                        className={
                          isOwner ? inputClass : disabledInputClass
                        }
                        disabled={!isOwner}
                        placeholder="My App - Get Started"
                      />
                    </Field>
                    <Field label="Meta Description (SEO)">
                      <Input
                        value={config.landingMeta ?? ""}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>,
                        ) => update("landingMeta", e.target.value)}
                        className={
                          isOwner ? inputClass : disabledInputClass
                        }
                        disabled={!isOwner}
                        placeholder="Description for search engines"
                      />
                    </Field>
                  </div>
                  <Field label="Landing Page HTML">
                    <Textarea
                      value={config.landingHtml ?? ""}
                      onChange={(
                        e: React.ChangeEvent<HTMLTextAreaElement>,
                      ) => update("landingHtml", e.target.value)}
                      className={`font-mono text-xs ${isOwner ? inputClass : disabledInputClass}`}
                      disabled={!isOwner}
                      rows={16}
                      placeholder="<div>Your landing page HTML here...</div>"
                    />
                  </Field>
                </>
              )}
            </Section>

            <Section
              title="Dashboard HTML"
              description="Custom HTML block shown on the user dashboard."
            >
              <Textarea
                value={config.dashboardHtml ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  update("dashboardHtml", e.target.value)
                }
                className={`font-mono text-xs ${isOwner ? inputClass : disabledInputClass}`}
                disabled={!isOwner}
                rows={10}
                placeholder="<div>Welcome message, announcements, etc.</div>"
              />
            </Section>

            <Section
              title="Open Graph"
              description="Default social sharing image."
            >
              <Field label="OG Image URL">
                <Input
                  value={config.ogImageUrl ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    update("ogImageUrl", e.target.value)
                  }
                  className={isOwner ? inputClass : disabledInputClass}
                  disabled={!isOwner}
                  placeholder="https://..."
                />
              </Field>
            </Section>

            <Section
              title="Navigation"
              description="Configure which items appear in the app sidebar. Built-in items can be hidden but not removed. Custom items link to your custom pages."
            >
              <div className="space-y-2">
                {(config.navItems ?? []).map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-600 dark:bg-dark-600/50"
                  >
                    <input
                      value={item.label}
                      onChange={(e) =>
                        updateNavItem(i, "label", e.target.value)
                      }
                      className={`w-32 rounded border px-2 py-1 text-sm ${
                        !isOwner || item.isBuiltIn
                          ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-dark-600 dark:bg-dark-600/50 dark:text-dark-400"
                          : "border-gray-300 bg-white text-gray-900 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-100"
                      }`}
                      disabled={!isOwner || item.isBuiltIn}
                    />
                    <select
                      value={item.icon}
                      onChange={(e) =>
                        updateNavItem(i, "icon", e.target.value)
                      }
                      className={`w-40 rounded border px-2 py-1 text-sm ${
                        !isOwner
                          ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-dark-600 dark:bg-dark-600/50 dark:text-dark-400"
                          : "border-gray-300 bg-white text-gray-900 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-100"
                      }`}
                      disabled={!isOwner}
                    >
                      <option value="LayoutDashboard">Dashboard</option>
                      <option value="Users">Users</option>
                      <option value="CreditCard">Credit Card</option>
                      <option value="Settings">Settings</option>
                      <option value="FileText">Document</option>
                      <option value="Image">Image</option>
                      <option value="Globe">Globe</option>
                      <option value="Shield">Shield</option>
                      <option value="Zap">Zap</option>
                      <option value="Star">Star</option>
                      <option value="Heart">Heart</option>
                      <option value="BookOpen">Book</option>
                      <option value="MessageCircle">Chat</option>
                      <option value="HelpCircle">Help</option>
                    </select>
                    {!item.isBuiltIn && (
                      <input
                        value={item.target}
                        onChange={(e) =>
                          updateNavItem(i, "target", e.target.value)
                        }
                        className={`flex-1 rounded border px-2 py-1 font-mono text-sm ${
                          !isOwner
                            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-dark-600 dark:bg-dark-600/50 dark:text-dark-400"
                            : "border-gray-300 bg-white text-gray-900 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-100"
                        }`}
                        disabled={!isOwner}
                        placeholder="/p/my-page"
                      />
                    )}
                    {item.isBuiltIn && (
                      <span className="flex-1 font-mono text-xs text-gray-400 dark:text-dark-400">
                        {item.target}
                      </span>
                    )}
                    {isOwner ? (
                      <button
                        onClick={() =>
                          updateNavItem(i, "visible", !item.visible)
                        }
                        className={`rounded p-1 ${
                          item.visible
                            ? "text-success"
                            : "text-gray-300 dark:text-dark-400"
                        }`}
                        title={item.visible ? "Visible" : "Hidden"}
                      >
                        {item.visible ? (
                          <EyeIcon className="h-4 w-4" />
                        ) : (
                          <EyeSlashIcon className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <span
                        className={`p-1 ${
                          item.visible
                            ? "text-success"
                            : "text-gray-300 dark:text-dark-400"
                        }`}
                      >
                        {item.visible ? (
                          <EyeIcon className="h-4 w-4" />
                        ) : (
                          <EyeSlashIcon className="h-4 w-4" />
                        )}
                      </span>
                    )}
                    {isOwner && !item.isBuiltIn && (
                      <button
                        onClick={() => removeNavItem(i)}
                        className="p-1 text-error hover:text-error-light"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isOwner && (
                <Button
                  variant="flat"
                  color="primary"
                  onClick={addNavItem}
                  className="mt-3 text-sm"
                >
                  <PlusIcon className="h-4 w-4" /> Add Custom Nav Item
                </Button>
              )}
            </Section>
          </div>
        )}

        {/* Pages Tab */}
        {tab === "pages" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-dark-300">
                Custom pages are served at /p/slug and can be linked from
                navigation.
              </p>
              {isOwner && (
                <Button
                  onClick={() =>
                    setEditingPage({
                      title: "",
                      slug: "",
                      htmlBody: "",
                      isPublished: false,
                      sortOrder: pages.length,
                    })
                  }
                  color="primary"
                  variant="filled"
                  className="text-sm"
                >
                  <PlusIcon className="h-4 w-4" /> New Page
                </Button>
              )}
            </div>

            {pagesLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="h-8 w-8" color="primary" />
              </div>
            ) : (
              <Card className="mt-3">
                {pages.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 dark:text-dark-300">
                    No custom pages yet.
                  </div>
                ) : (
                  <Table hoverable className="w-full">
                    <THead>
                      <Tr>
                        <Th>Title</Th>
                        <Th>Slug</Th>
                        <Th>Status</Th>
                        {isOwner && <Th className="text-right">Actions</Th>}
                      </Tr>
                    </THead>
                    <TBody>
                      {pages.map((page) => (
                        <Tr key={page.id}>
                          <Td>
                            {page.title}
                          </Td>
                          <Td className="font-mono">
                            /p/{page.slug}
                          </Td>
                          <Td>
                            <Badge
                              color={
                                page.isPublished ? "success" : "neutral"
                              }
                              variant="soft"
                            >
                              {page.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </Td>
                          {isOwner && (
                            <Td className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outlined"
                                  color="neutral"
                                  onClick={() => setEditingPage(page)}
                                  className="text-xs"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handlePageDelete(page.id)}
                                  className="text-xs"
                                >
                                  Delete
                                </Button>
                              </div>
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                )}
              </Card>
            )}

            {/* Page Editor Modal */}
            {isOwner && editingPage && (
              <Transition
                appear
                show
                as={Dialog}
                onClose={() => setEditingPage(null)}
                className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
              >
                <TransitionChild
                  as="div"
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
                />
                <TransitionChild
                  as={DialogPanel}
                  className="scrollbar-sm relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
                      {editingPage.id ? "Edit Page" : "New Page"}
                    </h3>
                    <Button
                      isIcon
                      variant="flat"
                      color="neutral"
                      onClick={() => setEditingPage(null)}
                      aria-label="Close"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <Field label="Title">
                      <Input
                        value={editingPage.title || ""}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>,
                        ) =>
                          setEditingPage((p) =>
                            p
                              ? { ...p, title: e.target.value }
                              : p,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field
                      label="Slug"
                      description="URL will be /p/your-slug"
                    >
                      <Input
                        value={editingPage.slug || ""}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>,
                        ) =>
                          setEditingPage((p) =>
                            p
                              ? { ...p, slug: e.target.value }
                              : p,
                          )
                        }
                        className={`${inputClass} font-mono`}
                        placeholder="my-page"
                      />
                    </Field>
                    <Field label="HTML Body">
                      <Textarea
                        value={editingPage.htmlBody || ""}
                        onChange={(
                          e: React.ChangeEvent<HTMLTextAreaElement>,
                        ) =>
                          setEditingPage((p) =>
                            p
                              ? { ...p, htmlBody: e.target.value }
                              : p,
                          )
                        }
                        className={`${inputClass} font-mono text-xs`}
                        rows={12}
                      />
                    </Field>
                    <Field label="Meta Description (SEO)">
                      <Input
                        value={editingPage.metaDescription || ""}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>,
                        ) =>
                          setEditingPage((p) =>
                            p
                              ? { ...p, metaDescription: e.target.value }
                              : p,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Published">
                      <label className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={editingPage.isPublished || false}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) =>
                            setEditingPage((p) =>
                              p
                                ? {
                                    ...p,
                                    isPublished: e.target.checked,
                                  }
                                : p,
                            )
                          }
                        />
                        <span className="text-sm text-gray-500 dark:text-dark-300">
                          Published and accessible at /p/
                          {editingPage.slug || "..."}
                        </span>
                      </label>
                    </Field>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="outlined"
                        color="neutral"
                        onClick={() => setEditingPage(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePageSave}
                        disabled={pageSaving}
                        color="primary"
                        variant="filled"
                      >
                        {pageSaving ? "Saving..." : "Save Page"}
                      </Button>
                    </div>
                  </div>
                </TransitionChild>
              </Transition>
            )}
          </div>
        )}

        {/* Media Tab */}
        {tab === "media" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-dark-300">
                Upload images and files to use in your landing page, custom
                pages, and dashboard content.
              </p>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,.pdf,.svg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploading}
                    color="primary"
                    variant="filled"
                    className="text-sm"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />{" "}
                    {uploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              )}
            </div>

            {mediaLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="h-8 w-8" color="primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {media.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-gray-200 bg-white py-12 text-center text-gray-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-300">
                    No media files yet. Upload images to use in your
                    content.
                  </div>
                ) : (
                  media.map((item) => (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-700"
                    >
                      {item.contentType.startsWith("image/") ? (
                        <div className="flex aspect-square items-center justify-center bg-gray-50 dark:bg-dark-600">
                          <img
                            src={item.url}
                            alt={item.filename}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-gray-50 dark:bg-dark-600">
                          <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-dark-400" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="truncate text-xs font-medium">
                          {item.filename}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-dark-400">
                          {(item.size / 1024).toFixed(1)} KB
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(item.url)
                            }
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            Copy URL
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleMediaDelete(item.key)}
                              className="text-xs text-error hover:text-error-light"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

// --- Sub-components ---

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
          {description}
        </p>
      )}
      {!description && <div className="mb-4" />}
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {description && (
        <p className="mb-1.5 text-xs text-gray-400 dark:text-dark-400">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  isOwner = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isOwner?: boolean;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#0ea5e9"}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-10 rounded-lg border border-gray-300 bg-transparent dark:border-dark-600 ${
            isOwner ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          }`}
          disabled={!isOwner}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={isOwner ? inputClass : disabledInputClass}
          disabled={!isOwner}
          placeholder="#0ea5e9"
        />
        {isOwner && value && (
          <button
            onClick={() => onChange("")}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </Field>
  );
}

function AssetUploader({
  label,
  currentUrl,
  onUpload,
  onDelete,
  isOwner = true,
}: {
  label: string;
  currentUrl: string;
  onUpload: (file: File) => void;
  onDelete: () => void;
  isOwner?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-gray-50 dark:border-dark-600 dark:bg-dark-600">
            <img
              src={currentUrl}
              alt={label}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-dark-600 dark:bg-dark-600">
            <ArrowUpTrayIcon className="h-5 w-5 text-gray-300 dark:text-dark-400" />
          </div>
        )}
        {isOwner && (
          <div className="flex flex-col gap-1">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {currentUrl ? "Replace" : "Upload"}
            </button>
            {currentUrl && (
              <button
                onClick={onDelete}
                className="text-xs text-error hover:text-error-light"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
