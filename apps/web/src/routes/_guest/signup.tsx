import { createFileRoute } from "@tanstack/react-router";

import { SignupPage } from "#/features/auth/pages/signup-page";

export const Route = createFileRoute("/_guest/signup")({
  component: SignupRoute,
});

function SignupRoute() {
  const { redirectUrl } = Route.useRouteContext();
  return <SignupPage redirectUrl={redirectUrl} />;
}
