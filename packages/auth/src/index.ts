import type { Adapter } from "./adapter";
import { hashA2, validateA2Hash } from "./utils/crypto";
import { db } from "@acme/db";
import { and, eq, notInArray } from "drizzle-orm";
import { isValidDatabaseSession } from "./session";
import { isWithinExpiration } from "./utils/date";
import { generateRandomString } from "./utils/nanoid";
import type { Lucia } from "./types";
import type { SessionBase } from "./database";
import schemas from "@acme/db/schemas";

// type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
// type EnsureMatchingTypes<Base, Derived extends Partial<Base>> = {
//   [P in keyof Base]: P extends keyof Derived ? Derived[P] : Base[P];
// } & Derived;

declare const brandSymbol: unique symbol;

// typescript shenanigans
type StrictOmit<T, K extends keyof T> = Omit<T, K> & { [brandSymbol]?: never };

export class ATK {
  private adapter: Adapter;

  public passwordHash = {
    generate: hashA2,
    validate: validateA2Hash,
  };

  private sessionExpiresIn = {
    activePeriod: 1000 * 60 * 60 * 24, // 1 day
    idlePeriod: 1000 * 60 * 60 * 24 * 14, // 14 days
  };

  constructor(adapter: Adapter) {
    this.adapter = adapter;
  }

  private getDatabaseUser = async (userId: Lucia.UserSelectSchema["id"]) => {
    const databaseUser = await this.adapter.getUser(userId);
    if (!databaseUser) throw new Error("user.account_not_found");
    return databaseUser;
  };

  // could make this return the relational mapping instead of array
  private getDatabaseSessionAndUser = async (
    sessionId: Lucia.SessionSelectSchema["id"],
  ): Promise<[Lucia.SessionSelectSchema, Lucia.UserSelectSchema]> => {
    const [databaseSession, databaseUser] = await this.adapter.getSessionAndUser(sessionId);
    if (!databaseSession) throw new Error("user.session_not_found");
    if (!isValidDatabaseSession(databaseSession.idleExpires))
      throw new Error("user.session_expired");
    if (!databaseUser)
      throw new Error("Internal server error: User not found (this should not happen)");
    return [databaseSession, databaseUser];
  };

  private getNewSessionExpiration = (sessionExpiresIn?: {
    activePeriod: number;
    idlePeriod: number;
  }): {
    activePeriodExpiresAt: Date;
    idlePeriodExpiresAt: Date;
  } => {
    const activePeriodExpiresAt = new Date(
      new Date().getTime() + (sessionExpiresIn?.activePeriod ?? this.sessionExpiresIn.activePeriod),
    );
    const idlePeriodExpiresAt = new Date(
      activePeriodExpiresAt.getTime() +
        (sessionExpiresIn?.idlePeriod ?? this.sessionExpiresIn.idlePeriod),
    );
    return { activePeriodExpiresAt, idlePeriodExpiresAt };
  };

  public getUser = async (userId: Lucia.UserSelectSchema["id"]) => {
    const databaseUser = await this.getDatabaseUser(userId);
    return databaseUser; // this is not joined :/
  };

  public createUser = async ({
    key,
    attributes,
    transaction,
  }: {
    key:
      | (StrictOmit<Lucia.KeyInsertSchema, "userId" | "hashedPassword"> & {
          password: string | null;
        })
      | null;
    attributes: Lucia.UserInsertSchema;
    transaction?: typeof db;
  }) => {
    if (key === null) {
      const databaseUser = await this.adapter.setUser({
        user: attributes,
        key: null,
        transaction,
      });
      return databaseUser;
    }
    const hashedPassword =
      key.password === null ? null : await this.passwordHash.generate(key.password);
    const databaseUser = await this.adapter.setUser({
      user: attributes,
      transaction,
      key: {
        ...key,
        hashedPassword,
      },
    });
    return databaseUser;
  };

  public updateUserAttributes = async (
    userId: Lucia.UserSelectSchema["id"],
    attributes: Partial<Lucia.UserInsertSchema>,
  ) => {
    await this.adapter.updateUser(userId, attributes);
    return await this.getDatabaseUser(userId);
  };

