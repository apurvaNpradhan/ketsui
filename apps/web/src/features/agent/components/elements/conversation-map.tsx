import { useAuiState, useThreadViewport, type ThreadMessage } from "@assistant-ui/react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { cn } from "@repo/ui/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ConversationMapEntry = {
  id: string;
  title: string;
  preview?: string;
};

type Turn = {
  head: ThreadMessage;
  members: ThreadMessage[];
};

const textOf = (message: ThreadMessage) =>
  message.content
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const shorten = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;

function groupTurns(messages: readonly ThreadMessage[]) {
  const turns: Turn[] = [];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const current = turns.at(-1);
    if (message.role === "user" || !current) {
      turns.push({ head: message, members: [message] });
    } else {
      current.members.push(message);
    }
  }
  return turns;
}

function entryForTurn({ head, members }: Turn): ConversationMapEntry {
  const title = textOf(head);
  const answer = members.slice(1).map(textOf).find(Boolean);
  return {
    id: head.id,
    title: shorten(title || "Conversation", 72),
    ...(answer ? { preview: shorten(answer, 240) } : {}),
  };
}

export function ConversationMapAui({
  side = "left",
  className,
}: {
  side?: "left" | "right";
  className?: string;
}) {
  const messages = useAuiState((state) => state.thread.messages);
  const viewport = useThreadViewport((state) => state.element.viewport);
  const viewportHeight = useThreadViewport((state) => state.height.viewport);
  const [activeId, setActiveId] = useState<string>();
  const [visibleIds, setVisibleIds] = useState<readonly string[]>([]);
  const turns = useMemo(() => groupTurns(messages), [messages]);
  const entries = useMemo(() => turns.map(entryForTurn), [turns]);
  const owners = useMemo(() => {
    const result = new Map<string, string>();
    for (const turn of turns) {
      for (const message of turn.members) result.set(message.id, turn.head.id);
    }
    return result;
  }, [turns]);

  useEffect(() => {
    if (!viewport) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = viewport.getBoundingClientRect();
      let current: string | undefined;
      const visible: string[] = [];

      for (const element of viewport.querySelectorAll<HTMLElement>("[data-message-id]")) {
        const box = element.getBoundingClientRect();
        if (box.top >= bounds.bottom) break;
        const messageId = element.dataset.messageId;
        const turnId = messageId ? owners.get(messageId) : undefined;
        if (!turnId) continue;
        if (box.top <= bounds.top + 1) current = turnId;
        if (box.bottom > bounds.top && !visible.includes(turnId)) visible.push(turnId);
      }

      setActiveId(current ?? visible.at(-1) ?? entries[0]?.id);
      setVisibleIds(visible);
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    schedule();
    viewport.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      viewport.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [entries, owners, viewport]);

  const select = useCallback(
    (id: string) => {
      if (!viewport) return;
      const element = [...viewport.querySelectorAll<HTMLElement>("[data-message-id]")].find(
        (item) => owners.get(item.dataset.messageId ?? "") === id,
      );
      if (!element) return;
      const top =
        element.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top +
        viewport.scrollTop;
      viewport.scrollTo({ top, behavior: "smooth" });
    },
    [owners, viewport],
  );

  if (entries.length === 0) return null;

  return (
    <div
      data-slot="conversation-map-rail"
      className={cn("pointer-events-none sticky top-0 z-10 h-0 w-full", className)}
    >
      <div
        className={cn(
          "pointer-events-auto absolute top-0 px-3 py-10",
          side === "right" ? "right-0" : "left-0",
        )}
        style={{ height: viewportHeight }}
      >
        <ConversationMap
          entries={entries}
          activeId={activeId}
          visibleIds={visibleIds}
          onSelect={select}
          side={side === "right" ? "left" : "right"}
        />
      </div>
    </div>
  );
}

function ConversationMap({
  entries,
  activeId,
  visibleIds,
  onSelect,
  side,
}: {
  entries: readonly ConversationMapEntry[];
  activeId?: string;
  visibleIds: readonly string[];
  onSelect: (id: string) => void;
  side: "left" | "right";
}) {
  const [handle] = useState(() => PreviewCard.createHandle<ConversationMapEntry>());
  const activeIndex = entries.findIndex((entry) => entry.id === activeId);
  const visible = new Set(visibleIds);

  return (
    <nav
      aria-label="Conversation map"
      className="group/rail flex h-full w-6 flex-col justify-center"
    >
      {entries.map((entry, index) => {
        const active = index === activeIndex;
        const inView = active || visible.has(entry.id);
        return (
          <PreviewCard.Trigger
            key={entry.id}
            handle={handle}
            payload={entry}
            delay={120}
            closeDelay={80}
            render={<button type="button" aria-label={entry.title} />}
            aria-label={entry.title}
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(entry.id)}
            className="group flex max-h-3.5 min-h-0 flex-1 items-center outline-none"
          >
            <span
              className={cn(
                "rounded-full transition-[width,height,background-color] duration-200",
                active
                  ? "h-[3px] w-3 bg-foreground/90 group-hover/rail:w-6"
                  : cn(
                      "h-0.5 w-3",
                      inView ? "bg-foreground/50" : "bg-foreground/15",
                      "group-hover/rail:w-6",
                    ),
              )}
            />
          </PreviewCard.Trigger>
        );
      })}
      <PreviewCard.Root handle={handle}>
        {({ payload }) => (
          <PreviewCard.Portal>
            <PreviewCard.Positioner side={side} sideOffset={10}>
              <PreviewCard.Popup className="z-50 w-60 rounded-2xl border bg-popover p-3.5 text-popover-foreground shadow-lg outline-none">
                <p className="line-clamp-2 text-[13px] font-medium">{payload?.title}</p>
                {payload?.preview ? (
                  <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                    {payload.preview}
                  </p>
                ) : null}
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        )}
      </PreviewCard.Root>
    </nav>
  );
}
