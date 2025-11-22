import { CodeConfirmationData, OAuthStorageProvider } from "../makeProvider";

import { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import { AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export default class DemoOAuthStorageProvider implements OAuthStorageProvider {
  private _clients: Map<string, OAuthClientInformationFull> = new Map();
  private _codes: Map<
    string,
    {
      params: AuthorizationParams;
      client: OAuthClientInformationFull;
      confirmation: false | CodeConfirmationData;
    }
  > = new Map();
  private _tokens: Map<string, AuthInfo> = new Map();

  async getClient(id: string): Promise<OAuthClientInformationFull | undefined> {
    return this._clients.get(id);
  }

  async saveClient(client: OAuthClientInformationFull): Promise<void> {
    this._clients.set(client.client_id, client);
  }

  async saveCode(
    code: string,
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
  ) {
    this._codes.set(code, { params, client, confirmation: false });
  }

  async confirmCode(code: string, data: CodeConfirmationData) {
    this._codes.set(code, { ...this._codes.get(code)!, confirmation: data });
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
    return this._codes.get(code);
  }

  async deleteCode(code: string): Promise<void> {
    this._codes.delete(code);
  }

  async saveToken(token: string, tokenData: AuthInfo) {
    this._tokens.set(token, tokenData);
  }

  async getTokenData(token: string): Promise<AuthInfo | undefined | null> {
    return this._tokens.get(token);
  }

  async deleteToken(token: string): Promise<void> {
    this._tokens.delete(token);
  }
}
