import { useAuthSuspense } from "@repo/auth/tanstack/hooks";
import { Button } from "@repo/ui/components/button";
import { Link } from "@tanstack/react-router";

import { SignOutButton } from "#/components/session/sign-out-button";
import { ThemeToggle } from "#/components/theme/theme-toggle";

function UserAction() {
  const { user } = useAuthSuspense();

  return user ? (
    <section className="mb-20 flex flex-col items-center space-y-1.5">
      <h1 className="mb-3 text-2xl font-bold tracking-tight">Welcome back, {user.name}</h1>
      <p className="mb-4 text-sm text-muted-foreground">Your account is ready.</p>
      <Button render={<Link to="/app" />} className="w-fit" size="lg" nativeButton={false}>
        Open your account
      </Button>
      <SignOutButton />
    </section>
  ) : (
    <section className="mb-20 space-y-3 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Welcome to Ketsui</h1>
      <p>You are not signed in.</p>
      <Button render={<Link to="/login" />} className="w-fit" size="lg" nativeButton={false}>
        Log in
      </Button>
    </section>
  );
}

export function HomePage() {
  return (
    <main className="p-4">
      <ThemeToggle />
      <UserAction />
    </main>
  );
}
