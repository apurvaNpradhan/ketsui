import { createLazyFileRoute } from "@tanstack/react-router";

import { AgentPage } from "#/features/agent/pages/agent-page";

export const Route = createLazyFileRoute("/_auth/agent")({
  component: AgentPage,
});
