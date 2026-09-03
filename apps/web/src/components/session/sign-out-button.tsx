import { authClient } from "@repo/auth/auth-client";
import { authQueryOptions } from "@repo/auth/tanstack/queries";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

export function SignOutButton() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const signOut = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: async () => {
      queryClient.setQueryData(authQueryOptions().queryKey, null);
      await router.invalidate();
    },
    onError: (error) => {
      toast.add({
        type: "error",
        description: error.message || "Could not sign out.",
      });
    },
  });

  return (
    <Button
      onClick={() => signOut.mutate()}
      type="button"
      className="w-fit"
      variant="destructive"
      size="lg"
      disabled={signOut.isPending}
    >
      {signOut.isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
