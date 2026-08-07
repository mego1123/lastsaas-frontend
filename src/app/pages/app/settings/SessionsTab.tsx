// Import Dependencies
import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

// Local Imports
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { authApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type { ActiveSession } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/settings/SessionsTab.tsx` (131 LOC).
// ----------------------------------------------------------------------

export default function SessionsTab() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadSessions = () => {
    setSessionsLoading(true);
    authApi
      .listSessions()
      .then((data) => setSessions(data.sessions))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setSessionsLoading(false));
  };

  useEffect(() => {
    loadSessions();
     
  }, []);

  const handleRevokeSession = async (id: string) => {
    setConfirmLoading(true);
    try {
      await authApi.revokeSession(id);
      setSessions((s) => s.filter((session) => session.id !== id));
      toast.success("Session revoked");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirmLoading(false);
      setConfirmRevokeId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    setConfirmLoading(true);
    try {
      await authApi.revokeAllSessions();
      loadSessions();
      toast.success("All other sessions revoked");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirmLoading(false);
      setConfirmRevokeAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-end">
          {sessions.length > 1 && (
            <Button
              variant="flat"
              color="error"
              onClick={() => setConfirmRevokeAll(true)}
              className="h-7 min-w-[12rem] text-xs"
            >
              Revoke all other sessions
            </Button>
          )}
        </div>

        {sessionsLoading ? (
          <div className="py-8">
            <Spinner className="h-5 w-5" color="primary" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            Icon={Monitor}
            title="No active sessions found"
            description="Your active sessions will appear here."
          />
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3 dark:bg-dark-600/50"
              >
                <div className="flex items-start gap-3">
                  <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-gray-400 dark:text-dark-400" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-dark-50">
                      {session.deviceInfo ||
                        session.userAgent.slice(0, 50)}
                      {session.isCurrent && (
                        <Badge
                          color="primary"
                          variant="soft"
                          className="ml-2"
                        >
                          Current
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-dark-400">
                      {session.ipAddress} · Last active{" "}
                      {new Date(session.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="flat"
                    color="error"
                    onClick={() => setConfirmRevokeId(session.id)}
                    className="h-7 shrink-0 text-xs"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmModal
        show={confirmRevokeId !== null}
        state="pending"
        confirmLoading={confirmLoading}
        onClose={() => setConfirmRevokeId(null)}
        onOk={() => confirmRevokeId && handleRevokeSession(confirmRevokeId)}
        messages={{
          pending: {
            title: "Revoke Session",
            description:
              "This will sign out the device associated with this session. Are you sure?",
            actionText: "Revoke",
          },
        }}
      />
      <ConfirmModal
        show={confirmRevokeAll}
        state="pending"
        confirmLoading={confirmLoading}
        onClose={() => setConfirmRevokeAll(false)}
        onOk={handleRevokeAllSessions}
        messages={{
          pending: {
            title: "Revoke All Sessions",
            description:
              "This will sign out all other devices. You will remain signed in on this device.",
            actionText: "Revoke All",
          },
        }}
      />
    </div>
  );
}
