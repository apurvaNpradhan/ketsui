import "@tanstack/react-start/server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { db } from "@repo/db";
import * as schema from "@repo/db/schema";
import { betterAuth } from "better-auth/minimal";
import { jwt } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  telemetry: {
    enabled: false,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // https://better-auth.com/docs/integrations/tanstack#usage-tips
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL,
        audience: process.env.BETTER_AUTH_URL,
        definePayload: ({ user }) => ({
          email: user.email,
          name: user.name,
        }),
      },
    }),
    tanstackStartCookies(),
  ],

  // https://better-auth.com/docs/concepts/session-management#session-caching
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // https://better-auth.com/docs/concepts/oauth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // https://better-auth.com/docs/authentication/email-password
  emailAndPassword: {
    enabled: true,
  },

  advanced: {
    database: {
      // https://better-auth.com/docs/adapters/drizzle#joins
      joins: true,
    },
  },
});
