import type { Config } from "drizzle-kit";
import { env } from "@acme/env";

export default {
  schema: "./schemas/*",
  out: "./drizzle",
  driver: "pg",
  verbose: true,
  dbCredentials: {
    connectionString: env.DATABASE_URI,
  },
  strict: false,
} satisfies Config;
