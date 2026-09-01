import { useAuthSuspense } from "@repo/auth/tanstack/hooks";
import { createFileRoute } from "@tanstack/react-router";

import { $api } from "#/lib/api/client.ts";

export const Route = createFileRoute("/_auth/app/")({
  component: AppIndex,
});

function AppIndex() {
  const { user } = useAuthSuspense();
  const { data: backendUser, error, isPending } = $api.useQuery("get", "/v1/users/me");

  if (isPending) return <p className="text-sm">Loading profile…</p>;
  if (error || !backendUser) {
    return (
      <p className="text-sm text-destructive">The backend user profile could not be loaded.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        Session user:
        <span className="mt-0.5 block font-mono text-xs">{user?.name}</span>
      </div>

      <div>
        <h2 className="font-medium">Backend user profile</h2>

        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="font-medium">ID</dt>
          <dd className="font-mono">{backendUser.id}</dd>

          <dt className="font-medium">Email</dt>
          <dd>{backendUser.email}</dd>

          <dt className="font-medium">Name</dt>
          <dd>{backendUser.name}</dd>
        </dl>
      </div>
    </div>
  );
}
