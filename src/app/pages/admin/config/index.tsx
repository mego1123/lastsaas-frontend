// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Form/Input";
import { Select } from "@/components/ui/Form/Select";
import { Textarea } from "@/components/ui/Form/Textarea";
import { Table, TBody, THead, Tr, Th, Td } from "@/components/ui/Table";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { EmptyState } from "@/components/shared/EmptyState";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { adminApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type { ConfigVar, ConfigVarType, EnumOption } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/ConfigPage.tsx`.
// ----------------------------------------------------------------------

const typeLabels: Record<ConfigVarType, string> = {
  string: "String",
  numeric: "Numeric",
  enum: "Enum",
  template: "Template",
};

/** Parse options JSON into label/value pairs, supporting both formats. */
function parseEnumOptions(optionsStr?: string): EnumOption[] {
  if (!optionsStr) return [];
  try {
    const parsed = JSON.parse(optionsStr);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    // label/value format
    if (
      typeof parsed[0] === "object" &&
      parsed[0].value !== undefined
    ) {
      return parsed as EnumOption[];
    }
    // legacy string array
    return parsed.map((s: string) => ({ label: s, value: s }));
  } catch {
    return [];
  }
}

/** Serialize EnumOption[] back to JSON string. */
function serializeEnumOptions(opts: EnumOption[]): string {
  return JSON.stringify(opts);
}

export default function ConfigPage() {
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role;
  const canWrite = role === "owner" || role === "admin";

  const [configs, setConfigs] = useState<ConfigVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editVar, setEditVar] = useState<ConfigVar | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConfigVar | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchConfigs = useCallback(async () => {
    try {
      const data = await adminApi.listConfig();
      setConfigs(data.configs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const filtered = configs.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.description.toLowerCase().includes(filter.toLowerCase()),
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteConfig(deleteTarget.name);
      setDeleteTarget(null);
      fetchConfigs();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
      setDeleting(false);
    }
  };

  const truncateValue = (val: string, max = 80) => {
    const single = val.replace(/\n/g, " ");
    return single.length > max
      ? single.slice(0, max - 3) + "..."
      : single;
  };

  return (
    <Page title="Configuration">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header — unified title + controls in one row */}
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Configuration
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {configs.length} variables
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CollapsibleSearch
              placeholder="Filter by name or description..."
              value={filter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilter(e.target.value)
              }
            />
            {canWrite && (
              <Button
                onClick={() => setShowCreate(true)}
                color="primary"
                variant="filled"
                className="h-8 gap-2 rounded-md px-3 text-xs"
              >
                <PlusIcon className="size-4" />
                <span>Add Variable</span>
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <Card>
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8" color="primary" />
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              Icon={Cog6ToothIcon}
              title={filter ? "No matching variables" : "No configuration variables"}
              description={
                filter
                  ? "Try a different search term."
                  : "Configuration variables will appear here once added."
              }
            />
          </Card>
        ) : (
          <Card>
            <div className="min-w-full overflow-x-auto">
            <Table hoverable className="w-full text-sm">
              <THead>
                <Tr>
                  <Th>Name</Th>
                  <Th className="w-24">Type</Th>
                  <Th>Value</Th>
                  <Th className="w-20" />
                </Tr>
              </THead>
              <TBody>
                {filtered.map((v) => (
                  <Tr
                    key={v.id}
                    className="cursor-pointer"
                    onClick={() => setEditVar(v)}
                  >
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{v.name}</span>
                        {v.isSystem && (
                          <Badge
                            color="primary"
                            variant="soft"
                            className="gap-1"
                          >
                            <ShieldCheckIcon className="h-3 w-3" />
                            System
                          </Badge>
                        )}
                      </div>
                      {v.description && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-dark-400">
                          {v.description}
                        </p>
                      )}
                    </Td>
                    <Td>
                      {typeLabels[v.type] || v.type}
                    </Td>
                    <Td className="font-mono">
                      {truncateValue(v.value)}
                    </Td>
                    <Td className="text-right">
                      {canWrite && !v.isSystem && (
                        <Button
                          isIcon
                          variant="flat"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(v);
                          }}
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            </div>
          </Card>
        )}

        {/* Edit Modal */}
        {editVar && (
          <EditConfigModal
            configVar={editVar}
            canWrite={canWrite}
            onSaved={() => {
              setEditVar(null);
              fetchConfigs();
            }}
            onClose={() => setEditVar(null)}
          />
        )}

        {/* Create Modal */}
        {canWrite && showCreate && (
          <CreateConfigModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              fetchConfigs();
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {canWrite && deleteTarget && (
          <ConfirmModal
            show
            onClose={() => {
              setDeleteTarget(null);
              setDeleting(false);
            }}
            onOk={confirmDelete}
            state="pending"
            confirmLoading={deleting}
            messages={{
              pending: {
                title: "Delete Variable",
                description: `Are you sure you want to delete ${deleteTarget.name}? This action is permanent and cannot be undone.`,
                actionText: "Delete Variable",
              },
            }}
          />
        )}
      </div>
    </Page>
  );
}

/* ─── Enum Options Editor ────────────────────────────────────────────── */

function EnumOptionsEditor({
  options,
  onChange,
}: {
  options: EnumOption[];
  onChange: (opts: EnumOption[]) => void;
}) {
  const updateOption = (
    index: number,
    field: "label" | "value",
    val: string,
  ) => {
    const updated = options.map((o, i) =>
      i === index ? { ...o, [field]: val } : o,
    );
    onChange(updated);
  };

  const addOption = () => {
    onChange([...options, { label: "", value: "" }]);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">Options</label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={opt.label}
              onChange={(e) => updateOption(i, "label", e.target.value)}
              placeholder="Label"
              className="form-input w-full flex-1"
            />
            <input
              type="text"
              value={opt.value}
              onChange={(e) => updateOption(i, "value", e.target.value)}
              placeholder="Value"
              className="form-input w-full flex-1 font-mono"
            />
            <Button
              isIcon
              variant="flat"
              color="error"
              onClick={() => removeOption(i)}
              title="Remove option"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="flat"
        color="primary"
        onClick={addOption}
        className="mt-2 text-xs"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add option
      </Button>
    </div>
  );
}

/* ─── Edit Modal ─────────────────────────────────────────────────────── */

function EditConfigModal({
  configVar,
  canWrite,
  onSaved,
  onClose,
}: {
  configVar: ConfigVar;
  canWrite: boolean;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [editValue, setEditValue] = useState(configVar.value);
  const [editDescription, setEditDescription] = useState(
    configVar.description,
  );
  const [editEnumOptions, setEditEnumOptions] = useState<EnumOption[]>(
    parseEnumOptions(configVar.options),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isNonSystem = !configVar.isSystem;
  const isEnum = configVar.type === "enum";
  // For non-system enums, use the editable options for the value selector
  const displayOptions =
    isNonSystem && isEnum
      ? editEnumOptions
      : parseEnumOptions(configVar.options);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const opts: { description?: string; options?: string } = {};
      if (isNonSystem && editDescription !== configVar.description) {
        opts.description = editDescription;
      }
      if (isNonSystem && isEnum) {
        const serialized = serializeEnumOptions(
          editEnumOptions.filter((o) => o.label.trim() && o.value.trim()),
        );
        if (serialized !== configVar.options) {
          opts.options = serialized;
        }
      }
      await adminApi.updateConfig(
        configVar.name,
        editValue,
        Object.keys(opts).length > 0 ? opts : undefined,
      );
      onSaved();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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
        className="scrollbar-sm relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
            Edit: {configVar.name}
          </h2>
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

        {/* Description — editable for non-system, read-only for system */}
        {isNonSystem ? (
          <div className="mb-4">
            <Input
              label="Description"
              placeholder="What this variable controls"
              value={editDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditDescription(e.target.value)
              }
              disabled={!canWrite}
            />
          </div>
        ) : configVar.description ? (
          <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
            {configVar.description}
          </p>
        ) : null}

        {/* Enum options editor for non-system enum vars */}
        {canWrite && isNonSystem && isEnum && (
          <div className="mb-4">
            <EnumOptionsEditor
              options={editEnumOptions}
              onChange={setEditEnumOptions}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Value ({typeLabels[configVar.type]})
          </label>

          {isEnum ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              disabled={!canWrite}
              className="form-select w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {displayOptions
                .filter((o) => o.value.trim())
                .map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label || opt.value}
                  </option>
                ))}
            </select>
          ) : configVar.type === "template" ? (
            <Textarea
              value={editValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditValue(e.target.value)
              }
              rows={16}
              disabled={!canWrite}
              className="font-mono"
            />
          ) : configVar.type === "numeric" ? (
            <Input
              type="number"
              value={editValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditValue(e.target.value)
              }
              step="any"
              disabled={!canWrite}
            />
          ) : (
            <Input
              type="text"
              value={editValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditValue(e.target.value)
              }
              disabled={!canWrite}
            />
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outlined"
            color="neutral"
            onClick={onClose}
          >
            {canWrite ? "Cancel" : "Close"}
          </Button>
          {canWrite && (
            <Button
              onClick={handleSave}
              disabled={saving}
              color="primary"
              variant="filled"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </TransitionChild>
    </Transition>
  );
}

/* ─── Create Modal ───────────────────────────────────────────────────── */

function CreateConfigModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ConfigVarType>("string");
  const [value, setValue] = useState("");
  const [enumOptions, setEnumOptions] = useState<EnumOption[]>([
    { label: "", value: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (type === "enum") {
      const valid = enumOptions.filter(
        (o) => o.label.trim() && o.value.trim(),
      );
      if (valid.length === 0) {
        setError(
          "At least one option with both label and value is required",
        );
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const optionsJSON =
        type === "enum"
          ? serializeEnumOptions(
              enumOptions.filter(
                (o) => o.label.trim() && o.value.trim(),
              ),
            )
          : undefined;
      await adminApi.createConfig({
        name: name.trim(),
        description: description.trim(),
        type,
        value,
        options: optionsJSON,
      });
      onCreated();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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
        className="scrollbar-sm relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">Add Variable</h2>
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

        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. feature.max_items"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />

          <Input
            label="Description"
            placeholder="What this variable controls"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDescription(e.target.value)
            }
          />

          <Select
            label="Type"
            value={type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setType(e.target.value as ConfigVarType)
            }
            data={[
              { label: "String", value: "string" },
              { label: "Numeric", value: "numeric" },
              { label: "Enum", value: "enum" },
              { label: "Template", value: "template" },
            ]}
          />

          {type === "enum" && (
            <EnumOptionsEditor
              options={enumOptions}
              onChange={setEnumOptions}
            />
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              {type === "enum" ? "Default Value" : "Value"}
            </label>
            {type === "enum" ? (
              <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="form-select w-full"
              >
                <option value="">Select a value...</option>
                {enumOptions
                  .filter((o) => o.value.trim())
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label || opt.value}
                    </option>
                  ))}
              </select>
            ) : type === "template" ? (
              <Textarea
                value={value}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setValue(e.target.value)
                }
                rows={6}
                className="font-mono"
              />
            ) : (
              <Input
                type={type === "numeric" ? "number" : "text"}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(e.target.value)
                }
                step={type === "numeric" ? "any" : undefined}
              />
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
            <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outlined"
            color="neutral"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={saving}
            color="primary"
            variant="filled"
          >
            {saving ? "Creating..." : "Create"}
          </Button>
        </div>
      </TransitionChild>
    </Transition>
  );
}
