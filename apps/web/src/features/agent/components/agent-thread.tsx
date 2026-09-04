import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  groupPartByType,
  MessagePrimitive,
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  ThreadPrimitive,
  type AssistantState,
  type ToolCallMessagePartProps,
  useAui,
  useAuiState,
  useMessageTiming,
} from "@assistant-ui/react";
import { StreamdownTextPrimitive } from "@assistant-ui/react-streamdown";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  Loader2Icon,
  MenuIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SquareIcon,
  TrashIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ConversationMapAui } from "./elements/conversation-map";
import { DaySeparator, isSameCalendarDay } from "./elements/day-separator";
import { MessageError } from "./elements/error-state";
import { GenerationLoader } from "./elements/loading-state";
import { MessageBranches } from "./elements/message-branches";

const isNewChatView = (state: AssistantState) =>
  state.thread.messages.length === 0 && !state.thread.isRunning;

const isHistoryLoadingView = (state: AssistantState) =>
  state.thread.messages.length === 0 && state.thread.isLoading && !state.thread.isDisabled;

const groupAssistantParts = groupPartByType({
  reasoning: ["group-chainOfThought", "group-reasoning"],
  source: ["group-chainOfThought", "group-source"],
  "tool-call": ["group-chainOfThought", "group-tool"],
  "standalone-tool-call": [],
});

const actionButtonClass =
  "rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

const menuContentClass =
  "z-50 min-w-32 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg";

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-muted focus:bg-muted";

const disclosureContentClass = "ml-1 border-l pl-4 text-sm text-muted-foreground";

const AgentSidebarContext = createContext<{ onNavigate?: () => void }>({});

export function AgentPageHeader({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const title = useAuiState(
    (state) =>
      state.threads.threadItems.find((item) => item.id === state.threads.mainThreadId)?.title,
  );

  return (
    <header className="flex h-12 min-w-0 items-center gap-2 border-b px-4 md:px-5">
      {onOpenSidebar ? (
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open conversation history"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <MenuIcon className="size-4" />
        </button>
      ) : null}
      <span className="truncate text-sm font-medium">{title ?? "New chat"}</span>
      <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
        Ketsui assistant
      </span>
    </header>
  );
}

export function AgentThreadList({ onNavigate }: { onNavigate?: () => void } = {}) {
  const [search, setSearch] = useState("");
  const threadIds = useAuiState((state) => state.threads.threadIds);
  const threadItems = useAuiState((state) => state.threads.threadItems);
  const context = useMemo(() => ({ onNavigate }), [onNavigate]);
  const query = search.trim().toLowerCase();
  const visibleThreads = threadIds
    .map((id, index) => ({
      id,
      index,
      title: threadItems.find((item) => item.id === id)?.title ?? "New chat",
    }))
    .filter((thread) => !query || thread.title.toLowerCase().includes(query));

  return (
    <AgentSidebarContext.Provider value={context}>
      <ThreadListPrimitive.Root className="flex min-h-0 flex-col gap-3">
        <ThreadListPrimitive.New asChild>
          <button
            type="button"
            onClick={onNavigate}
            className="flex h-9 shrink-0 items-center gap-2 rounded-xl border bg-background px-3 text-sm transition-colors hover:border-foreground/30 hover:bg-muted"
          >
            <PlusIcon className="size-4" aria-hidden />
            New conversation
          </button>
        </ThreadListPrimitive.New>

        {threadIds.length > 0 ? (
          <label className="relative block">
            <span className="sr-only">Search conversations</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations"
              className="h-9 w-full rounded-xl border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
          </label>
        ) : null}

        <div className="min-h-0 overflow-y-auto">
          {visibleThreads.length > 0 ? (
            <div className="flex flex-col gap-1">
              {visibleThreads.map((thread) => (
                <ThreadListPrimitive.ItemByIndex
                  key={thread.id}
                  index={thread.index}
                  components={{ ThreadListItem: AgentThreadRow }}
                />
              ))}
            </div>
          ) : (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              {query ? "No conversations found" : "Start a conversation"}
            </p>
          )}
        </div>
      </ThreadListPrimitive.Root>
    </AgentSidebarContext.Provider>
  );
}

function AgentThreadRow() {
  const { onNavigate } = useContext(AgentSidebarContext);
  const [isRenaming, setIsRenaming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (isRenaming || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    triggerRef.current?.focus();
  }, [isRenaming]);

  return (
    <ThreadListItemPrimitive.Root className="group relative flex h-9 items-center rounded-xl transition-colors hover:bg-muted data-active:bg-muted">
      {isRenaming ? (
        <AgentThreadRename
          onDone={(restoreFocus) => {
            restoreFocusRef.current = restoreFocus;
            setIsRenaming(false);
          }}
        />
      ) : (
        <ThreadListItemPrimitive.Trigger
          ref={triggerRef}
          onClick={onNavigate}
          className="min-w-0 flex-1 truncate px-3 text-left text-sm text-muted-foreground outline-none group-hover:text-foreground group-data-active:text-foreground"
        >
          <ThreadListItemPrimitive.Title fallback="New chat" />
        </ThreadListItemPrimitive.Trigger>
      )}
      <AgentThreadMore onRename={() => setIsRenaming(true)} />
    </ThreadListItemPrimitive.Root>
  );
}

function AgentThreadRename({ onDone }: { onDone: (restoreFocus: boolean) => void }) {
  const aui = useAui();
  const title = useAuiState((state) => state.threadListItem.title) ?? "";
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = (restoreFocus: boolean) => {
    if (settledRef.current) return;
    settledRef.current = true;
    const nextTitle = value.trim();
    if (!nextTitle || nextTitle === title) {
      onDone(restoreFocus);
      return;
    }

    Promise.resolve(aui.threadListItem.rename(nextTitle)).then(
      () => onDone(restoreFocus),
      () => {
        settledRef.current = false;
        if (restoreFocus) inputRef.current?.focus();
      },
    );
  };

  return (
    <input
      ref={inputRef}
      aria-label="Rename conversation"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => commit(false)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit(true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          onDone(true);
        }
      }}
      className="h-8 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
    />
  );
}

