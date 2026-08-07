// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  CodeBracketIcon,
  KeyIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  ShieldCheckIcon,
  UserIcon,
  ExclamationTriangleIcon,
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
import { Checkbox } from "@/components/ui/Form/Checkbox";
import { Table, TBody, THead, Tr, Th, Td } from "@/components/ui/Table";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { adminApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type {
  ApiKey,
  Webhook as WebhookType,
  WebhookDelivery,
  WebhookEventTypeInfo,
} from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/APIPage.tsx`.
// ----------------------------------------------------------------------

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "Never";
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Modal wrapper to reduce repetition
function ModalShell({
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <Transition
      appear
      show
      as={Dialog}
      onClose={onClose}
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
        className={`scrollbar-sm relative max-h-[85vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-700`}
      >
        {children}
      </TransitionChild>
    </Transition>
  );
}

// ─── API Documentation Section ──────────────────────────

function DocsSection() {
  const origin = window.location.origin;
  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <BookOpenIcon className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-dark-300">
          Documentation
        </h2>
      </div>
      <Card className="p-6">
        <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
          Complete API documentation is available in human-readable and
          markdown formats.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`${origin}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-primary-500/20 bg-primary-500/10 px-4 py-2.5 text-sm text-primary-600 transition-colors hover:bg-primary-500/20 dark:text-primary-400"
          >
            <DocumentTextIcon className="h-4 w-4" />
            API Documentation
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
          <a
            href={`${origin}/api/openapi.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-100 dark:hover:bg-dark-500"
          >
            <CodeBracketIcon className="h-4 w-4" />
            OpenAPI JSON
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
          <a
            href={`${origin}/api/swagger.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-100 dark:hover:bg-dark-500"
          >
            <CodeBracketIcon className="h-4 w-4" />
            Swagger JSON
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </Card>
    </div>
  );
}

// ─── API Keys Section ───────────────────────────────────

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (data: { apiKey: ApiKey; rawKey: string }) => void;
}) {
  const [name, setName] = useState("");
  const [authority, setAuthority] = useState<"admin" | "user">("user");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      const data = await adminApi.createAPIKey({
        name: name.trim(),
        authority,
      });
      onCreated(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-dark-600">
        <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">Create API Key</h3>
        <Button
          isIcon
          variant="flat"
          color="neutral"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-4 p-6">
        <Input
          label="Name"
          placeholder="e.g., CI/CD Pipeline"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />
        <Select
          label="Authority Level"
          value={authority}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setAuthority(e.target.value as "admin" | "user")
          }
          data={[
            { label: "User", value: "user" },
            { label: "Admin", value: "admin" },
          ]}
        />
        <p className="text-xs text-gray-500 dark:text-dark-400">
          {authority === "admin"
            ? "Admin keys can access all admin API endpoints (read-only admin actions, not owner-level)."
            : "User keys can access tenant-scoped endpoints. Requires X-Tenant-ID header."}
        </p>
        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
            {error}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 p-6 pt-0">
        <Button variant="outlined" color="neutral" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          color="primary"
          variant="filled"
        >
          {saving ? "Creating..." : "Create Key"}
        </Button>
      </div>
    </ModalShell>
  );
}

