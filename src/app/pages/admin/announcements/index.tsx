// Import Dependencies
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Local Imports
import { Page } from "@/components/shared/Page";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Form/Input";
import { Textarea } from "@/components/ui/Form/Textarea";
import { Checkbox } from "@/components/ui/Form/Checkbox";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { adminApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type { Announcement } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/AnnouncementsPage.tsx`.
// ----------------------------------------------------------------------

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim(),
  publish: z.boolean(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role;
  const canWrite = role === "owner" || role === "admin";
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => adminApi.listAnnouncements(),
  });
  const announcements = data?.announcements ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success("Announcement deleted");
      setDeleteTarget(null);
      setDeleteLoading(false);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setDeleteLoading(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (ann: Announcement) =>
      adminApi.updateAnnouncement(ann.id, {
        publish: !ann.isPublished,
      }),
    onSuccess: (_data, ann) => {
      toast.success(ann.isPublished ? "Unpublished" : "Published");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Page title="Announcements">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Announcements
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Manage changelog and announcements for users
            </p>
          </div>
          {canWrite && (
            <Button
              onClick={() => setShowCreate(true)}
              color="primary"
              variant="filled"
            >
              <PlusIcon className="h-4 w-4" />
              New Announcement
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-8 w-8" color="primary" />
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <EmptyState
              Icon={MegaphoneIcon}
              title="No announcements yet"
              description="Announcements will appear here once published."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <Card key={ann.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate font-semibold">{ann.title}</h3>
                      <Badge
                        color={ann.isPublished ? "success" : "neutral"}
                        variant="soft"
                      >
                        {ann.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {ann.body && (
                      <p className="line-clamp-2 text-sm text-gray-500 dark:text-dark-300">
                        {ann.body}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400 dark:text-dark-400">
                      Created {new Date(ann.createdAt).toLocaleDateString()}
                      {ann.publishedAt &&
                        ` · Published ${new Date(ann.publishedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {canWrite && (
                    <div className="flex items-center gap-1">
                      <Button
                        isIcon
                        variant="flat"
                        color="neutral"
                        onClick={() => toggleMutation.mutate(ann)}
                        aria-label={
                          ann.isPublished ? "Unpublish" : "Publish"
                        }
                      >
                        {ann.isPublished ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        color="neutral"
                        onClick={() => setEditTarget(ann)}
                      >
                        Edit
                      </Button>
                      <Button
                        isIcon
                        variant="flat"
                        color="error"
                        onClick={() => setDeleteTarget(ann)}
                        aria-label="Delete announcement"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {canWrite && (showCreate || editTarget) && (
          <AnnouncementFormModal
            announcement={editTarget ?? undefined}
            onClose={() => {
              setShowCreate(false);
              setEditTarget(null);
            }}
            onSaved={() => {
              setShowCreate(false);
              setEditTarget(null);
              queryClient.invalidateQueries({
                queryKey: ["announcements"],
              });
            }}
          />
        )}

        {canWrite && (
          <ConfirmModal
            show={deleteTarget !== null}
            onClose={() => setDeleteTarget(null)}
            onOk={() => {
              if (deleteTarget) {
                setDeleteLoading(true);
                deleteMutation.mutate(deleteTarget.id);
              }
            }}
            state="pending"
            confirmLoading={deleteLoading}
            messages={{
              pending: {
                title: "Delete Announcement",
                description: `Are you sure you want to delete "${deleteTarget?.title}"?`,
                actionText: "Delete",
              },
            }}
          />
        )}
      </div>
    </Page>
  );
}

function AnnouncementFormModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement?: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!announcement;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title ?? "",
      body: announcement?.body ?? "",
      publish: announcement?.isPublished ?? false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AnnouncementFormData) => {
      if (isEdit) {
        return adminApi.updateAnnouncement(announcement!.id, {
          title: data.title,
          body: data.body,
          publish: data.publish,
        });
      }
      return adminApi.createAnnouncement({
        title: data.title,
        body: data.body || "",
        publish: data.publish,
      });
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "Announcement updated" : "Announcement created",
      );
      onSaved();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

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
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
            {isEdit ? "Edit Announcement" : "New Announcement"}
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

        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="What's new?"
              error={errors.title?.message}
              {...register("title")}
            />
            <Textarea
              label="Body (Markdown)"
              rows={6}
              placeholder="Describe the update..."
              {...register("body")}
            />
            <Checkbox
              label="Publish immediately"
              color="primary"
              {...register("publish")}
            />
          </div>

          {mutation.error && (
            <p className="mt-3 text-sm text-error dark:text-error-light">
              {getErrorMessage(mutation.error)}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outlined"
              color="neutral"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="filled"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </form>
      </TransitionChild>
    </Transition>
  );
}
