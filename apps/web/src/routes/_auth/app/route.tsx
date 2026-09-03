import { createFileRoute } from "@tanstack/react-router";

import { AccountLayout } from "#/features/account/components/account-layout";

export const Route = createFileRoute("/_auth/app")({
  component: AccountLayout,
});