  public deleteUser = async (userId: Lucia.UserSelectSchema["id"]): Promise<void> => {
    // this may be performed with a cascade, currently restricted
    await this.adapter.deleteUser(userId);
  };

  public useKey = async ({
    providerId,
    providerUserId,
    password,
  }: {
    providerId: Lucia.KeySelectSchema["provider"];
    providerUserId: Lucia.KeySelectSchema["providerUserId"];
    password: string | null;
  }): Promise<Lucia.KeySelectSchema> => {
    const databaseKey = await this.adapter.getKey(providerId, providerUserId);
    if (!databaseKey) throw new Error("user.account_not_found");
    const hashedPassword = databaseKey.hashedPassword;
    if (hashedPassword) {
      if (password === null) throw new Error("user.password_required");
      const isValid = await this.passwordHash.validate(password, hashedPassword);
      if (!isValid) throw new Error("user.account_not_found");
    }
    return databaseKey;
  };

  public getSession = async (
    sessionId: Lucia.SessionSelectSchema["id"],
  ): Promise<
    Lucia.SessionSelectSchema & {
      user: Lucia.UserSelectSchema;
      fresh: boolean; // what does this mean?
    }
    // intellisense fail below from prettier?
  > => {
    const [databaseSession, databaseUser] = await this.getDatabaseSessionAndUser(sessionId);
    return { ...databaseSession, user: databaseUser, fresh: false };
  };

  // TODO: can use query engine instead (not sure if the transaction is necessary, please review)
  public getAllUserSessions = async (
    userId: Lucia.UserSelectSchema["id"],
  ): Promise<(Lucia.SessionSelectSchema & { fresh: boolean })[]> => {
    // maybe check if userId still exists in order to throw?
    const databaseSessions = await this.adapter.getSessionsByUserId(userId);
    return databaseSessions
      .filter((session) => {
        return isValidDatabaseSession(session.idleExpires);
      })
      .map((session) => {
        return { ...session, fresh: false };
      });
  };

  public validateSession = async (
    sessionId: Lucia.SessionSelectSchema["id"],
  ): Promise<
    Lucia.SessionSelectSchema & {
      user: Lucia.UserSelectSchema;
      fresh: boolean;
    }
  > => {
    const [databaseSession, databaseUser] = await this.getDatabaseSessionAndUser(sessionId);
    const active = isWithinExpiration(databaseSession.activeExpires.getTime());
    if (active) {
      return { ...databaseSession, user: databaseUser, fresh: false };
    }
    const { activePeriodExpiresAt, idlePeriodExpiresAt } = this.getNewSessionExpiration();

    // this is required because of some typescript cancer which took me 30 minutes to figure out
    // direct property assignment works without errors, but the object literal initialization does not
    const updateData: Partial<Lucia.SessionInsertSchema> = {};
    updateData.activeExpires = activePeriodExpiresAt;
    updateData.idleExpires = idlePeriodExpiresAt;

    await this.adapter.updateSession(databaseSession.id, updateData);
    return {
      ...databaseSession,
      user: databaseUser,
      fresh: true,
      activeExpires: activePeriodExpiresAt,
      idleExpires: idlePeriodExpiresAt,
    };
  };

  public createSession = async ({
    userId,
    attributes,
    sessionId,
  }: {
    userId: Lucia.UserSelectSchema["id"];
    attributes: StrictOmit<
      Lucia.SessionInsertSchema,
      "id" | "userId" | "activeExpires" | "idleExpires" | "csrfToken"
    >;
    sessionId?: Lucia.SessionInsertSchema["id"];
  }): Promise<
    Lucia.SessionSelectSchema & {
      user: Lucia.UserSelectSchema;
      fresh: boolean;
    }
  > => {
    const { activePeriodExpiresAt, idlePeriodExpiresAt } = this.getNewSessionExpiration();
    const token = sessionId ?? generateRandomString(40);
    const databaseUser = await this.getUser(userId);
    if (!databaseUser) throw new Error("user.account_not_found");

    const databaseSession = await this.adapter.setSession({
      ...attributes,
      id: token,
      userId: databaseUser.id,
      activeExpires: activePeriodExpiresAt,
      idleExpires: idlePeriodExpiresAt,
    });

    return {
      ...databaseSession,
      user: databaseUser,
      fresh: false,
      activeExpires: activePeriodExpiresAt,
      idleExpires: idlePeriodExpiresAt,
    };
  };

