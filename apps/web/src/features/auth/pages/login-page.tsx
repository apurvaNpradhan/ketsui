import { Link } from "@tanstack/react-router";

import { LoginForm } from "../components/login-form";

type LoginPageProps = {
  redirectUrl: string;
};

export function LoginPage({ redirectUrl }: LoginPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Enter your details to access your account.</p>
      </div>
      <LoginForm redirectUrl={redirectUrl} />
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </div>
  );
}
