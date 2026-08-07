// Import Dependencies
import { useEffect, useState } from "react";
import {
  UserPlusIcon,
  TrashIcon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Form/Input";
import { Select } from "@/components/ui/Form/Select";
import { Table, TBody, THead, Tr, Th, Td } from "@/components/ui/Table";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useTenantContext } from "@/app/contexts/tenant/context";
import { adminApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type { TenantMember, Invitation } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/RootMembersPage.tsx`.
// ----------------------------------------------------------------------

export default function RootMembersPage() {
  const { user } = useAuthContext();
  const { currentTenant } = useTenantContext();
  const myRole = currentTenant?.role;
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [removeMember, setRemoveMember] = useState<TenantMember | null>(
    null,
  );
  const [removeLoading, setRemoveLoading] = useState(false);
  const [cancelInvitation, setCancelInvitation] =
    useState<Invitation | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const canManage = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";

  const fetchData = () => {
    adminApi
      .listRootMembers()
      .then((data) => {
        setMembers(data.members);
        setInvitations(data.invitations);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .listRootMembers()
      .then((data) => {
        if (!controller.signal.aborted) {
          setMembers(data.members);
          setInvitations(data.invitations);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          toast.error(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setInviting(true);
    try {
      await adminApi.inviteRootMember(inviteEmail, inviteRole);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setShowInvite(false);
      fetchData();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { error?: string } } }
      )?.response?.data;
      setError(data?.error || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: TenantMember) => {
    setRemoveLoading(true);
    try {
      await adminApi.removeRootMember(member.userId);
      setMembers(members.filter((m) => m.userId !== member.userId));
      toast.success(`${member.displayName} removed from root tenant`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoveLoading(false);
      setRemoveMember(null);
    }
  };

  const handleChangeRole = async (
    member: TenantMember,
    newRole: string,
  ) => {
    try {
      await adminApi.changeRootMemberRole(member.userId, newRole);
      setMembers(
        members.map((m) =>
          m.userId === member.userId
            ? { ...m, role: newRole as TenantMember["role"] }
            : m,
        ),
      );
      toast.success(`${member.displayName}'s role changed to ${newRole}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCancelInvitation = async (inv: Invitation) => {
    setCancelLoading(true);
    try {
      await adminApi.cancelRootInvitation(inv.id);
      setInvitations(invitations.filter((i) => i.id !== inv.id));
      toast.success(`Invitation to ${inv.email} canceled`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelLoading(false);
      setCancelInvitation(null);
    }
  };

  if (loading) {
    return (
      <Page title="Root Members">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="mb-8">
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Root Members
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Loading…
            </p>
          </div>
          <div className="flex justify-center py-20">
            <Spinner className="h-8 w-8" color="primary" />
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Root Members">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Root Members
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {members.length} members
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => setShowInvite(!showInvite)}
              color="primary"
              variant="filled"
            >
              <UserPlusIcon className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">
            {success}
          </div>
        )}

        {/* Invite Form */}
        {showInvite && (
          <Card className="mb-6 p-6">
            <form onSubmit={handleInvite}>
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[200px] flex-1">
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setInviteEmail(e.target.value)
                    }
                    placeholder="teammate@example.com"
                  />
                </div>
                <div className="w-36">
                  <Select
                    label="Role"
                    value={inviteRole}
                    onChange={(
                      e: React.ChangeEvent<HTMLSelectElement>,
                    ) => setInviteRole(e.target.value)}
                    data={
                      isOwner
                        ? [
                            { label: "User", value: "user" },
                            { label: "Admin", value: "admin" },
                          ]
                        : [{ label: "User", value: "user" }]
                    }
                  />
                </div>
                <Button
                  type="submit"
                  color="primary"
                  variant="filled"
                  disabled={inviting}
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Members Table */}
        <Card className="mt-3">
          <div className="min-w-full overflow-x-auto">
            <Table hoverable className="w-full">
              <THead>
                <Tr>
                  <Th>Member</Th>
                  <Th>Role</Th>
                  <Th>Joined</Th>
                  {canManage && <Th className="text-right">Actions</Th>}
                </Tr>
              </THead>
              <TBody>
                {members.map((member) => {
                  const isMe = member.userId === user?.id;
                  return (
                    <Tr key={member.userId}>
                      <Td>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                            {member.displayName}
                            {isMe && (
                              <span className="ml-2 text-gray-400 dark:text-dark-400">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-dark-400">
                            {member.email}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        {isOwner && !isMe && member.role !== "owner" ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleChangeRole(member, e.target.value)
                            }
                            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-dark-450 dark:bg-dark-600"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="text-sm capitalize text-gray-700 dark:text-dark-200">
                            {member.role}
                          </span>
                        )}
                      </Td>
                      <Td>
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </Td>
                      {canManage && (
                        <Td className="text-right">
                          {!isMe &&
                            member.role !== "owner" &&
                            (myRole === "owner" ||
                              member.role === "user") && (
                              <Button
                                isIcon
                                variant="flat"
                                color="error"
                                onClick={() => setRemoveMember(member)}
                                title="Remove member"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            )}
                        </Td>
                      )}
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              Pending Invitations
            </h2>
            <Card className="mt-3">
              <div className="min-w-full overflow-x-auto">
                <Table hoverable className="w-full">
                  <THead>
                    <Tr>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Invited</Th>
                      <Th>Expires</Th>
                      {canManage && <Th className="text-right">Actions</Th>}
                    </Tr>
                  </THead>
                  <TBody>
                    {invitations.map((inv) => (
                      <Tr key={inv.id}>
                        <Td>{inv.email}</Td>
                        <Td>
                          {inv.role}
                        </Td>
                        <Td>
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </Td>
                        <Td>
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </Td>
                        {canManage && (
                          <Td className="text-right">
                            <Button
                              isIcon
                              variant="flat"
                              color="error"
                              onClick={() => setCancelInvitation(inv)}
                              title="Cancel invitation"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </Button>
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        <ConfirmModal
          show={removeMember !== null}
          onClose={() => setRemoveMember(null)}
          onOk={() => removeMember && handleRemove(removeMember)}
          state="pending"
          confirmLoading={removeLoading}
          messages={{
            pending: {
              title: "Remove Root Member",
              description: `Are you sure you want to remove ${removeMember?.displayName} from the root tenant?`,
              actionText: "Remove",
            },
          }}
        />

        <ConfirmModal
          show={cancelInvitation !== null}
          onClose={() => setCancelInvitation(null)}
          onOk={() =>
            cancelInvitation && handleCancelInvitation(cancelInvitation)
          }
          state="pending"
          confirmLoading={cancelLoading}
          messages={{
            pending: {
              title: "Cancel Invitation",
              description: `Are you sure you want to cancel the invitation to ${cancelInvitation?.email}?`,
              actionText: "Cancel Invitation",
            },
          }}
        />
      </div>
    </Page>
  );
}
