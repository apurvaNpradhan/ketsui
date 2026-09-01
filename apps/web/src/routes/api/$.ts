import { auth } from "@repo/auth/auth";
import { createFileRoute } from "@tanstack/react-router";

const methods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

async function proxy(request: Request): Promise<Response> {
  const origin = process.env.FASTAPI_ORIGIN;
  if (!origin) {
    return new Response("FASTAPI_ORIGIN is not configured", { status: 500 });
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

  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(origin);
  backendUrl.pathname = incomingUrl.pathname.slice("/api".length) || "/";
  backendUrl.search = incomingUrl.search;

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

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
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