function AgentThreadMore({ onRename }: { onRename: () => void }) {
  return (
    <ThreadListItemMorePrimitive.Root>
      <ThreadListItemMorePrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Conversation actions"
          className="absolute right-1 grid size-7 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-foreground data-[state=open]:opacity-100"
        >
          <MoreHorizontalIcon className="size-4" />
        </button>
      </ThreadListItemMorePrimitive.Trigger>
      <ThreadListItemMorePrimitive.Content
        side="right"
        align="start"
        sideOffset={6}
        className={menuContentClass}
      >
        <ThreadListItemMorePrimitive.Item className={menuItemClass} onSelect={onRename}>
          <PencilIcon className="size-4" />
          Rename
        </ThreadListItemMorePrimitive.Item>
        <ThreadListItemPrimitive.Delete asChild>
          <ThreadListItemMorePrimitive.Item
            className={`${menuItemClass} text-destructive hover:bg-destructive/10 focus:bg-destructive/10`}
          >
            <TrashIcon className="size-4" />
            Delete
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Delete>
      </ThreadListItemMorePrimitive.Content>
    </ThreadListItemMorePrimitive.Root>
  );
}

export function AgentThread() {
  const isEmpty = useAuiState(isNewChatView);
  const messages = useAuiState((state) => state.thread.messages);

  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className={`relative flex flex-1 flex-col overflow-y-auto px-4 pt-6 md:px-6 ${isEmpty ? "justify-center" : ""}`}
      >
        <ConversationMapAui side="right" className="max-sm:hidden" />
        <AuiIf condition={isNewChatView}>
          <div className="mx-auto mb-8 w-full max-w-2xl text-center">
            <p className="text-xl font-medium tracking-tight">How can I help you today?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask Ketsui to find an answer or get something done.
            </p>
          </div>
        </AuiIf>
        <AuiIf condition={isHistoryLoadingView}>
          <div role="status" className="mx-auto flex w-full max-w-2xl flex-col gap-3">
            <span className="sr-only">Loading conversation</span>
            <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-muted" />
            <div className="h-20 w-4/5 animate-pulse rounded-xl bg-muted" />
          </div>
        </AuiIf>

        <div className="mx-auto mb-12 flex w-full max-w-2xl flex-col gap-6 empty:hidden">
          <ThreadPrimitive.Messages>
            {({ message }) => {
              if (message.composer.isEditing) return <AgentEditComposer />;

              const messageIndex = messages.findIndex((item) => item.id === message.id);
              const previousMessage = messages[messageIndex - 1];
              const showDate =
                !previousMessage ||
                !isSameCalendarDay(previousMessage.createdAt, message.createdAt);

              if (message.role === "user") {
                return <AgentUserMessage createdAt={message.createdAt} showDate={showDate} />;
              }
              if (message.role === "assistant") {
                return <AgentAssistantMessage createdAt={message.createdAt} showDate={showDate} />;
              }
              return null;
            }}
          </ThreadPrimitive.Messages>
        </div>

        <ThreadPrimitive.ViewportFooter
          className={`relative mx-auto flex w-full max-w-2xl flex-col gap-3 overflow-visible pb-5 ${isEmpty ? "" : "sticky bottom-0 mt-auto bg-background pt-3"}`}
        >
          <ThreadPrimitive.ScrollToBottom asChild>
            <button
              type="button"
              aria-label="Scroll to bottom"
              className="absolute -top-11 left-1/2 grid size-8 -translate-x-1/2 place-items-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted disabled:invisible"
            >
              <ArrowDownIcon className="size-4" />
            </button>
          </ThreadPrimitive.ScrollToBottom>
          <AgentComposer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

function AgentComposer() {
  return (
    <ComposerPrimitive.Root className="w-full">
      <div className="flex flex-col rounded-2xl border bg-muted/30 transition-colors focus-within:border-foreground/30">
        <ComposerPrimitive.Input asChild>
          <textarea
            data-composer-input
            placeholder="Message Ketsui..."
            rows={1}
            className="field-sizing-content max-h-48 min-h-14 w-full resize-none bg-transparent px-4 pt-4 pb-2 text-base leading-6 outline-none placeholder:text-muted-foreground"
          />
        </ComposerPrimitive.Input>
        <div className="flex items-center justify-between px-3 pb-3">
          <span className="text-xs text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <AuiIf condition={(state) => !state.thread.isRunning}>
              <ComposerPrimitive.Send asChild>
                <button
                  type="button"
                  aria-label="Send message"
                  className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                >
                  <ArrowUpIcon className="size-4" />
                </button>
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={(state) => state.thread.isRunning}>
              <ComposerPrimitive.Cancel asChild>
                <button
                  type="button"
                  aria-label="Stop generating"
                  className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground"
                >
                  <SquareIcon className="size-3.5 fill-current" />
                </button>
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </div>
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
}

function AgentEditComposer() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <MessagePrimitive.Root data-role="user" className="flex w-full flex-col items-end">
      <ComposerPrimitive.Root className="flex w-full max-w-[85%] flex-col rounded-2xl border bg-muted/30">
        <ComposerPrimitive.Input asChild>
          <textarea
            ref={inputRef}
            aria-label="Edit message"
            rows={1}
            className="field-sizing-content max-h-48 min-h-14 w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] leading-6 outline-none"
          />
        </ComposerPrimitive.Input>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <ComposerPrimitive.Cancel asChild>
            <button
              type="button"
              className="h-8 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <button
              type="button"
              className="h-8 rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-40"
            >
              Update
            </button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
}

function AgentUserMessage({ createdAt, showDate }: { createdAt: Date; showDate: boolean }) {
  return (
    <MessagePrimitive.Root data-role="user" className="group flex w-full flex-col items-end">
      {showDate ? <DaySeparator date={createdAt} /> : null}
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-[15px] leading-6 wrap-break-word">
        <MessagePrimitive.Parts />
      </div>
      <ActionBarPrimitive.Root
        hideWhenRunning
        className="mt-1 flex items-center gap-1 self-end opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <ActionBarPrimitive.Copy aria-label="Copy message" className={actionButtonClass}>
          <AuiIf condition={(state) => state.message.isCopied}>
            <CheckIcon className="size-4" />
          </AuiIf>
          <AuiIf condition={(state) => !state.message.isCopied}>
            <CopyIcon className="size-4" />
          </AuiIf>
        </ActionBarPrimitive.Copy>
        <ActionBarPrimitive.Edit aria-label="Edit message" className={actionButtonClass}>
          <PencilIcon className="size-4" />
        </ActionBarPrimitive.Edit>
      </ActionBarPrimitive.Root>
    </MessagePrimitive.Root>
  );
}

function AgentAssistantMessage({ createdAt, showDate }: { createdAt: Date; showDate: boolean }) {
  const hasToolCalls = useAuiState((state) =>
    state.message.content.some((part) => part.type === "tool-call"),
  );
  const messageStatus = useAuiState((state) => state.message.status?.type);
  const isMessageRunning = messageStatus === "running";
  const timing = useMessageTiming();

  return (
    <MessagePrimitive.Root
      data-role="assistant"
      className="w-full text-[15px] leading-relaxed wrap-break-word"
    >
      {showDate ? <DaySeparator date={createdAt} /> : null}
      <AgentLoadingState />
      <MessagePrimitive.GroupedParts groupBy={groupAssistantParts}>
        {({ part, children }) => {
          switch (part.type) {
            case "group-chainOfThought":
              return hasToolCalls ? <div>{children}</div> : null;
            case "group-reasoning":
              if (!hasToolCalls) return null;
              return (
                <AgentReasoningGroup
                  running={part.status.type === "running"}
                  showTiming={messageStatus === "complete"}
                  completedDuration={timing?.totalStreamTime}
                  initialStartTime={
                    part.indices[0] === 0 && isMessageRunning ? timing?.streamStartTime : undefined
                  }
                >
                  {children}
                </AgentReasoningGroup>
              );
            case "group-tool":
              if (part.indices.length === 1) return <>{children}</>;
              return (
                <details open={part.status.type === "running"} className="my-2">
                  <summary className="group flex cursor-pointer list-none items-center gap-2 font-mono text-xs text-muted-foreground outline-none focus-visible:underline">
                    <ChevronRightIcon className="size-3 transition-transform group-open:rotate-90" />
                    {part.status.type === "running" ? "Running" : "Tools"} ({part.indices.length})
                  </summary>
                  <div className={disclosureContentClass}>{children}</div>
                </details>
              );
            case "group-source":
              return null;
            case "text":
              return part.text === "" ? null : (
                <StreamdownTextPrimitive
                  defer
                  className="[&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:my-2 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-3 [&_strong]:font-semibold [&_ul]:my-2"
                />
              );
            case "reasoning":
              return <p className="whitespace-pre-wrap">{part.text}</p>;
            case "source":
              return null;
            case "tool-call":
              return part.toolUI ?? <GenericToolTrace {...part} />;
            case "data":
              return part.dataRendererUI;
            default:
              return null;
          }
        }}
      </MessagePrimitive.GroupedParts>

      <AgentSources />
      <MessageError />
      <AuiIf condition={(state) => state.message.isLast}>
        <div className="mt-2 flex items-center gap-1.5">
          <AgentAssistantActions />
        </div>
      </AuiIf>
    </MessagePrimitive.Root>
  );
}

function AgentReasoningGroup({
  children,
  running,
  showTiming,
  completedDuration,
  initialStartTime,
}: {
  children: ReactNode;
  running: boolean;
  showTiming: boolean;
  completedDuration?: number;
  initialStartTime?: number;
}) {
  const [startedAt] = useState(() => initialStartTime ?? (running ? Date.now() : null));
  const [duration, setDuration] = useState<number | null>(
    () =>
      completedDuration ?? (initialStartTime !== undefined ? Date.now() - initialStartTime : null),
  );

  useEffect(() => {
    if (startedAt === null) return;
    const updateDuration = () => setDuration(Date.now() - startedAt);

    if (!running || !showTiming) {
      if (!running && showTiming) updateDuration();
      return;
    }

    updateDuration();
    const interval = window.setInterval(updateDuration, 100);
    return () => window.clearInterval(interval);
  }, [running, showTiming, startedAt]);

  return (
    <details open={running} className="my-2">
      <summary className="group flex cursor-pointer list-none items-center gap-2 text-xs text-muted-foreground outline-none focus-visible:underline">
        <ChevronRightIcon className="size-3 transition-transform group-open:rotate-90" />
        {running
          ? "Working..."
          : !showTiming || duration === null
            ? "Work completed"
            : `Worked for ${formatWorkDuration(duration)}`}
      </summary>
      <div className={disclosureContentClass}>{children}</div>
    </details>
  );
}

function AgentLoadingState() {
  const isLoading = useAuiState(
    (state) => state.message.status?.type === "running" && state.message.content.length === 0,
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = window.setInterval(() => setTick((value) => value + 1), 120);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  return isLoading ? (
    <GenerationLoader
      label="Working..."
      tick={tick}
      className="flex-row items-center gap-2 py-1 text-xs [&>div]:gap-0.5 [&>div>span]:size-1.5"
    />
  ) : null;
}

function GenericToolTrace({ toolName, status }: ToolCallMessagePartProps) {
  const running = status?.type === "running";
  return (
    <ToolTrace label={running ? `Running ${toolName}` : `Ran ${toolName}`} running={running} />
  );
}

function ToolTrace({ label, running }: { label: string; running: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
      {running ? (
        <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden />
      )}
      <span>{label}</span>
    </div>
  );
}

function isCited(text: string, url: string) {
  let from = 0;
  while (true) {
    const index = text.indexOf(url, from);
    if (index === -1) return false;
    const next = text[index + url.length];
    if (next === undefined || !/[\w#?/-]/.test(next)) return true;
    from = index + url.length;
  }
}

function isSafeSourceUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function AgentSources() {
  const content = useAuiState((state) => state.message.content);
  const text = content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
  const seen = new Set<string>();
  const sources = content.flatMap((part) => {
    if (
      part.type !== "source" ||
      part.sourceType !== "url" ||
      !isSafeSourceUrl(part.url) ||
      seen.has(part.url) ||
      !isCited(text, part.url)
    )
      return [];
    seen.add(part.url);
    return [part];
  });

  if (sources.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="text-muted-foreground/60">Sources</span>
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[34ch] truncate underline decoration-foreground/20 underline-offset-2 hover:text-foreground"
        >
          {source.title ?? source.url}
        </a>
      ))}
    </div>
  );
}

function AgentAssistantActions() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex items-center gap-1"
    >
      <MessageBranches />
      <ActionBarPrimitive.Copy aria-label="Copy response" className={actionButtonClass}>
        <AuiIf condition={(state) => state.message.isCopied}>
          <CheckIcon className="size-4" />
        </AuiIf>
        <AuiIf condition={(state) => !state.message.isCopied}>
          <CopyIcon className="size-4" />
        </AuiIf>
      </ActionBarPrimitive.Copy>
      <AuiIf
        condition={(state) =>
          state.message.status?.type !== "incomplete" || state.message.status.reason !== "error"
        }
      >
        <ActionBarPrimitive.Reload aria-label="Retry response" className={actionButtonClass}>
          <RefreshCwIcon className="size-4" />
        </ActionBarPrimitive.Reload>
      </AuiIf>
    </ActionBarPrimitive.Root>
  );
}

function formatWorkDuration(milliseconds: number) {
  if (milliseconds < 60_000) return `${(milliseconds / 1000).toFixed(1)}s`;

  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ""}`;
}

export function AgentMobileSidebar({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close conversation history"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversation-history-title"
        className="relative flex h-full w-72 flex-col border-r bg-background p-3 pt-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between px-2">
          <span id="conversation-history-title" className="text-sm font-medium">
            Conversation history
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close conversation history"
            onClick={onClose}
            className={actionButtonClass}
          >
            <ChevronRightIcon className="size-4 rotate-180" />
          </button>
        </div>
        <AgentThreadList onNavigate={onClose} />
      </aside>
    </div>
  );
}
