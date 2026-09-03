import { Button } from "@repo/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { LoaderCircleIcon } from "lucide-react";

import { useFieldContext, useFormContext } from "./form-context";

type TextFieldProps = {
  label: string;
  type?: React.ComponentProps<"input">["type"];
  placeholder?: string;
  autoComplete?: string;
  description?: string;
};

function TextField({
  label,
  type = "text",
  placeholder,
  autoComplete,
  description,
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const invalid = field.state.meta.errors.length > 0;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        required
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}

function PasswordField(props: Omit<TextFieldProps, "type">) {
  return <TextField {...props} type="password" />;
}

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  label: string;
};

function SubmitButton({ label, children, disabled, ...props }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting]}>
      {([isSubmitting]) => (
        <Button type="submit" disabled={disabled || isSubmitting} {...props}>
          {isSubmitting && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
          {children ?? (isSubmitting ? `${label}…` : label)}
        </Button>
      )}
    </form.Subscribe>
  );
}

export { PasswordField, SubmitButton, TextField };
