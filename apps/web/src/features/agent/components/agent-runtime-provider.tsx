import { HttpAgent } from "@ag-ui/client";
import {
  AssistantRuntimeProvider as AssistantRuntimeProviderBase,
  AuiConfig,
  Tools,
  type ThreadMessage,
} from "@assistant-ui/react";
import { useAgUiRuntime } from "@assistant-ui/react-ag-ui";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { agentToolkit } from "./weather-tool";

type StoredThread = {
  id: string;
  messages: readonly ThreadMessage[];
  title: string;
};

const AGENT_URL = "/api/v1/agent/";
const AGENT_HEADERS = { Accept: "text/event-stream" };
const NEW_THREAD_TITLE = "New chat";
const createThreadId = (): string => crypto.randomUUID();

const getThreadTitle = (messages: readonly ThreadMessage[]) => {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage) return undefined;

  const text = firstUserMessage.content
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return undefined;
  return text.length > 48 ? `${text.slice(0, 48).trimEnd()}…` : text;
};

export function AgentRuntimeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const threadsRef = useRef(new Map<string, StoredThread>());
  const [currentThreadId, setCurrentThreadId] = useState(createThreadId);
  const [threadIds, setThreadIds] = useState(() => [currentThreadId]);
  const [threadTitles, setThreadTitles] = useState<Record<string, string>>({});
  const agent = useMemo(
    () =>
      new HttpAgent({
        url: AGENT_URL,
        threadId: currentThreadId,
        headers: AGENT_HEADERS,
      }),
    [currentThreadId],
  );

  const threadList = useMemo(
    () => ({
      threadId: currentThreadId,
      threads: threadIds.map((id) => ({
        id,
        status: "regular" as const,
        title: threadTitles[id] ?? NEW_THREAD_TITLE,
      })),
      onSwitchToNewThread: () => {
        const id = createThreadId();
        threadsRef.current.set(id, { id, messages: [], title: NEW_THREAD_TITLE });
        setThreadTitles((titles) => ({ ...titles, [id]: NEW_THREAD_TITLE }));
        setThreadIds((ids) => [...ids, id]);
        setCurrentThreadId(id);
      },
      onSwitchToThread: (id: string) => {
        const thread = threadsRef.current.get(id);
        if (!thread) return { messages: [] };
        setCurrentThreadId(id);
        return { messages: thread.messages };
      },
      onRename: (id: string, newTitle: string) => {
        const thread = threadsRef.current.get(id);
        const title = newTitle.trim();
        if (!thread || !title) return;
        thread.title = title;
        setThreadTitles((titles) => ({ ...titles, [id]: title }));
      },
      onDelete: (id: string) => {
        if (!threadsRef.current.has(id)) return;
        threadsRef.current.delete(id);
        setThreadTitles((titles) => {
          const nextTitles = { ...titles };
          delete nextTitles[id];
          return nextTitles;
        });

        if (id !== currentThreadId) {
          setThreadIds((ids) => ids.filter((threadId) => threadId !== id));
          return;
        }

        const replacementId = createThreadId();
        threadsRef.current.set(replacementId, {
          id: replacementId,
          messages: [],
          title: NEW_THREAD_TITLE,
        });
        setThreadTitles((titles) => ({ ...titles, [replacementId]: NEW_THREAD_TITLE }));
        setThreadIds((ids) => [...ids.filter((threadId) => threadId !== id), replacementId]);
        setCurrentThreadId(replacementId);
      },
    }),
    [currentThreadId, threadIds, threadTitles],
  );

  const runtime = useAgUiRuntime({
    agent,
    adapters: { threadList },
    onError: (error) => console.error("AG-UI run failed", error),
  });

  useEffect(() => {
    if (!threadsRef.current.has(currentThreadId)) {
      threadsRef.current.set(currentThreadId, {
        id: currentThreadId,
        messages: [],
        title: NEW_THREAD_TITLE,
      });
    }
  }, [currentThreadId]);

  useEffect(() => {
    return runtime.thread.subscribe(() => {
      const messages = runtime.thread.getState().messages;
      const thread = threadsRef.current.get(currentThreadId);
      if (!thread) return;

      thread.messages = messages;
      const derivedTitle = getThreadTitle(messages);
      if (thread.title === NEW_THREAD_TITLE && derivedTitle) {
        thread.title = derivedTitle;
        setThreadTitles((titles) => ({ ...titles, [currentThreadId]: derivedTitle }));
      }

      threadsRef.current.set(currentThreadId, {
        id: currentThreadId,
        messages,
        title: thread.title,
      });
    });
  }, [currentThreadId, runtime]);
  const config = AuiConfig({
    tools: Tools({ toolkit: agentToolkit }),
  });

  return (
    <AssistantRuntimeProviderBase runtime={runtime} config={config}>
      {children}
    </AssistantRuntimeProviderBase>
  );
}
