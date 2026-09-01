import { auth } from "@repo/auth/auth";
import { createFileRoute } from "@tanstack/react-router";

import {
  buildBackendUrl,
  filterResponseHeaders,
  readProxyBody,
  RequestBodyTooLargeError,
} from "#/lib/api/proxy.ts";

const methods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function proxy(request: Request): Promise<Response> {
  const origin = process.env.FASTAPI_ORIGIN;
  if (!origin) {
    return new Response("FASTAPI_ORIGIN is not configured", { status: 500 });
  }

  if (unsafeMethods.has(request.method)) {
    const requestOrigin = request.headers.get("origin");
    const authOrigin = process.env.BETTER_AUTH_URL;
    if (requestOrigin && authOrigin && requestOrigin !== new URL(authOrigin).origin) {
      return Response.json({ detail: "Invalid request origin" }, { status: 403 });
    }

    try {
      const session = await auth.api.getSession({
        headers: request.headers,
        query: { disableCookieCache: true },
      });
      if (!session) throw new Error("Unauthorized");
    } catch {
      return Response.json(
        { detail: "Unauthorized" },
        {
          status: 401,
          headers: { "WWW-Authenticate": "Bearer" },
        },
      );
    }
  }

  let token: string;
  try {
    ({ token } = await auth.api.getToken({ headers: request.headers }));
  } catch {
    return Response.json(
      { detail: "Unauthorized" },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer" },
      },
    );
  }

  try {
    const response = await fetch(buildBackendUrl(request.url, origin), {
      method: request.method,
      headers: (() => {
        const headers = new Headers(request.headers);
        for (const name of [
          "authorization",
          "cookie",
          "host",
          "connection",
          "content-length",
          "transfer-encoding",
          "upgrade",
          "x-forwarded-for",
          "x-forwarded-host",
          "x-forwarded-proto",
        ]) {
          headers.delete(name);
        }
        headers.set("authorization", `Bearer ${token}`);
        headers.set("accept-encoding", "identity");
        return headers;
      })(),
      body: await readProxyBody(request),
      redirect: "manual",
      signal: request.signal,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: filterResponseHeaders(response.headers),
    });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ detail: "Request body too large" }, { status: 413 });
    }
    return Response.json({ detail: "Backend unavailable" }, { status: 502 });
  }
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: Object.fromEntries(
      methods.map((method) => [method, ({ request }) => proxy(request)]),
    ),
  },
});
