import { ShimmerLabel } from "@repo/ui/lib/surfaces";
import { cn } from "@repo/ui/lib/utils";
import type { ComponentProps } from "react";

export function GenerationLoader({
  label,
  tick,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  label: string;
  tick: number;
}) {
  const pixelOffset = Math.floor(tick / 3);

  return (
    <div
      data-slot="generation-loader"
      className={cn("flex flex-col items-center gap-2", className)}
      {...props}
    >
      <div aria-hidden className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 2 }, (_, index) => {
          const active = (index * 2 + pixelOffset) % 9 < 3;

          return (
            <span
              key={index}
              className={cn(
                "size-[1.5px] bg-foreground transition-opacity duration-300 motion-reduce:transition-none",
                active ? "opacity-90" : "opacity-15",
              )}
            />
          );
        })}
      </div>
      <ShimmerLabel className="relative inline-block text-xs text-muted-foreground">
        {label}
      </ShimmerLabel>
    </div>
  );
}
