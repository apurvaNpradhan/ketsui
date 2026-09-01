import { authQueryOptions } from "@repo/auth/tanstack/queries";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { GalleryVerticalEndIcon } from "lucide-react";

export const Route = createFileRoute("/_guest")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    // Redirect path when user is already present,
    // or after successful login/signup
    const REDIRECT_URL = "/app";

    const user = await context.queryClient.query({
      ...authQueryOptions(),
      staleTime: "static",
    });
    void context.queryClient.query(authQueryOptions());

    if (user) {
      throw redirect({
        to: REDIRECT_URL,
      });
    }

    return {
      redirectUrl: REDIRECT_URL,
    };
  },
});

function RouteComponent() {
  return (
    <div className="xs:px-0 relative mx-auto flex h-svh w-dvw max-w-sm flex-col justify-center gap-y-6 px-4">
      <header className="absolute inset-x-0 top-6 flex justify-center">
        <Link
          to="/"
          aria-label="Katsui. home"
          className="mx-auto flex items-center gap-2 font-semibold tracking-tight"
        >
          Katsui
        </Link>
      </header>
      <Outlet />
    </div>
  );
}
