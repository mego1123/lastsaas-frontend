// Import Dependencies
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form/Input";
import type { EventDefinition } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/EventDefinitionModal.tsx`.
// ----------------------------------------------------------------------

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(128)
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Use alphanumeric, dots, underscores, or hyphens",
    ),
  description: z.string().max(256),
  parentId: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    parentId?: string | null;
  }) => void;
  definitions: EventDefinition[];
  existing?: EventDefinition;
  loading?: boolean;
}

export default function EventDefinitionModal({
  open,
  onClose,
  onSubmit,
  definitions,
  existing,
  loading,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: existing?.name ?? "",
      description: existing?.description ?? "",
      parentId: existing?.parentId ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: existing?.name ?? "",
        description: existing?.description ?? "",
        parentId: existing?.parentId ?? "",
      });
    }
  }, [open, existing, reset]);

  const submit = (data: FormData) => {
    onSubmit({
      name: data.name,
      description: data.description || "",
      parentId: data.parentId || null,
    });
  };

  // Filter out self from parent options.
  const parentOptions = definitions
    .filter((d) => d.id !== existing?.id)
    .map((d) => ({ label: d.name, value: d.id }));

  return (
    <Transition
      appear
      show={open}
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
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
      >
        <h3 className="mb-4 text-lg font-semibold">
          {existing ? "Edit Event Definition" : "Define Event"}
        </h3>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. checkout.started"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Description"
            placeholder="Short description of this event"
            error={errors.description?.message}
            {...register("description")}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">
              Parent Event
            </label>
            <select
              className="form-select w-full"
              {...register("parentId")}
            >
              <option value="">None</option>
              {parentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outlined"
              color="neutral"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              color="primary"
              variant="filled"
            >
              {loading ? "Saving..." : existing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </TransitionChild>
    </Transition>
  );
}