function RevealKeyModal({
  rawKey,
  apiKey,
  onClose,
}: {
  rawKey: string;
  apiKey: ApiKey;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-dark-600">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
            <CheckIcon className="h-5 w-5 text-success" />
          </div>
          <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">API Key Created</h3>
        </div>
        <Button
          isIcon
          variant="flat"
          color="neutral"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-4 p-6">
        <p className="text-sm text-gray-500 dark:text-dark-300">
          Your API key{" "}
          <span className="font-medium">{apiKey.name}</span> has been
          created.
        </p>
        <div className="relative">
          <code className="block w-full break-all rounded-lg border border-gray-300 bg-gray-50 p-3 pr-12 font-mono text-sm text-success dark:border-dark-600 dark:bg-dark-600">
            {rawKey}
          </code>
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 rounded-md bg-gray-200 p-1.5 transition-colors hover:bg-gray-300 dark:bg-dark-500 dark:hover:bg-dark-400"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-success" />
            ) : (
              <ClipboardIcon className="h-4 w-4 text-gray-500 dark:text-dark-300" />
            )}
          </button>
        </div>
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
          <p className="text-xs font-medium text-warning">
            This is the only time this key will be shown. Copy it now and
            store it securely.
          </p>
        </div>
        <div className="space-y-1 text-xs text-gray-500 dark:text-dark-400">
          <p>Use this key in your API requests:</p>
          <code className="block rounded bg-gray-50 p-2 font-mono text-gray-500 dark:bg-dark-600 dark:text-dark-300">
            Authorization: Bearer {rawKey.substring(0, 12)}...
          </code>
        </div>
      </div>
      <div className="flex justify-end p-6 pt-0">
        <Button onClick={onClose} color="primary" variant="filled">
          Done
        </Button>
      </div>
    </ModalShell>
  );
}

