import type {
  CodeConfirmationData,
  OAuthStorageProvider,
} from "@dkg/plugin-oauth";

import { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import { AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { clients, codes, tokens } from "./oauth";
import { eq } from "drizzle-orm";

export default class SqliteOAuthStorageProvider
  implements OAuthStorageProvider
{
  constructor(private db: BetterSQLite3Database) {}

  async getClient(id: string): Promise<OAuthClientInformationFull | undefined> {
    const client = await this.db
      .select()
      .from(clients)
      .where(eq(clients.client_id, id))
      .then((list) => list.at(0));
    if (!client) return undefined;

    return { client_id: client.client_id, ...JSON.parse(client.client_info) };
  }

  async saveClient(client: OAuthClientInformationFull): Promise<void> {
    const result = await this.db.insert(clients).values({
      client_id: client.client_id,
      client_info: JSON.stringify(client),
    });
    if (result.changes !== 1) throw new Error("Failed to save client");
  }

  async saveCode(
    code: string,
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
  ) {
    const result = await this.db.insert(codes).values({
      code,
      client_id: client.client_id,
      client_info: JSON.stringify(client),
      params: JSON.stringify(params),
      confirmed: "",
    });
    if (result.changes !== 1) throw new Error("Failed to save code");
  }

  async confirmCode(code: string, data: CodeConfirmationData) {
    const result = await this.db
      .update(codes)
      .set({ confirmed: JSON.stringify(data) })
      .where(eq(codes.code, code));
    if (result.changes !== 1) throw new Error("Failed to confirm code");
  }

  async getCodeData(code: string): Promise<
    | {
        client: OAuthClientInformationFull;
        params: AuthorizationParams;
        confirmation: false | CodeConfirmationData;
      }
    | undefined
    | null
  > {
    const result = await this.db
      .select()
      .from(codes)
      .where(eq(codes.code, code))
      .then((r) => r.at(0));
    if (!result) return null;

    return {
      client: JSON.parse(result.client_info),
      params: JSON.parse(result.params),
      confirmation: result.confirmed ? JSON.parse(result.confirmed) : false,
    };
  }

  async deleteCode(code: string): Promise<void> {
    await this.db.delete(codes).where(eq(codes.code, code));
  }

  async saveToken(token: string, tokenData: AuthInfo) {
    const result = await this.db.insert(tokens).values({
      token,
      client_id: tokenData.clientId,
      expires_at: tokenData.expiresAt || 0,
      scope: tokenData.scopes.join(" "),
      resource: tokenData.resource ? tokenData.resource.toString() : undefined,
      extra: tokenData.extra ? JSON.stringify(tokenData.extra) : undefined,
    });
    if (result.changes !== 1) throw new Error("Failed to save token");
  }

  async getTokenData(token: string): Promise<AuthInfo | undefined | null> {
    const result = await this.db
      .select()
      .from(tokens)
      .where(eq(tokens.token, token))
      .then((r) => r.at(0));
    if (!result) return null;

    return {
      token: result.token,
      clientId: result.client_id,
      expiresAt: result.expires_at,
      scopes: result.scope.split(" "),
      resource: result.resource ? new URL(result.resource) : undefined,
      extra: result.extra ? JSON.parse(result.extra) : undefined,
    };
  }

  async deleteToken(token: string): Promise<void> {
    await this.db.delete(tokens).where(eq(tokens.token, token));
  }
}
