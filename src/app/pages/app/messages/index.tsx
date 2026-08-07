// Import Dependencies
import { useEffect, useState } from "react";
import { CheckCircle, Mail } from "lucide-react";
import { useOutletContext } from "react-router";
import { toast } from "sonner";

// Local Imports
import { Page } from "@/components/shared/Page";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { messagesApi } from "@/utils/api";
import type { Message } from "@/@types/lastsaas";
import { getErrorMessage } from "@/utils/errors";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/admin/MessagesPage.tsx` (97 LOC).
// (Note: original file is under `pages/admin/`, but the route `/messages`
// is registered as an app route — see `app/router/protected.tsx`.)
// ----------------------------------------------------------------------

type MessagesOutletContext = {
  setUnreadCount?:
    | React.Dispatch<React.SetStateAction<number>>
    | ((updater: (prev: number) => number) => void);
};

export default function MessagesPage() {
  // The AdminLayout (admin `/last/messages` route) provides an outlet
  // context that lets us push unread-count updates back to the sidebar
  // badge. The AppLayout (`/messages`) doesn't, so we accept undefined.
  const outletCtx = useOutletContext<MessagesOutletContext | undefined>();
  const setUnreadCount = outletCtx?.setUnreadCount;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesApi
      .list()
      .then((data) => {
        setMessages(data.messages);
        const unread = data.messages.filter((m) => !m.read).length;
        setUnreadCount?.(() => unread);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (msg: Message) => {
    if (msg.read) return;
    try {
      await messagesApi.markRead(msg.id);
      setMessages(
        messages.map((m) => (m.id === msg.id ? { ...m, read: true } : m)),
      );
      setUnreadCount?.((prev: number) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <Page title="Messages">
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" color="primary" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Messages">
      <div className="transition-content px-(--margin-x) pt-6 pb-8">
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50 lg:text-2xl">
              Messages
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {messages.length} messages
            </p>
          </div>
        </div>

        {messages.length === 0 ? (
          <Card>
            <EmptyState
              Icon={Mail}
              title="No messages yet"
              description="Messages will appear here when you receive them."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <Card
                key={msg.id}
                onClick={() => markAsRead(msg)}
                className={`cursor-pointer p-6 transition-colors ${
                  msg.read
                    ? "opacity-70"
                    : "border-primary-500/30 hover:border-primary-500/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-medium ${
                          msg.read
                            ? "text-gray-500 dark:text-dark-300"
                            : "text-gray-900 dark:text-dark-50"
                        }`}
                      >
                        {msg.subject}
                      </h3>
                      {msg.isSystem && (
                        <Badge
                          color="primary"
                          variant="soft"
                          className="text-xs"
                        >
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-500 dark:text-dark-300">
                      {msg.body}
                    </p>
                    <p className="mt-3 text-xs text-gray-400 dark:text-dark-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {msg.read && (
                    <CheckCircle className="ml-4 h-4 w-4 shrink-0 text-gray-400 dark:text-dark-500" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
