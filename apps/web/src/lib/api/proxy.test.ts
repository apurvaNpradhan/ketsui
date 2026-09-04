import { describe, expect, it } from "vitest";

import {
  buildBackendUrl,
  filterResponseHeaders,
  readProxyBody,
  RequestBodyTooLargeError,
} from "./proxy";

describe("API proxy helpers", () => {
  it("maps the /api prefix and preserves the query string", () => {
    expect(
      buildBackendUrl("https://web.test/api/v1/items?limit=10", "http://backend:8000").toString(),
    ).toBe("http://backend:8000/v1/items?limit=10");
  });

  it("removes response headers that must not cross the proxy", () => {
    const headers = filterResponseHeaders(
      new Headers({
        "content-type": "application/json",
        "set-cookie": "session=secret",
        location: "http://backend:8000/login",
        connection: "keep-alive",
      }),
    );

    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("set-cookie")).toBeNull();
    expect(headers.get("location")).toBeNull();
    expect(headers.get("connection")).toBeNull();
  });

  it("rejects oversized request bodies", async () => {
    const body = new Uint8Array(1024 * 1024 + 1);
    await expect(
      readProxyBody(new Request("https://web.test/api/items", { method: "POST", body })),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});