  public updateSessionAttributes = async (
    sessionId: Lucia.SessionSelectSchema["id"],
    attributes: Omit<Partial<Lucia.SessionInsertSchema>, keyof SessionBase>,
  ): Promise<Lucia.SessionSelectSchema> => {
    return this.adapter.updateSession(sessionId, attributes);
  };

  public invalidateSession = async (sessionId: Lucia.SessionSelectSchema["id"]): Promise<void> => {
    return this.adapter.deleteSession(sessionId);
  };

  public invalidateAllUserSessions = async (
    userId: Lucia.UserSelectSchema["id"],
    sessionsToKeep: Lucia.SessionSelectSchema["id"][] = [],
  ): Promise<void> => {
    return this.adapter.deleteSessionsByUserId(userId, sessionsToKeep);
  };

  public deleteDeadUserSessions = async (userId: Lucia.UserSelectSchema["id"]): Promise<void> => {
    const databaseSessions = await this.adapter.getSessionsByUserId(userId);
    const deadSessions = databaseSessions.filter((session) => {
      return !isValidDatabaseSession(session.idleExpires);
    });
    // TODO: do it in a transaction for good measure
    await Promise.all(
      deadSessions.map(async (session) => {
        await this.adapter.deleteSession(session.id);
      }),
    );
  };

  public createKey = async ({
    userId,
    providerId,
    providerUserId,
    password,
  }: {
    userId: Lucia.UserSelectSchema["id"];
    providerId: Lucia.KeyInsertSchema["provider"];
    providerUserId: Lucia.KeyInsertSchema["providerUserId"];
    password: string | null;
  }): Promise<Lucia.KeySelectSchema> => {
    let hashedPassword: string | null = null;
    if (password !== null) {
      hashedPassword = await this.passwordHash.generate(password);
    }
    const databaseKey = await this.adapter.setKey({
      userId,
      provider: providerId,
      providerUserId,
      hashedPassword,
    });
    return databaseKey;
  };

  public deleteKey = async (
    providerId: Lucia.KeyInsertSchema["provider"],
    providerUserId: Lucia.KeyInsertSchema["providerUserId"],
  ): Promise<void> => {
    return this.adapter.deleteKey(providerId, providerUserId);
  };

  public getKey = async (
    providerId: Lucia.KeyInsertSchema["provider"],
    providerUserId: Lucia.KeyInsertSchema["providerUserId"],
  ): Promise<Lucia.KeySelectSchema> => {
    const databaseKey = await this.adapter.getKey(providerId, providerUserId);
    if (!databaseKey) throw new Error("user.account_not_found");
    return databaseKey;
  };

  public getAllUserKeys = async (
    userId: Lucia.UserSelectSchema["id"],
  ): Promise<Lucia.KeySelectSchema[]> => {
    const databaseUser = await this.getUser(userId);
    if (!databaseUser) throw new Error("user.account_not_found");
    return this.adapter.getKeysByUserId(userId);
  };

  public updateKeyPassword = async (
    providerId: Lucia.KeyInsertSchema["provider"],
    providerUserId: Lucia.KeyInsertSchema["providerUserId"],
    password: string | null,
  ): Promise<Lucia.KeySelectSchema> => {
    const hashedPassword = password === null ? null : await this.passwordHash.generate(password);
    return await this.adapter.updateKey(providerId, providerUserId, {
      // TODO: this will fail if name changes!
      hashedPassword: hashedPassword,
    });
  };
}