function APIKeysSection({ canWrite }: { canWrite: boolean }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [revealData, setRevealData] = useState<{
    apiKey: ApiKey;
    rawKey: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchKeys = useCallback(async () => {
    try {
      const data = await adminApi.listAPIKeys();
      setKeys(data.apiKeys);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        const data = await adminApi.listAPIKeys();
        if (!controller.signal.aborted) {
          setKeys(data.apiKeys);
        }
      } catch {
        // ignore
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => controller.abort();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await adminApi.deleteAPIKey(deleteTarget.id);
      setDeleteTarget(null);
      fetchKeys();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyIcon className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-dark-300">
            API Keys
          </h2>
          {!loading && (
            <span className="text-xs text-gray-400 dark:text-dark-400">
              ({keys.length})
            </span>
          )}
        </div>
        {canWrite && (
          <Button
            onClick={() => setShowCreate(true)}
            color="primary"
            variant="filled"
            className="text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Create Key
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" color="primary" />
        </div>
      ) : keys.length === 0 ? (
        <Card className="p-8 text-center">
          <KeyIcon className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-dark-400" />
          <p className="text-sm text-gray-500 dark:text-dark-300">
            {canWrite
              ? "No API keys yet. Create one to get started."
              : "No API keys yet."}
          </p>
        </Card>
      ) : (
        <Card className="mt-3">
          <Table hoverable className="w-full">
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th>Authority</Th>
                <Th>Key</Th>
                <Th>Created</Th>
                <Th>Last Used</Th>
                <Th className="text-right" />
              </Tr>
            </THead>
            <TBody>
              {keys.map((k) => (
                <Tr key={k.id}>
                  <Td>{k.name}</Td>
                  <Td>
                    <Badge
                      color={k.authority === "admin" ? "primary" : "neutral"}
                      variant="soft"
                      className="gap-1"
                    >
                      {k.authority === "admin" ? (
                        <ShieldCheckIcon className="h-3 w-3" />
                      ) : (
                        <UserIcon className="h-3 w-3" />
                      )}
                      {k.authority === "admin" ? "Admin" : "User"}
                    </Badge>
                  </Td>
                  <Td>
                    <code className="font-mono text-xs text-gray-400 dark:text-dark-400">
                      lsk_...{k.keyPreview}
                    </code>
                  </Td>
                  <Td>
                    {formatDate(k.createdAt)}
                  </Td>
                  <Td>
                    {k.lastUsedAt ? timeAgo(k.lastUsedAt) : "Never"}
                  </Td>
                  <Td className="text-right">
                    {canWrite && (
                      <Button
                        isIcon
                        variant="flat"
                        color="error"
                        onClick={() => setDeleteTarget(k)}
                        title="Delete key"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(data) => {
            setShowCreate(false);
            setRevealData(data);
            fetchKeys();
          }}
        />
      )}
      {revealData && (
        <RevealKeyModal
          rawKey={revealData.rawKey}
          apiKey={revealData.apiKey}
          onClose={() => setRevealData(null)}
        />
      )}
      {deleteTarget && (
        <ModalShell onClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }} maxWidth="max-w-md">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error/20">
                <ExclamationTriangleIcon className="h-5 w-5 text-error" />
              </div>
              <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">Delete API Key?</h3>
            </div>
            <p className="mb-2 text-sm text-gray-500 dark:text-dark-300">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget.name}</span>?
            </p>
            <p className="mb-6 text-xs text-gray-400 dark:text-dark-400">
              This action is irreversible. Any applications or scripts
              using this key will immediately lose access.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outlined"
                color="neutral"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                color="error"
                variant="filled"
              >
                {deleting ? "Deleting..." : "Delete Key"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ─── Webhooks Section ───────────────────────────────────

function RevealSecretModal({
  secret,
  webhookName,
  onClose,
}: {
  secret: string;
  webhookName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-dark-600">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
            <CheckIcon className="h-5 w-5 text-success" />
          </div>
          <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">Webhook Created</h3>
        </div>
        <Button
          isIcon
          variant="flat"
          color="neutral"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-4 p-6">
        <p className="text-sm text-gray-500 dark:text-dark-300">
          Signing secret for{" "}
          <span className="font-medium">{webhookName}</span>:
        </p>
        <div className="relative">
          <code className="block w-full break-all rounded-lg border border-gray-300 bg-gray-50 p-3 pr-12 font-mono text-sm text-success dark:border-dark-600 dark:bg-dark-600">
            {secret}
          </code>
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 rounded-md bg-gray-200 p-1.5 transition-colors hover:bg-gray-300 dark:bg-dark-500 dark:hover:bg-dark-400"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-success" />
            ) : (
              <ClipboardIcon className="h-4 w-4 text-gray-500 dark:text-dark-300" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-400">
          Use this secret to verify webhook signatures. You can always view
          or regenerate it from the webhook detail view.
        </p>
      </div>
      <div className="flex justify-end p-6 pt-0">
        <Button onClick={onClose} color="primary" variant="filled">
          Done
        </Button>
      </div>
    </ModalShell>
  );
}

function WebhookFormModal({
  webhook,
  onClose,
  onSaved,
}: {
  webhook?: WebhookType;
  onClose: () => void;
  onSaved: (data: { webhook: WebhookType; secret?: string }) => void;
}) {
  const [name, setName] = useState(webhook?.name || "");
  const [description, setDescription] = useState(
    webhook?.description || "",
  );
  const [url, setUrl] = useState(webhook?.url || "");
  const [events, setEvents] = useState<string[]>(
    webhook?.events || ["tenant.created"],
  );
  const [eventTypes, setEventTypes] = useState<WebhookEventTypeInfo[]>(
    [],
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .listWebhookEventTypes()
      .then((d) => {
        setEventTypes(d.eventTypes);
        // Auto-expand categories that have selected events
        const cats = new Set<string>();
        for (const et of d.eventTypes) {
          if (
            (webhook?.events || ["tenant.created"]).includes(
              et.type as never,
            )
          ) {
            cats.add(et.category);
          }
        }
        setExpandedCategories(cats);
      })
      .catch((err) => toast.error(getErrorMessage(err)));
  }, []);

  const toggleEvent = (type: string) => {
    setEvents((prev) =>
      prev.includes(type)
        ? prev.filter((e) => e !== type)
        : [...prev, type],
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const categoryEvents = (category: string) =>
    eventTypes.filter((et) => et.category === category);

  const toggleAllInCategory = (category: string) => {
    const catTypes = categoryEvents(category).map((et) => et.type);
    const allSelected = catTypes.every((t) => events.includes(t));
    if (allSelected) {
      setEvents((prev) => prev.filter((e) => !catTypes.includes(e)));
    } else {
      setEvents((prev) => [...new Set([...prev, ...catTypes])]);
    }
  };

  // Ordered unique categories
  const categories = eventTypes.reduce<string[]>((acc, et) => {
    if (!acc.includes(et.category)) acc.push(et.category);
    return acc;
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        url: url.trim(),
        events,
      };
      if (webhook) {
        const result = await adminApi.updateWebhook(webhook.id, data);
        onSaved({ webhook: result.webhook });
      } else {
        const result = await adminApi.createWebhook(data);
        onSaved({ webhook: result.webhook, secret: result.secret });
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-dark-600">
        <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
          {webhook ? "Edit Webhook" : "Create Webhook"}
        </h3>
        <Button
          isIcon
          variant="flat"
          color="neutral"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-4 p-6">
        <Input
          label="Name"
          placeholder="e.g., Provisioning Service"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />
        <Input
          label="Description"
          placeholder="What this webhook does"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDescription(e.target.value)
          }
        />
        <Input
          label="Callback URL"
          placeholder="https://your-service.com/webhook"
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUrl(e.target.value)
          }
        />
        {!webhook && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-600 dark:bg-dark-600">
            <p className="text-xs text-gray-500 dark:text-dark-300">
              A signing secret will be automatically generated for
              HMAC-SHA256 signature verification.
            </p>
          </div>
        )}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Events</label>
            <span className="text-xs text-gray-400 dark:text-dark-400">
              {events.length} selected
            </span>
          </div>
          <div className="space-y-2">
            {categories.map((category) => {
              const catTypes = categoryEvents(category);
              const selectedCount = catTypes.filter((et) =>
                events.includes(et.type),
              ).length;
              const allSelected = selectedCount === catTypes.length;
              const someSelected = selectedCount > 0 && !allSelected;
              const expanded = expandedCategories.has(category);

              return (
                <div
                  key={category}
                  className="overflow-hidden rounded-lg border border-gray-300 dark:border-dark-600"
                >
                  <div
                    className="flex cursor-pointer items-center gap-3 bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-dark-600 dark:hover:bg-dark-500"
                    onClick={() => toggleCategory(category)}
                  >
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={() => toggleAllInCategory(category)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="ml-2 text-xs text-gray-400 dark:text-dark-400">
                        {selectedCount}/{catTypes.length}
                      </span>
                    </div>
                    {expanded ? (
                      <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  {expanded && (
                    <div className="border-t border-gray-300 dark:border-dark-600">
                      {catTypes.map((et) => (
                        <label
                          key={et.type}
                          className="flex cursor-pointer items-start gap-3 px-3 py-2.5 pl-10 transition-colors hover:bg-gray-50 dark:hover:bg-dark-600/50"
                        >
                          <Checkbox
                            checked={events.includes(et.type)}
                            onChange={() => toggleEvent(et.type)}
                          />
                          <div className="min-w-0">
                            <span className="font-mono text-sm">
                              {et.type}
                            </span>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-dark-300">
                              {et.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
            {error}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 p-6 pt-0">
        <Button variant="outlined" color="neutral" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={
            saving || !name.trim() || !url.trim() || events.length === 0
          }
          color="primary"
          variant="filled"
        >
          {saving
            ? "Saving..."
            : webhook
              ? "Save Changes"
              : "Create Webhook"}
        </Button>
      </div>
    </ModalShell>
  );
}

function WebhookDetailModal({
  webhookId,
  onClose,
  onRefresh,
  canWrite,
}: {
  webhookId: string;
  onClose: () => void;
  onRefresh: () => void;
  canWrite: boolean;
}) {
  const [hook, setHook] = useState<WebhookType | null>(null);
  const [secret, setSecret] = useState("");
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<WebhookDelivery | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(
    null,
  );
  const [regenerating, setRegenerating] = useState(false);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await adminApi.getWebhook(webhookId);
      setHook(data.webhook);
      setDeliveries(data.deliveries);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [webhookId]);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        const data = await adminApi.getWebhook(webhookId);
        if (!controller.signal.aborted) {
          setHook(data.webhook);
          setDeliveries(data.deliveries);
        }
      } catch {
        // ignore
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => controller.abort();
  }, [webhookId]);

  const handleTest = async () => {
    if (!hook) return;
    setTesting(true);
    setTestResult(null);
    try {
      const data = await adminApi.testWebhook(hook.id);
      setTestResult(data.delivery);
      fetchDetail();
    } catch {
      /* ignore */
    } finally {
      setTesting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!hook) return;
    setRegenerating(true);
    try {
      const data = await adminApi.regenerateWebhookSecret(hook.id);
      setSecret(data.secret);
      setHook({ ...hook, secretPreview: data.secretPreview });
      setSecretRevealed(true);
    } catch {
      /* ignore */
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  if (loading) {
    return (
      <ModalShell onClose={onClose} maxWidth="max-w-2xl">
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" color="primary" />
        </div>
      </ModalShell>
    );
  }

  if (!hook) return null;

  if (editing) {
    return (
      <WebhookFormModal
        webhook={hook}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          fetchDetail();
          onRefresh();
        }}
      />
    );
  }

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-dark-600">
        <div>
          <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">{hook.name}</h3>
          {hook.description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">
              {hook.description}
            </p>
          )}
        </div>
        <Button
          isIcon
          variant="flat"
          color="neutral"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-6 p-6">
        {/* Config summary */}
        <div className="space-y-4 text-sm">
          <div>
            <span className="text-xs text-gray-400 dark:text-dark-400">
              URL
            </span>
            <p className="mt-0.5 break-all font-mono text-xs text-gray-500 dark:text-dark-300">
              {hook.url}
            </p>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-dark-400">
                Signing Secret
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSecretRevealed(!secretRevealed)}
                  className="text-xs text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
                >
                  {secretRevealed ? "Hide" : "Reveal"}
                </button>
                {canWrite && (
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="text-xs text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50 dark:text-dark-400 dark:hover:text-dark-200"
                  >
                    {regenerating ? "Regenerating..." : "Regenerate"}
                  </button>
                )}
              </div>
            </div>
            {secretRevealed ? (
              <div className="relative">
                <code className="block w-full break-all rounded-lg border border-gray-300 bg-gray-50 p-2.5 pr-10 font-mono text-xs text-success dark:border-dark-600 dark:bg-dark-600">
                  {secret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="absolute right-1.5 top-1.5 rounded-md bg-gray-200 p-1.5 transition-colors hover:bg-gray-300 dark:bg-dark-500 dark:hover:bg-dark-400"
                  title="Copy to clipboard"
                >
                  {secretCopied ? (
                    <CheckIcon className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <ClipboardIcon className="h-3.5 w-3.5 text-gray-500 dark:text-dark-300" />
                  )}
                </button>
              </div>
            ) : (
              <code className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 font-mono text-xs text-gray-400 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-400">
                whsec_••••••••••••••••••••••••••••{hook.secretPreview}
              </code>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 dark:text-dark-400">
                Events
              </span>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {hook.events.map((e) => (
                  <span
                    key={e}
                    className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500 dark:bg-dark-600 dark:text-dark-300"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400 dark:text-dark-400">
                Created
              </span>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-dark-300">
                {formatDate(hook.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canWrite && (
          <div className="flex gap-2">
            <Button
              onClick={() => setEditing(true)}
              variant="outlined"
              color="neutral"
              className="text-xs"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              onClick={handleTest}
              disabled={testing}
              color="primary"
              variant="soft"
              className="text-xs"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              {testing ? "Sending..." : "Send Test"}
            </Button>
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div
            className={`rounded-xl border p-4 ${
              testResult.success
                ? "border-success/20 bg-success/5"
                : "border-error/20 bg-error/5"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                testResult.success
                  ? "text-success"
                  : "text-error dark:text-error-light"
              }`}
            >
              Test {testResult.success ? "succeeded" : "failed"} —{" "}
              {testResult.responseCode || "no response"} (
              {testResult.durationMs}ms)
            </p>
            {testResult.responseBody && (
              <pre className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-gray-500 dark:text-dark-300">
                {testResult.responseBody}
              </pre>
            )}
          </div>
        )}

        {/* Testing guide */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-600">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-dark-300">
            Testing Your Webhook
          </h4>
          <ul className="space-y-1.5 text-xs text-gray-500 dark:text-dark-400">
            <li>
              1. Use the &ldquo;Send Test&rdquo; button to deliver a sample{" "}
              <code className="text-gray-400 dark:text-dark-300">
                tenant.created
              </code>{" "}
              event with test data.
            </li>
            <li>
              2. Test deliveries include an{" "}
              <code className="text-gray-400 dark:text-dark-300">
                X-Webhook-Test: true
              </code>{" "}
              header so your handler can distinguish them.
            </li>
            <li>
              3. Verify the{" "}
              <code className="text-gray-400 dark:text-dark-300">
                X-Webhook-Signature
              </code>{" "}
              header by computing{" "}
              <code className="text-gray-400 dark:text-dark-300">
                HMAC-SHA256(payload, secret)
              </code>{" "}
              and comparing against the header value.
            </li>
            <li>
              4. Your endpoint should return a 2xx status code to
              acknowledge receipt.
            </li>
            <li>
              5. For local development, use a tunnel service like ngrok to
              expose your local server.
            </li>
          </ul>
        </div>

        {/* Recent deliveries */}
        <div>
          <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-dark-300">
            Recent Deliveries
          </h4>
          {deliveries.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-dark-400">
              No deliveries yet.
            </p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="overflow-hidden rounded-lg border border-gray-200 dark:border-dark-600"
                >
                  <button
                    onClick={() =>
                      setExpandedDelivery(
                        expandedDelivery === d.id ? null : d.id,
                      )
                    }
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-dark-600/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 rounded-full ${d.success ? "bg-success" : "bg-error"}`}
                      />
                      <span className="font-mono text-xs text-gray-500 dark:text-dark-300">
                        {d.eventType}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-dark-400">
                        {d.responseCode || "err"} &middot; {d.durationMs}ms
                        {d.retryCount > 0
                          ? ` · retry ${d.retryCount}/${d.maxRetries}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-dark-400">
                        {timeAgo(d.createdAt)}
                      </span>
                      {expandedDelivery === d.id ? (
                        <ChevronUpIcon className="h-3.5 w-3.5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {expandedDelivery === d.id && (
                    <div className="space-y-2 border-t border-gray-200 px-4 pb-3 dark:border-dark-600">
                      <div className="mt-2">
                        <span className="text-xs text-gray-400 dark:text-dark-400">
                          Payload
                        </span>
                        <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2 font-mono text-xs text-gray-500 dark:bg-dark-600 dark:text-dark-300">
                          {(() => {
                            try {
                              return JSON.stringify(
                                JSON.parse(d.payload),
                                null,
                                2,
                              );
                            } catch {
                              return d.payload;
                            }
                          })()}
                        </pre>
                      </div>
                      {d.responseBody && (
                        <div>
                          <span className="text-xs text-gray-400 dark:text-dark-400">
                            Response
                          </span>
                          <pre className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-2 font-mono text-xs text-gray-500 dark:bg-dark-600 dark:text-dark-300">
                            {d.responseBody}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function WebhooksSection({ canWrite }: { canWrite: boolean }) {
  const [hooks, setHooks] = useState<WebhookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookType | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [revealData, setRevealData] = useState<{
    secret: string;
    webhookName: string;
  } | null>(null);

  const fetchHooks = useCallback(async () => {
    try {
      const data = await adminApi.listWebhooks();
      setHooks(data.webhooks);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        const data = await adminApi.listWebhooks();
        if (!controller.signal.aborted) {
          setHooks(data.webhooks);
        }
      } catch {
        // ignore
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => controller.abort();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await adminApi.deleteWebhook(deleteTarget.id);
      setDeleteTarget(null);
      fetchHooks();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-dark-300">
            Webhooks
          </h2>
          {!loading && (
            <span className="text-xs text-gray-400 dark:text-dark-400">
              ({hooks.length})
            </span>
          )}
        </div>
        {canWrite && (
          <Button
            onClick={() => setShowCreate(true)}
            color="primary"
            variant="filled"
            className="text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Create Webhook
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" color="primary" />
        </div>
      ) : hooks.length === 0 ? (
        <Card className="p-8 text-center">
          <LinkIcon className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-dark-400" />
          <p className="text-sm text-gray-500 dark:text-dark-300">
            {canWrite
              ? "No webhooks configured. Create one to receive event notifications."
              : "No webhooks configured."}
          </p>
        </Card>
      ) : (
        <Card className="mt-3">
          <Table hoverable className="w-full">
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th>URL</Th>
                <Th>Events</Th>
                <Th>24h Activity</Th>
                <Th className="text-right" />
              </Tr>
            </THead>
            <TBody>
              {hooks.map((h) => (
                <Tr
                  key={h.id}
                  className="cursor-pointer"
                  onClick={() => setDetailId(h.id)}
                >
                  <Td>
                    <span className="text-sm font-medium">{h.name}</span>
                    {h.description && (
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-dark-400">
                        {h.description}
                      </p>
                    )}
                  </Td>
                  <Td>
                    <code className="font-mono text-xs text-gray-500 dark:text-dark-300">
                      {h.url.length > 40
                        ? h.url.substring(0, 40) + "..."
                        : h.url}
                    </code>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {h.events.map((e) => (
                        <span
                          key={e}
                          className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500 dark:bg-dark-600 dark:text-dark-300"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm tabular-nums">
                      {h.deliveries24h ?? 0}{" "}
                      <span className="text-xs text-gray-400 dark:text-dark-400">
                        deliveries
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400 dark:text-dark-400">
                      {h.lastDelivery
                        ? `Last: ${timeAgo(h.lastDelivery)}`
                        : "No deliveries yet"}
                    </div>
                  </Td>
                  <Td className="text-right">
                    {canWrite && (
                      <Button
                        isIcon
                        variant="flat"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(h);
                        }}
                        title="Delete webhook"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {showCreate && (
        <WebhookFormModal
          onClose={() => setShowCreate(false)}
          onSaved={(data) => {
            setShowCreate(false);
            fetchHooks();
            if (data.secret) {
              setRevealData({
                secret: data.secret,
                webhookName: data.webhook.name,
              });
            }
          }}
        />
      )}
      {revealData && (
        <RevealSecretModal
          secret={revealData.secret}
          webhookName={revealData.webhookName}
          onClose={() => setRevealData(null)}
        />
      )}
      {detailId && (
        <WebhookDetailModal
          webhookId={detailId}
          onClose={() => setDetailId(null)}
          onRefresh={fetchHooks}
          canWrite={canWrite}
        />
      )}
      {deleteTarget && (
        <ModalShell
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError("");
          }}
          maxWidth="max-w-md"
        >
          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error/20">
                <ExclamationTriangleIcon className="h-5 w-5 text-error" />
              </div>
              <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">Delete Webhook?</h3>
            </div>
            <p className="mb-2 text-sm text-gray-500 dark:text-dark-300">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget.name}</span>?
            </p>
            <p className="mb-6 text-xs text-gray-400 dark:text-dark-400">
              This webhook will stop receiving event notifications
              immediately.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outlined"
                color="neutral"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                color="error"
                variant="filled"
              >
                {deleting ? "Deleting..." : "Delete Webhook"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function APIPage() {
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role;
  const canWrite = role === "owner" || role === "admin";

  return (
    <Page title="API">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="mb-8">
          <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            API
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
            Documentation, keys, and webhook configuration
          </p>
        </div>

        <DocsSection />
        <APIKeysSection canWrite={canWrite} />
        <WebhooksSection canWrite={canWrite} />
      </div>
    </Page>
  );
}
