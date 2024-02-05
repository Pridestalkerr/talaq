import type { authKey, session, users } from "@acme/db/schemas";

type SelectUser = typeof users.$inferSelect;
type SelectSession = typeof session.$inferSelect;
type SelectKey = typeof authKey.$inferSelect;
type InsertUser = typeof users.$inferInsert;
type InsertSession = typeof session.$inferInsert;
type InsertKey = typeof authKey.$inferInsert;

declare namespace Lucia {
  export type UserSelectSchema = SelectUser;
  export type UserInsertSchema = InsertUser;
  export type KeySelectSchema = SelectKey;
  export type KeyInsertSchema = InsertKey;
  export type SessionSelectSchema = SelectSession;
  export type SessionInsertSchema = InsertSession;
}
