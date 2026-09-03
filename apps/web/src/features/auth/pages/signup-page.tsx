import { Link } from "@tanstack/react-router";

import { SignupForm } from "../components/signup-form";

type SignupPageProps = {
  redirectUrl: string;
};

export function SignupPage({ redirectUrl }: SignupPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start with a few basic details.</p>
      </div>
      <SignupForm redirectUrl={redirectUrl} />
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </div>
    </div>
  );
}
