import { authKey, users } from "../../schemas";
import { db } from "../../src";
import { faker } from "@faker-js/faker";
import * as argon2 from "argon2";

const generateRandomUser = (): typeof users.$inferInsert => {
  return {
    email: faker.internet.email(),
    isAdmin: true,
  };
};

const seed = async () => {
  await db.transaction(async (trx) => {
    // await trx.delete(users);
    const [user] = await trx.insert(users).values(generateRandomUser()).returning();

    if (!user) {
      throw new Error("Failed to create user");
    }

    const password = faker.internet.password();

    await trx.insert(authKey).values({
      userId: user.id,
      provider: "EMAIL",
      providerUserId: user.email,
      hashedPassword: await argon2.hash(password),
    });

    console.log(`Created user with email: ${user.email} and password: ${password}`);
  });
};

seed()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
