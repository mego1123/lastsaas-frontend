// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  DocumentTextIcon,
  BoltIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form/Input";
import { Select } from "@/components/ui/Form/Select";
import { Checkbox } from "@/components/ui/Form/Checkbox";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  TBody,
  THead,
  Tr,
  Th,
  Td,
} from "@/components/ui/Table";
import { adminApi } from "@/utils/api";
import { getErrorString } from "@/utils/errors";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useTenantContext } from "@/app/contexts/tenant/context";
import type {
  UserDetail,
  UserMembershipDetail,
  DeletePreflightResponse,
} from "@/@types/lastsaas";

// ----------------------------------------------------------------------

function roleBadgeColor(
  role: string,
): "warning" | "primary" | "neutral" {
  if (role === "owner") return "warning";
  if (role === "admin") return "primary";
  return "neutral";
}

// ----------------------------------------------------------------------

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthContext();
  const { currentTenant } = useTenantContext();
  const role = currentTenant?.role ?? null;
  const canWrite = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const [user, setUser] = useState<UserDetail | null>(null);
  const [memberships, setMemberships] = useState<UserMembershipDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Edit fields
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Delete flow
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [preflight, setPreflight] = useState<DeletePreflightResponse | null>(
    null,
  );
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [replacementOwners, setReplacementOwners] = useState<
    Record<string, string>
  >({});
  const [confirmedTenantDeletions, setConfirmedTenantDeletions] = useState<
    string[]
  >([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await adminApi.getUser(userId);
      setUser(data.user);
      setMemberships(data.memberships);
      setEmail(data.user.email);
      setDisplayName(data.user.displayName);
    } catch (err: unknown) {
      setFetchError(getErrorString(err) || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const updates: { email?: string; displayName?: string } = {};
      if (email.trim() !== user.email) updates.email = email.trim();
      if (displayName.trim() !== user.displayName)
        updates.displayName = displayName.trim();
      if (Object.keys(updates).length === 0) {
        setSaveSuccess("No changes to save");
        setSaving(false);
        return;
      }
      await adminApi.updateUser(user.id, updates);
      setSaveSuccess("User updated successfully");
      await fetchUser();
    } catch (err: unknown) {
      setSaveError(
        getErrorString(err) || "Failed to update user",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      await adminApi.updateUserStatus(user.id, !user.isActive);
      await fetchUser();
    } catch {
      // ignore
    }
  };

  const handleDeleteClick = async () => {
    if (!user) return;
    setPreflightLoading(true);
    setDeleteError("");
    setReplacementOwners({});
    setConfirmedTenantDeletions([]);
    try {
      const data = await adminApi.preflightDeleteUser(user.id);
      setPreflight(data);
      if (!data.canDelete) {
        setDeleteError(data.reason || "This user cannot be deleted");
      }
      setShowDeleteModal(true);
    } catch (err: unknown) {
      setDeleteError(
        getErrorString(err) || "Failed to check delete eligibility",
      );
      setShowDeleteModal(true);
    } finally {
      setPreflightLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await adminApi.deleteUser(user.id, {
        replacementOwners:
          Object.keys(replacementOwners).length > 0
            ? replacementOwners
            : undefined,
        confirmTenantDeletions:
          confirmedTenantDeletions.length > 0
            ? confirmedTenantDeletions
            : undefined,
      });
      navigate("/last/users");
    } catch (err: unknown) {
      setDeleteError(getErrorString(err) || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const canSubmitDelete = () => {
    if (!preflight?.canDelete) return false;
    if (!preflight.ownerships) return true;
    for (const own of preflight.ownerships) {
      if (own.isRoot) return false;
      if (own.otherMembers.length > 0 && !replacementOwners[own.tenantId])
        return false;
      if (
        own.otherMembers.length === 0 &&
        !confirmedTenantDeletions.includes(own.tenantId)
      )
        return false;
    }
    return true;
  };

  const isSelf = currentUser?.id === userId;

  if (loading) {
    return (
      <Page title="User Profile">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <Spinner className="size-8" color="primary" />
          </div>
        </div>
      </Page>
    );
  }

  if (fetchError) {
    return (
      <Page title="User Profile">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="py-20 text-center">
            <p className="mb-2 text-lg text-error">
              Failed to load user profile
            </p>
            <p className="font-mono text-sm text-gray-500 dark:text-dark-300">
              {fetchError}
            </p>
            <Button
              variant="outlined"
              color="neutral"
              className="mt-4"
              onClick={() => navigate("/last/users")}
            >
              Back to Users
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  if (!user) return null;

  return (
    <Page title="User Profile">
      <div className="px-(--margin-x) pt-6 pb-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4 py-5">
          <Button
            isIcon
            variant="flat"
            color="neutral"
            className="size-9"
            onClick={() => navigate("/last/users")}
            aria-label="Back to Users"
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              User Profile
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {user.displayName} &middot; {user.email}
            </p>
          </div>
        </div>

        {/* Info / Edit Section */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            User Information
          </h2>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!canWrite}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canWrite}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-gray-400 dark:text-dark-400">
                Email Verified
              </span>
              <p
                className={
                  user.emailVerified
                    ? "text-success dark:text-success-light"
                    : "text-error"
                }
              >
                {user.emailVerified ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <span className="text-gray-400 dark:text-dark-400">
                Auth Methods
              </span>
              <p className="text-gray-700 dark:text-dark-200">
                {user.authMethods.join(", ")}
              </p>
            </div>
            <div>
              <span className="text-gray-400 dark:text-dark-400">Created</span>
              <p className="text-gray-700 dark:text-dark-200">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-gray-400 dark:text-dark-400">
                Last Login
              </span>
              <p className="text-gray-700 dark:text-dark-200">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>

          {saveError && (
            <div className="mb-4 rounded-lg border border-error/20 bg-error/5 px-4 py-2 text-sm text-error">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="mb-4 rounded-lg border border-success/20 bg-success/5 px-4 py-2 text-sm text-success dark:text-success-light">
              {saveSuccess}
            </div>
          )}

          {canWrite && (
            <Button
              color="primary"
              onClick={handleSave}
              disabled={saving}
              className="h-9"
            >
              <CheckIcon className="size-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </Card>

        {/* Status Section */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Account Status
          </h2>
          <div className="flex items-center gap-4">
            {user.isActive ? (
              <Badge color="success" variant="soft">
                Active
              </Badge>
            ) : (
              <Badge color="error" variant="soft">
                Disabled
              </Badge>
            )}
            {canWrite && (
              <Button
                variant="outlined"
                color={user.isActive ? "error" : "success"}
                className="h-8 text-xs"
                onClick={handleToggleStatus}
              >
                {user.isActive ? "Disable Account" : "Enable Account"}
              </Button>
            )}
          </div>
        </Card>

        {/* Memberships Section */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Tenant Memberships
          </h2>

          {memberships.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-dark-300">
              This user is not a member of any tenants.
            </p>
          ) : (
            <div className="min-w-full overflow-x-auto">
              <Table hoverable className="w-full min-w-[640px]">
                <THead>
                  <Tr>
                    <Th>Tenant</Th>
                    <Th>Role</Th>
                    <Th>Plan</Th>
                    <Th>Credits</Th>
                    <Th>Joined</Th>
                  </Tr>
                </THead>
                <TBody>
                  {memberships.map((m) => (
                    <Tr
                      key={m.tenantId}
                      onClick={() => navigate(`/last/tenants/${m.tenantId}`)}
                      className="cursor-pointer"
                    >
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 hover:text-primary-500 dark:text-dark-50 dark:hover:text-primary-400">
                            {m.tenantName}
                          </span>
                          <span className="font-mono text-xs text-gray-400 dark:text-dark-400">
                            ({m.tenantSlug})
                          </span>
                          {m.isRoot && (
                            <Badge color="primary" variant="soft">
                              Root
                            </Badge>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <Badge
                          color={roleBadgeColor(m.role)}
                          variant="soft"
                          className="capitalize"
                        >
                          {m.role}
                        </Badge>
                      </Td>
                      <Td>
                        {m.planName}
                        {m.billingWaived && (
                          <span className="ml-2 text-xs text-warning">
                            (waived)
                          </span>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1 text-gray-700 dark:text-dark-200">
                          <BoltIcon className="size-3.5 text-primary-500 dark:text-primary-400" />
                          {(m.subscriptionCredits + m.purchasedCredits).toLocaleString()}
                        </div>
                      </Td>
                      <Td>
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </Card>

        {/* View Logs + Danger Zone */}
        <div className="flex flex-col gap-6">
          <Button
            variant="outlined"
            color="neutral"
            component={Link}
            to={`/last/logs?userId=${userId}`}
            className="h-9 w-fit"
          >
            <DocumentTextIcon className="size-4" />
            View User Logs
          </Button>

          {isOwner && !isSelf && (
            <Card className="border-error/15 bg-error/5 p-6">
              <h2 className="mb-2 text-base font-medium tracking-wide text-error">
                Danger Zone
              </h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
                Permanently delete this user account and all associated data.
                This action cannot be undone.
              </p>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteClick}
                disabled={preflightLoading}
                className="h-9"
              >
                <TrashIcon className="size-4" />
                {preflightLoading ? "Checking..." : "Delete User"}
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {isOwner && (
        <Transition
          appear
          show={showDeleteModal}
          as={Dialog}
          onClose={() => setShowDeleteModal(false)}
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
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            className="scrollbar-sm relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-soft transition-all dark:bg-dark-700"
          >
            <div className="mb-4 flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
                <ExclamationTriangleIcon className="size-5 text-error" />
                Delete User
              </DialogTitle>
              <Button
                isIcon
                variant="flat"
                color="neutral"
                className="size-8"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close"
              >
                <XMarkIcon className="size-5" />
              </Button>
            </div>

            {!preflight?.canDelete ? (
              <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                {deleteError ||
                  preflight?.reason ||
                  "This user cannot be deleted."}
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-700 dark:text-dark-200">
                  You are about to permanently delete{" "}
                  <strong className="text-gray-900 dark:text-dark-50">
                    {user.displayName}
                  </strong>{" "}
                  ({user.email}). This will remove their account, memberships,
                  messages, and tokens.
                </p>

                {/* Ownership resolution */}
                {preflight.ownerships &&
                  preflight.ownerships.length > 0 && (
                    <div className="mb-4 space-y-4">
                      {preflight.ownerships.map((own) => (
                        <div
                          key={own.tenantId}
                          className="rounded-lg border border-gray-200 bg-gray-100 p-4 dark:border-dark-600 dark:bg-dark-600/40"
                        >
                          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-dark-50">
                            Tenant: {own.tenantName}
                            {own.isRoot && (
                              <span className="ml-2 text-xs text-error">
                                (Root — cannot delete owner)
                              </span>
                            )}
                          </p>

                          {own.isRoot ? (
                            <p className="text-xs text-error">
                              Root tenant ownership must be transferred via CLI
                              before this user can be deleted.
                            </p>
                          ) : own.otherMembers.length > 0 ? (
                            <div>
                              <p className="mb-2 text-xs text-gray-500 dark:text-dark-300">
                                Select a new owner for this tenant:
                              </p>
                              <Select
                                value={replacementOwners[own.tenantId] || ""}
                                onChange={(e) =>
                                  setReplacementOwners((prev) => ({
                                    ...prev,
                                    [own.tenantId]: e.target.value,
                                  }))
                                }
                                data={[
                                  {
                                    label: "Choose a replacement owner...",
                                    value: "",
                                  },
                                  ...own.otherMembers.map((member) => ({
                                    label: `${member.displayName} (${member.email})`,
                                    value: member.userId,
                                  })),
                                ]}
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="mb-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
                                This user is the only member of this tenant.
                                Deleting them will{" "}
                                <strong>
                                  permanently remove the entire tenant
                                </strong>
                                . This is irreversible.
                              </div>
                              <Checkbox
                                color="error"
                                checked={confirmedTenantDeletions.includes(
                                  own.tenantId,
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setConfirmedTenantDeletions((prev) => [
                                      ...prev,
                                      own.tenantId,
                                    ]);
                                  } else {
                                    setConfirmedTenantDeletions((prev) =>
                                      prev.filter((id) => id !== own.tenantId),
                                    );
                                  }
                                }}
                                label={`I understand that tenant "${own.tenantName}" will be permanently deleted`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {deleteError && (
                  <div className="mb-4 rounded-lg border border-error/20 bg-error/5 px-4 py-2 text-sm text-error">
                    {deleteError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={() => setShowDeleteModal(false)}
                    className="h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    color="error"
                    onClick={handleConfirmDelete}
                    disabled={!canSubmitDelete() || deleting}
                    className="h-9"
                  >
                    {deleting ? "Deleting..." : "Permanently Delete User"}
                    {!deleting && <ChevronRightIcon className="size-4" />}
                  </Button>
                </div>
              </>
            )}
          </TransitionChild>
        </Transition>
      )}
    </Page>
  );
}
