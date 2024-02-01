import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]),
    API_PORT: z.coerce.number(),
    DATABASE_URI: z.string().url(),
    CLIENT_HOST: z.string().url(), // useful for CORS
    API_HOST: z.string().url(),
    API_ENDPOINT: z.string(),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    // do add the prefix to the keys here
    NEXT_PUBLIC_API_HOST: z.string().url(),
    NEXT_PUBLIC_API_ENDPOINT: z.string(),
  },
  runtimeEnv: {
    ...process.env,
    NEXT_PUBLIC_API_HOST: process.env.API_HOST,
    NEXT_PUBLIC_API_ENDPOINT: process.env.API_ENDPOINT,
  },
});
