import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "@acme/env";

console.log(env.DATABASE_URI);

const migrationClient = postgres(env.DATABASE_URI, { max: 1 });
const db: PostgresJsDatabase = drizzle(migrationClient);

void (async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migration complete");
  process.exit(0);
})();
