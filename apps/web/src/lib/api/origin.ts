export function isTrustedOrigin(requestOrigin: string | null, trustedOrigin: string | undefined) {
  if (!requestOrigin || !trustedOrigin) return false;

  try {
    return new URL(requestOrigin).origin === new URL(trustedOrigin).origin;
  } catch {
    return false;
  }
}
