// Import Dependencies
import { CheckCircle, Mail } from "lucide-react";
import { useOutletContext } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Local Imports
import { Page } from "@/components/shared/Page";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { messagesApi } from "@/utils/api";
import type { Message } from "@/@types/lastsaas";

// ----------------------------------------------------------------------

type MessagesOutletContext = {
  setUnreadCount?:
    | React.Dispatch<React.SetStateAction<number>>
    | ((updater: (prev: number) => number) => void);
};

export default function MessagesPage() {
  const outletCtx = useOutletContext<MessagesOutletContext | undefined>();
  const setUnreadCount = outletCtx?.setUnreadCount;
  const queryClient = useQueryClient();

  // React Query — cached data, no refetch within staleTime (60s)
  const { data, isLoading: loading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => messagesApi.list(),
  });
  const messages = data?.messages ?? [];

  const markAsRead = async (msg: Message) => {
    if (msg.read) return;
    try {
      await messagesApi.markRead(msg.id);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setUnreadCount?.((prev: number) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <Page title="Messages">
        <div className="px-(--margin-x) pt-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8" color="primary" />
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Messages">
      <div className="px-(--margin-x) pt-6 pb-8">
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
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
                        className={`text-base font-medium tracking-wide ${
                          msg.read
                            ? "text-gray-500 dark:text-dark-300"
                            : "text-gray-800 dark:text-dark-100"
                        }`}
                      >
                        {msg.subject}
                      </h3>
                      {msg.isSystem && (
                        <Badge color="primary" variant="soft">
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-dark-200">
                      {msg.body}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {msg.read ? (
                      <CheckCircle className="size-4 text-gray-400" />
                    ) : (
                      <span className="size-2 rounded-full bg-primary-500" />
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
