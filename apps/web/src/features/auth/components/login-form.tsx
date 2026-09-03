import { authClient } from "@repo/auth/auth-client";
import { authQueryOptions } from "@repo/auth/tanstack/queries";
import { toast } from "@repo/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useAppForm } from "#/components/form/form";

import { loginSchema, type LoginValues } from "../validation";
import { SocialSignInButtons } from "./social-sign-in-buttons";

type LoginFormProps = {
  redirectUrl: string;
};

export function LoginForm({ redirectUrl }: LoginFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const login = useMutation({
    mutationFn: async ({ email, password }: LoginValues) => {
      const result = await authClient.signIn.email({
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
        description: error.message || "An error occurred while signing in.",
      });
    },
  });

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onBlur: loginSchema,
      onSubmit: loginSchema,
    },
    onSubmitInvalid: () => {
      document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
    },
    onSubmit: async ({ value }) => {
      await login.mutateAsync({
        email: value.email.trim(),
        password: value.password,
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
      aria-busy={login.isPending}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5">
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
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            )}
          </form.AppField>
          <form.AppForm>
            <form.SubmitButton className="mt-2 w-full" size="lg" label="Log in" />
          </form.AppForm>
        </div>
        <SocialSignInButtons callbackURL={redirectUrl} disabled={login.isPending} />
      </div>
    </form>
  );
}
