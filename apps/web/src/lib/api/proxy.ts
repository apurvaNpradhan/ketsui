const MAX_PROXY_BODY_BYTES = 1024 * 1024;

const HOP_BY_HOP_RESPONSE_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "set-cookie",
  "location",
];

export class RequestBodyTooLargeError extends Error {}

export function buildBackendUrl(requestUrl: string, origin: string): URL {
  const incomingUrl = new URL(requestUrl);
  const backendUrl = new URL(origin);
  backendUrl.pathname = incomingUrl.pathname.slice("/api".length) || "/";
  backendUrl.search = incomingUrl.search;
  return backendUrl;
}

export function filterResponseHeaders(headers: Headers): Headers {
  const filtered = new Headers(headers);
  for (const name of HOP_BY_HOP_RESPONSE_HEADERS) filtered.delete(name);
  filtered.delete("content-length");
  return filtered;
}

export async function readProxyBody(request: Request): Promise<ArrayBuffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") return undefined;

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_PROXY_BODY_BYTES) {
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) return new ArrayBuffer(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PROXY_BODY_BYTES) throw new RequestBodyTooLargeError();
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}
