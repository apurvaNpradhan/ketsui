import { $api } from "#/lib/api/client";

export function useCurrentUser() {
  return $api.useQuery("get", "/v1/users/me");
}
