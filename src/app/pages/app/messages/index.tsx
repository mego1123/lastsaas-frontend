// Import Dependencies
import { useState } from "react";
import { Mail } from "lucide-react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  EnvelopeOpenIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useOutletContext } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Local Imports
import { Page } from "@/components/shared/Page";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { messagesApi } from "@/utils/api";
import type { Message } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// List row + reading pane styled after the Tailux Mail app
// (src/app/pages/apps/mail/MailList/Item.tsx + MailContent), adapted to
// the Message shape (subject/body/read/isSystem) — no sidebar, no
// sender/labels/compose, since none of those exist for this feature.
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // React Query — cached data, no refetch within staleTime (60s)
  const { data, isLoading: loading, isFetching } = useQuery({
    queryKey: ["messages"],
    queryFn: () => messagesApi.list(),
  });
  const messages = data?.messages ?? [];
  const selected = messages.find((m) => m.id === selectedId) ?? null;

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

  const openMessage = (msg: Message) => {
    setSelectedId(msg.id);
    markAsRead(msg);
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
        {selected ? (
          <MessageDetail message={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <>
            <div className="flex flex-col-reverse py-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                  Messages
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                  {messages.length} messages
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  isIcon
                  variant="flat"
                  className="size-8 rounded-full"
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ["messages"] })
                  }
                >
                  <ArrowPathIcon
                    className={clsx("size-5", isFetching && "animate-spin")}
                  />
                </Button>
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
              <Card>
                {messages.map((msg) => (
                  <MessageRow
                    key={msg.id}
                    message={msg}
                    onClick={() => openMessage(msg)}
                  />
                ))}
              </Card>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

// ----------------------------------------------------------------------

function MessageRow({
  message,
  onClick,
}: {
  message: Message;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        message.read
          ? "text-gray-600 dark:text-dark-200"
          : "font-semibold text-gray-800 dark:text-dark-50",
        "dark:border-dark-500 flex w-full items-center gap-3 border-b p-2.5 text-left last:border-b-0 sm:items-center",
      )}
    >
      <span
        className={clsx(
          "size-2 shrink-0 rounded-full",
          message.read ? "bg-transparent" : "bg-primary-500",
        )}
      />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 truncate">
          <span>{message.subject}</span>{" "}
          <span className="dark:text-dark-300 font-normal text-gray-500">
            {message.body}
          </span>
        </span>
        {message.isSystem && (
          <Badge
            color="primary"
            variant="outlined"
            className="shrink-0 rounded-full max-sm:hidden"
          >
            System
          </Badge>
        )}
      </span>
      <span className="text-xs-plus shrink-0 text-gray-400">
        {new Date(message.createdAt).toLocaleDateString()}
      </span>
    </button>
  );
}

function MessageDetail({
  message,
  onBack,
}: {
  message: Message;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-220px)] flex-col">
      <header className="-mx-1 flex items-center gap-1 pb-2">
        <Button
          data-tooltip
          data-tooltip-content="Back to messages"
          onClick={onBack}
          isIcon
          variant="flat"
          className="size-8"
        >
          <ArrowLeftIcon className="size-4.5 rtl:rotate-180" />
        </Button>
        {message.read && (
          <span className="flex items-center gap-1 px-2 text-xs text-gray-400">
            <EnvelopeOpenIcon className="size-4" /> Read
          </span>
        )}
      </header>

      <div className="mt-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-dark-100">
            {message.subject}
          </h3>
          {message.isSystem && (
            <Badge color="primary" variant="soft">
              System
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {new Date(message.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="my-5 h-px bg-gray-200 dark:bg-dark-500" />

      <div className="grow whitespace-pre-wrap text-sm text-gray-700 dark:text-dark-100">
        {message.body}
      </div>
    </div>
  );
}
