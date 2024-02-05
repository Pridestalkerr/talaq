import type { db } from "@acme/db";
import type { Lucia } from "./types";

export type Adapter = Readonly<{
  getUser: (userId: Lucia.UserSelectSchema["id"]) => Promise<Lucia.UserSelectSchema | null>;
  setUser: ({
    user,
    key,
    transaction,
  }: {
    user: Lucia.UserInsertSchema;
    key: Omit<Lucia.KeyInsertSchema, "userId"> | null; // this does not require a userId field in key
    transaction?: typeof db;
  }) => Promise<Lucia.UserSelectSchema>; // i'd like this to return the created user :)
  updateUser: (
    userId: Lucia.UserSelectSchema["id"],
    partialUser: Partial<Lucia.UserInsertSchema>,
  ) => Promise<Lucia.UserSelectSchema>;
  deleteUser: (userId: Lucia.UserSelectSchema["id"]) => Promise<void>;

  getKey: (
    providerId: Lucia.KeySelectSchema["provider"],
    providerUserId: string,
  ) => Promise<Lucia.KeySelectSchema | null>;
  getKeysByUserId: (userId: Lucia.UserSelectSchema["id"]) => Promise<Lucia.KeySelectSchema[]>;
  setKey: (key: Lucia.KeyInsertSchema) => Promise<Lucia.KeySelectSchema>;
  updateKey: (
    provider: Lucia.KeySelectSchema["provider"],
    providerUserId: Lucia.KeySelectSchema["providerUserId"],
    partialKey: Partial<Lucia.KeyInsertSchema>,
  ) => Promise<Lucia.KeySelectSchema>;
  deleteKey: (
    providerId: Lucia.KeySelectSchema["provider"],
    providerUserId: Lucia.KeySelectSchema["providerUserId"],
  ) => Promise<void>;
  // deleteKeysByUserId: (userId: Lucia.UserSelectSchema["id"]) => Promise<void>;

  // getSession: (sessionId: Lucia.SessionSelectSchema["id"]) => Promise<Lucia.SessionSelectSchema | null>;
  getSessionsByUserId: (
    userId: Lucia.UserSelectSchema["id"],
  ) => Promise<Lucia.SessionSelectSchema[]>;
  setSession: (session: Lucia.SessionInsertSchema) => Promise<Lucia.SessionSelectSchema>;
  updateSession: (
    sessionId: Lucia.SessionSelectSchema["id"],
    partialSession: Partial<Lucia.SessionInsertSchema>,
  ) => Promise<Lucia.SessionSelectSchema>;
  deleteSession: (sessionId: Lucia.SessionSelectSchema["id"]) => Promise<void>;
  deleteSessionsByUserId: (
    userId: Lucia.UserSelectSchema["id"],
    sessionsToKeep: Lucia.SessionSelectSchema["id"][],
  ) => Promise<void>;

  // // can just return a mapped relation
  getSessionAndUser: (
    sessionId: string,
  ) => Promise<[Lucia.SessionSelectSchema, Lucia.UserSelectSchema] | [null, null]>;
}>;
