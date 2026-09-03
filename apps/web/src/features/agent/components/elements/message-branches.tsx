import { BranchPickerPrimitive } from "@assistant-ui/react";
import { cn } from "@repo/ui/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

export function MessageBranches({
  className,
  ...props
}: ComponentProps<typeof BranchPickerPrimitive.Root>) {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <BranchPickerPrimitive.Previous
        aria-label="Show previous response"
        className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <ChevronLeftIcon className="size-3.5" />
      </BranchPickerPrimitive.Previous>
      <span className="px-0.5 text-[11px] text-muted-foreground/60 tabular-nums">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next
        aria-label="Show next response"
        className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <ChevronRightIcon className="size-3.5" />
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
}
