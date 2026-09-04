import { mono } from "@repo/ui/lib/surfaces";
import { cn } from "@repo/ui/lib/utils";
import type { ComponentProps } from "react";

const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function isSameCalendarDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function DaySeparator({
  date,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  date: Date;
}) {
  const today = isSameCalendarDay(date, new Date());
  const label = today
    ? `Today ${timeFormat.format(date)}`
    : `${dayFormat.format(date)} at ${timeFormat.format(date)}`;

  return (
    <div
      data-slot="day-separator"
      className={cn("flex w-full justify-center py-1", className)}
      {...props}
    >
      <span className={cn(mono, "text-muted-foreground/50")}>{label}</span>
    </div>
  );
}
