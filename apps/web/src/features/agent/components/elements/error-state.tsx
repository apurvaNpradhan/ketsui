import { ActionBarPrimitive, ErrorPrimitive, MessagePrimitive } from "@assistant-ui/react";
import { CircleAlertIcon, RefreshCwIcon } from "lucide-react";

export function MessageError() {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="mt-3 flex items-start gap-2.5 rounded-2xl bg-red-500/[0.06] px-4 py-3 text-sm dark:bg-red-500/10">
        <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-red-500/80" aria-hidden />
        <ErrorPrimitive.Message className="text-red-600 dark:text-red-400" />
        <ActionBarPrimitive.Reload
          aria-label="Retry response"
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
        >
          <RefreshCwIcon className="size-3" aria-hidden />
          Retry
        </ActionBarPrimitive.Reload>
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
}
