import { createMiddleware, createStart } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

const cspMiddleware = createMiddleware().server(({ next, request }) => {
  if (request.method !== "GET") return next();

  const nonce = crypto.randomUUID();
  setResponseHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`,
  );

  return next({ context: { nonce } });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [cspMiddleware],
}));
