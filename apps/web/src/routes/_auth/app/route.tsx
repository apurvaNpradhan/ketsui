import { Button } from "@repo/ui/components/button";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { SignOutButton } from "#/components/sign-out-button.tsx";
import { ThemeToggle } from "#/components/theme-toggle.tsx";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 px-2">
      <div className="flex w-full max-w-3xl justify-between">
        <Button render={<Link to="/" />} size="sm" nativeButton={false}>
          Back to home
        </Button>
        <ThemeToggle />
      </div>
      <div className="w-full max-w-3xl rounded-md border p-2">
        <h1 className="sr-only">Your account</h1>
        <Outlet />
      </div>

      <div className="flex w-full max-w-3xl flex-wrap justify-between gap-2 text-sm">
        <SignOutButton />
      </div>
    </main>
  );
}
