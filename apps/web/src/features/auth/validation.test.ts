import { describe, expect, it } from "vite-plus/test";

import { loginSchema, signupSchema } from "./validation";

describe("auth validation", () => {
  it("accepts valid login details", () => {
    expect(
      loginSchema.safeParse({ email: "hello@example.com", password: "password" }).success,
    ).toBe(true);
  });

  it("rejects invalid email and empty password", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "" }).success).toBe(false);
  });

  it("requires matching signup passwords", () => {
    expect(
      signupSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });
});
