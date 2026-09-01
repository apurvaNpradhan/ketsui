import { authClient } from "@repo/auth/auth-client";
import { authQueryOptions } from "@repo/auth/tanstack/queries";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

export function SignOutButton() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      onClick={async () => {
        if (isPending) return;
        setIsPending(true);
        try {
          const result = await authClient.signOut();
          if (result.error) throw new Error(result.error.message);
          queryClient.setQueryData(authQueryOptions().queryKey, null);
          await router.invalidate();
        } catch (error) {
          toast.add({
            type: "error",
            description: error instanceof Error ? error.message : "Could not sign out.",
          });
        } finally {
          setIsPending(false);
        }
      }}
      type="button"
      className="w-fit"
      variant="destructive"
      size="lg"
      disabled={isPending}
    >
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
