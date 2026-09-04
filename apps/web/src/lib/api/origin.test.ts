import { describe, expect, it } from "vitest";

import { isTrustedOrigin } from "./origin";

describe("isTrustedOrigin", () => {
  it("requires a matching origin", () => {
    expect(isTrustedOrigin("https://app.example.com", "https://app.example.com")).toBe(true);
    expect(isTrustedOrigin("https://evil.example.com", "https://app.example.com")).toBe(false);
  });

  it("rejects missing or malformed origins", () => {
    expect(isTrustedOrigin(null, "https://app.example.com")).toBe(false);
    expect(isTrustedOrigin("https://app.example.com", undefined)).toBe(false);
    expect(isTrustedOrigin("null", "https://app.example.com")).toBe(false);
  });
});
