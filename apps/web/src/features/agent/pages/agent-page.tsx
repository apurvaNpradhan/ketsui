import { useState } from "react";

import { AgentRuntimeProvider } from "../components/agent-runtime-provider";
import {
  AgentMobileSidebar,
  AgentPageHeader,
  AgentThread,
  AgentThreadList,
} from "../components/agent-thread";

export function AgentPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AgentRuntimeProvider>
      <main className="grid h-svh min-h-svh grid-rows-[3rem_minmax(0,1fr)] overflow-hidden md:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="hidden items-center gap-2 border-r border-b bg-muted/20 px-4 md:flex">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">Ketsui</span>
        </div>
        <AgentPageHeader onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <aside className="hidden min-h-0 overflow-y-auto border-r bg-muted/10 p-3 md:block">
          <div className="mb-3 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Conversations
          </div>
          <AgentThreadList />
        </aside>
        <section className="min-h-0 min-w-0">
          <AgentThread />
        </section>
        {mobileSidebarOpen ? (
          <AgentMobileSidebar onClose={() => setMobileSidebarOpen(false)} />
        ) : null}
      </main>
    </AgentRuntimeProvider>
  );
}
