import { env } from "@acme/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import schema from "../schemas";

const queryClient = postgres(env.DATABASE_URI);
export const db = drizzle(queryClient, { schema, logger: true });

export const schemas = { ...schema };