// consider moving to promise api to allow outer await
export const auth = new ATK({
  getUser: async (userId) => {
    const databaseUser = await db.query.users.findFirst({
      where: eq(schemas.users.id, userId),
    });
    return databaseUser ?? null;
  },
  setUser: async ({ user, key, transaction }) => {
    if (!key) {
      const databaseUser = (
        await (transaction ?? db)
          .insert(schemas.users)
          .values({
            ...user,
          })
          .returning()
      )[0]; // prob no need to check index as it should throw in case
      if (!databaseUser) throw new Error("Couldn't create user");
      return databaseUser;
    }

    return await db.transaction(async (tx) => {
      const databaseUser = (
        await tx
          .insert(schemas.users)
          .values({
            ...user,
          })
          .returning()
      )[0]; // prob no need to check index as it should throw in case
      if (!databaseUser) throw new Error("Couldn't create user");

      const databaseKey = (
        await tx
          .insert(schemas.authKey)
          .values({
            ...key,
            userId: databaseUser.id,
          })
          .returning()
      )[0];
      if (!databaseKey) throw new Error("Couldn't create key");

      return databaseUser;
    });
  },
  updateUser: async (userId, partialUser) => {
    const databaseUser = (
      await db
        .update(schemas.users)
        .set({
          ...partialUser,
        })
        .where(eq(schemas.users.id, userId))
        .returning()
    )[0];
    if (!databaseUser) throw new Error("Couldn't update user");
    return databaseUser;
  },
  deleteUser: async (userId) => {
    await db.transaction(async (tx) => {
      // ondelete is restricted
      await tx.delete(schemas.session).where(eq(schemas.session.userId, userId));
      await tx.delete(schemas.authKey).where(eq(schemas.authKey.userId, userId));
      await tx.delete(schemas.users).where(eq(schemas.users.id, userId));
    });
  },
  getKey: async (providerId, providerUserId) => {
    const databaseKey = await db.query.authKey.findFirst({
      where: and(
        eq(schemas.authKey.provider, providerId),
        eq(schemas.authKey.providerUserId, providerUserId),
      ),
    });

    return databaseKey ?? null;
  },
  getSessionAndUser: async (sessionId) => {
    const databaseSession = await db.query.session.findFirst({
      where: eq(schemas.session.id, sessionId),
      with: {
        user: true,
      },
    });

    if (!databaseSession?.user) return [null, null];

    return [databaseSession, databaseSession.user];
  },
  getSessionsByUserId: async (userId) => {
    const databaseSessions = await db.query.session.findMany({
      where: eq(schemas.session.userId, userId),
    });
    return databaseSessions;
  },
  updateSession: async (sessionId, partialSession) => {
    const databaseSession = await db
      .update(schemas.session)
      .set(partialSession)
      .where(eq(schemas.session.id, sessionId))
      .returning();
    if (!databaseSession[0]) throw new Error("Couldn't update session");
    return databaseSession[0];
  },
  setSession: async (session) => {
    const databaseSession = (
      await db
        .insert(schemas.session)
        .values({ ...session })
        .returning()
    )[0];
    if (!databaseSession) throw new Error("Couldn't create session");
    return databaseSession;
  },
  deleteSession: async (sessionId) => {
    await db.delete(schemas.session).where(eq(schemas.session.id, sessionId));
  },
  deleteSessionsByUserId: async (userId, sessionsToKeep) => {
    await db
      .delete(schemas.session)
      .where(
        and(eq(schemas.session.userId, userId), notInArray(schemas.session.id, sessionsToKeep)),
      );
  },
  setKey: async (key) => {
    const databaseKey = (
      await db
        .insert(schemas.authKey)
        .values({ ...key })
        .returning()
    )[0];
    if (!databaseKey) throw new Error("Couldn't create key");
    return databaseKey;
  },
  deleteKey: async (providerId, providerUserId) => {
    await db
      .delete(schemas.authKey)
      .where(
        and(
          eq(schemas.authKey.provider, providerId),
          eq(schemas.authKey.providerUserId, providerUserId),
        ),
      );
  },
  getKeysByUserId: async (userId) => {
    const databaseKeys = await db.query.authKey.findMany({
      where: eq(schemas.authKey.userId, userId),
    });
    return databaseKeys;
  },
  updateKey: async (providerId, providerUserId, partialKey) => {
    const databaseKey = await db
      .update(schemas.authKey)
      .set(partialKey)
      .where(
        and(
          eq(schemas.authKey.provider, providerId),
          eq(schemas.authKey.providerUserId, providerUserId),
        ),
      )
      .returning();
    if (!databaseKey[0]) throw new Error("Couldn't update key");
    return databaseKey[0];
  },
});
