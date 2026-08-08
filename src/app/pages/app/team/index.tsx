// Import Dependencies
import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserPlusIcon,
  TrashIcon,
  StarIcon,
  ShieldCheckIcon,
  UserIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form/Input";
import { Select } from "@/components/ui/Form/Select";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  TBody,
  THead,
  Tr,
  Th,
  Td,
} from "@/components/ui/Table";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { tenantApi, plansApi } from "@/utils/api";
import { getErrorMessage, getErrorCode, getErrorString } from "@/utils/errors";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useTenantContext } from "@/app/contexts/tenant/context";
import type { TenantMember } from "@/@types/lastsaas";

// ----------------------------------------------------------------------

const roleIcons: Record<string, typeof StarIcon> = {
  owner: StarIcon,
  admin: ShieldCheckIcon,
  user: UserIcon,
};

const ROLE_OPTIONS = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
];

function renderTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(
      new RegExp(`\\{\\{\\.${key}\\}\\}`, "g"),
      String(value),
    );
  }
  result = result.replace(
    /\{\{if ne \.(\w+) (\d+)\}\}(.*?)\{\{end\}\}/g,
    (_match, varName, compare, content) => {
      return String(vars[varName]) !== compare ? content : "";
    },
  );
  return result;
}

export default function TeamPage() {
  const { user } = useAuthContext();
  const { currentTenant } = useTenantContext();
  const myRole = currentTenant?.role ?? "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Query — cached data, no refetch within staleTime (60s)
  const { data: membersData, isLoading: loading } = useQuery({
    queryKey: ["team", "members"],
    queryFn: () => tenantApi.listMembers(),
  });
  const members = membersData?.members ?? [];

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: () => plansApi.list(),
    enabled: showUpgradeModal,
  });
  const currentPlanUserLimit = plansData?.currentPlanUserLimit ?? 0;
  const currentPlanId = plansData?.currentPlanId ?? "";
  const plans = plansData?.plans ?? [];
  const upgradePromptTitle = plansData?.upgradePromptTitle ?? "";
  const upgradePromptBody = plansData?.upgradePromptBody ?? "";

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [removeMember, setRemoveMember] = useState<TenantMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const canManage = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setInviting(true);
    try {
      await tenantApi.inviteMember(inviteEmail, inviteRole);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ["team", "members"] });
    } catch (err: unknown) {
      const code = getErrorCode(err);
      if (code === "USER_LIMIT_REACHED") {
        setShowUpgradeModal(true);
      } else {
        setError(getErrorString(err) || "Failed to send invitation");
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: TenantMember) => {
    setRemoveLoading(true);
    try {
      await tenantApi.removeMember(member.userId);
      queryClient.invalidateQueries({ queryKey: ["team", "members"] });
      toast.success(`${member.displayName} removed from team`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoveLoading(false);
      setRemoveMember(null);
    }
  };

  const handleChangeRole = async (member: TenantMember, newRole: string) => {
    try {
      await tenantApi.changeRole(member.userId, newRole);
      queryClient.invalidateQueries({ queryKey: ["team", "members"] });
      toast.success(`${member.displayName}'s role changed to ${newRole}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <Page title="Team">
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" color="primary" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Team">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Team
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {members.length} members
            </p>
          </div>
          {canManage && (
            <Button
              color="primary"
              variant="filled"
              onClick={() => setShowInvite(!showInvite)}
              className="h-8 gap-2 rounded-md px-3 text-xs"
            >
              <UserPlusIcon className="size-4" />
              <span>Invite Member</span>
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success dark:text-success-light">
            {success}
          </div>
        )}

        {showInvite && (
          <Card className="mb-6 p-5">
            <form onSubmit={handleInvite}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
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
                <div className="w-full sm:w-36">
                  <Select
                    label="Role"
                    data={ROLE_OPTIONS}
                    value={inviteRole}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setInviteRole(e.target.value)
                    }
                  />
                </div>
                <Button
                  type="submit"
                  color="primary"
                  variant="filled"
                  disabled={inviting}
                  className="min-h-11 min-w-[7rem]"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Members Table — responsive: scrolls horizontally on mobile */}
        <Card className="mt-3">
          <div className="min-w-full overflow-x-auto">
            <Table hoverable className="w-full min-w-[640px]">
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
                  const RoleIcon = roleIcons[member.role] ?? UserIcon;
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
                          <p className="text-xs text-gray-400 dark:text-dark-400">
                            {member.email}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <RoleIcon className="size-4 text-gray-400 dark:text-dark-400" />
                          {isOwner && !isMe && member.role !== "owner" ? (
                            <Select
                              data={ROLE_OPTIONS}
                              value={member.role}
                              onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>,
                              ) => handleChangeRole(member, e.target.value)}
                              className="!w-32 !py-1 text-sm"
                              unstyled
                            />
                          ) : (
                            <span className="text-sm capitalize text-gray-700 dark:text-dark-200">
                              {member.role}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </Td>
                      {canManage && (
                        <Td className="text-right">
                          {!isMe && member.role !== "owner" && (
                            <Button
                              isIcon
                              variant="flat"
                              color="error"
                              className="size-8"
                              onClick={() => setRemoveMember(member)}
                              title="Remove member"
                              aria-label="Remove member"
                            >
                              <TrashIcon className="size-4" />
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

        {showUpgradeModal &&
          (() => {
            const templateVars = {
              UserLimit: currentPlanUserLimit,
              PlanName:
                plans.find((p) => p.id === currentPlanId)?.name || "",
            };
            const sortedByPrice = [...plans].sort(
              (a, b) => a.monthlyPriceCents - b.monthlyPriceCents,
            );
            const currentIdx = sortedByPrice.findIndex(
              (p) => p.id === currentPlanId,
            );
            const recommendedPlan = sortedByPrice
              .slice(currentIdx + 1)
              .find((p) => p.userLimit === 0 || p.userLimit > members.length);
            return (
              <ConfirmModal
                show={showUpgradeModal}
                state="pending"
                confirmLoading={false}
                onClose={() => setShowUpgradeModal(false)}
                onOk={() => {
                  setShowUpgradeModal(false);
                  navigate(
                    recommendedPlan
                      ? `/plan?upgrade=${recommendedPlan.id}`
                      : "/plan",
                  );
                }}
                messages={{
                  pending: {
                    Icon: BoltIcon,
                    iconClassName: "text-primary-500 dark:text-primary-400",
                    title: renderTemplate(upgradePromptTitle, templateVars),
                    description: renderTemplate(
                      upgradePromptBody,
                      templateVars,
                    ),
                    actionText: "Upgrade Plan",
                  },
                }}
              />
            );
          })()}

        <ConfirmModal
          show={removeMember !== null}
          state="pending"
          confirmLoading={removeLoading}
          onClose={() => setRemoveMember(null)}
          onOk={() => removeMember && handleRemove(removeMember)}
          messages={{
            pending: {
              title: "Remove Team Member",
              description: `Are you sure you want to remove ${removeMember?.displayName} from the team?`,
              actionText: "Remove",
            },
          }}
        />
      </div>
    </Page>
  );
}
