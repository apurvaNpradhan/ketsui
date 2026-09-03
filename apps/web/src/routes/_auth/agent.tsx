import { createFileRoute } from "@tanstack/react-router";

import { AgentPage } from "#/features/agent/pages/agent-page";

export const Route = createFileRoute("/_auth/agent")({
  component: AgentPage,
  head: () => ({
    meta: [{ title: "Agent · Ketsui" }],
  }),
});
