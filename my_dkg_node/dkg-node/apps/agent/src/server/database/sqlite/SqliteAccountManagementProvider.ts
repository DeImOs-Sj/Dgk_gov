import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { hash, verify } from "@node-rs/argon2";
import { v4 as uuid_v4 } from "uuid";
import { eq } from "drizzle-orm";

import { AccountManagementProvider } from "@/server/accountManagementPlugin";
import { users, passwordResets as pwResets } from "./users";

export default class SqliteAccountManagementProvider
  implements AccountManagementProvider
{
  constructor(private db: BetterSQLite3Database) {}

  async setPassword(userId: string, plainPassword: string) {
    const password = await hash(plainPassword);
    await this.db.update(users).set({ password }).where(eq(users.id, userId));
    await this.db.delete(pwResets).where(eq(pwResets.userId, userId));
  }

  async verifyPassword(userId: string, plainPassword: string) {
    const u = await this.db.select().from(users).where(eq(users.id, userId));
    if (!u[0]) return false;
    return verify(u[0].password, plainPassword);
  }

  async generateCode(email: string) {
    const u = await this.db.select().from(users).where(eq(users.email, email));
    if (!u[0]) return null;

    const code = uuid_v4();
    await this.db.insert(pwResets).values({
      code,
      userId: u[0].id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    return code;
  }

  async verifyCode(code: string) {
    const r = await this.db
      .select()
      .from(pwResets)
      .where(eq(pwResets.code, code));
    if (!r[0]) return null;
    return { userId: r[0].userId };
  }

  async setInfo(
    userId: string,
    info: { firstName: string; lastName: string; email: string },
  ) {
    await this.db.update(users).set(info).where(eq(users.id, userId));
  }

  async getInfo(userId: string) {
    const u = await this.db.select().from(users).where(eq(users.id, userId));
    if (!u[0]) return null;
    return {
      firstName: u[0].firstName,
      lastName: u[0].lastName,
      email: u[0].email,
    };
  }
}
