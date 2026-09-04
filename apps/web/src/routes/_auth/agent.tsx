import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/agent")({
  head: () => ({
    meta: [{ title: "Agent · Ketsui" }],
  }),
});
