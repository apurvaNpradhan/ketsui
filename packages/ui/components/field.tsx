import { cva, type VariantProps } from "class-variance-authority";
import { useMemo } from "react";

import { Label } from "#/components/label.tsx";
import { cn } from "#/lib/utils.ts";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset data-slot="field-set" className={cn("flex flex-col gap-6", className)} {...props} />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex w-full flex-col gap-6", className)}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field flex w-full gap-3 data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
      horizontal: "flex-row items-center",
      responsive: "flex-col @md/field-group:flex-row @md/field-group:items-center",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("group/field-content flex flex-1 flex-col gap-1 leading-snug", className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("group/field-label flex w-fit gap-2 leading-snug", className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm leading-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & { errors?: readonly unknown[] }) {
  const messages = useMemo(
    () =>
      errors
        ?.map((error) => {
          if (typeof error === "string") return error;
          if (error && typeof error === "object" && "message" in error) {
            const message = error.message;
            return typeof message === "string" ? message : null;
          }
          return null;
        })
        .filter((message): message is string => Boolean(message)),
    [errors],
  );

  const content = children ?? messages?.join(", ");
  if (!content) return null;

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  );
}

export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet };
