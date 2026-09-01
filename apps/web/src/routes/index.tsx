import { useAuthSuspense } from "@repo/auth/tanstack/hooks";
import { Button } from "@repo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";

import { SignOutButton } from "#/components/sign-out-button.tsx";
import { ThemeToggle } from "#/components/theme-toggle.tsx";

export const Route = createFileRoute("/")({
  component: HomePage,
});
function UserAction() {
  const { user } = useAuthSuspense();

  return user ? (
    <section className="mb-20 flex flex-col items-center space-y-1.5">
      <div className="mb-4 flex w-full items-center gap-2">
        <div className="size-2 animate-pulse rounded-full bg-primary"></div>
        <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Session
        </h2>
      </div>
      <div className="mb-3 w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-border"></div>
            <div className="size-2.5 rounded-full bg-border"></div>
            <div className="size-2.5 rounded-full bg-border"></div>
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">
              useAuthSuspense() data
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/70 uppercase">ReadOnly</span>
        </div>
        <div className="overflow-x-auto p-6">
          <pre className="font-mono text-xs leading-relaxed text-foreground/80">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>

      <Button render={<Link to="/login" />} className="w-fit" size="lg" nativeButton={false}>
        Go to /app
      </Button>
      <SignOutButton />
    </section>
  ) : (
    <section className="mb-20 space-y-1 text-center">
      <p>You are not signed in.</p>
      <Button render={<Link to="/login" />} className="w-fit" size="lg" nativeButton={false}>
        Log in
      </Button>
    </section>
  );
}

function HomePage() {
  return (
    <div>
      <ThemeToggle />
      <UserAction />
    </div>
  );
}
