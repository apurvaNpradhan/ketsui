import { authClient } from "@repo/auth/auth-client";
import { authQueryOptions } from "@repo/auth/tanstack/queries";
import { toast } from "@repo/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useAppForm } from "#/components/form/form";

import { signupSchema, type SignupValues } from "../validation";
import { SocialSignInButtons } from "./social-sign-in-buttons";

type SignupFormProps = {
  redirectUrl: string;
};

export function SignupForm({ redirectUrl }: SignupFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signup = useMutation({
    mutationFn: async ({ name, email, password }: SignupValues) => {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: redirectUrl,
      });
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: authQueryOptions().queryKey });
      await navigate({ to: redirectUrl, replace: true });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        description: error.message || "An error occurred while signing up.",
      });
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onBlur: signupSchema,
      onSubmit: signupSchema,
    },
    onSubmitInvalid: () => {
      document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
    },
    onSubmit: async ({ value }) => {
      await signup.mutateAsync({
        ...value,
        name: value.name.trim(),
        email: value.email.trim(),
      });
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      aria-busy={signup.isPending}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5">
          <form.AppField name="name">
            {(field) => <field.TextField label="Name" placeholder="John Doe" autoComplete="name" />}
          </form.AppField>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="Email"
                type="email"
                placeholder="hello@example.com"
                autoComplete="email"
              />
            )}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.PasswordField
                label="Password"
                placeholder="Create a password"
                autoComplete="new-password"
              />
            )}
          </form.AppField>
          <form.AppField name="confirmPassword">
            {(field) => (
              <field.PasswordField
                label="Confirm Password"
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            )}
          </form.AppField>
          <form.AppForm>
            <form.SubmitButton className="mt-2 w-full" size="lg" label="Sign up" />
          </form.AppForm>
        </div>
        <SocialSignInButtons callbackURL={redirectUrl} disabled={signup.isPending} />
      </div>
    </form>
  );
}
