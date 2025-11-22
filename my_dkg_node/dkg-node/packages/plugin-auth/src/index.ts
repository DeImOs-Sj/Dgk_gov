import { defineDkgPlugin } from "@dkg/plugins";
import { z } from "@dkg/plugins/helpers";
import type { express } from "@dkg/plugins/types";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { sign } from "jsonwebtoken";

type Scope = string[];

/**
 * @deprecated in favor of new "plugin-oauth" package
 */
export default <Credentials>({
  secret,
  schema,
  login,
  logout,
  expiresInSeconds: exp = 3600,
}: {
  secret: string;
  schema: z.Schema<Credentials>;
  login: (credentials: Credentials) => Promise<Scope>;
  logout?: () => Promise<void>;
  expiresInSeconds?: number;
}) =>
  defineDkgPlugin((ctx, mcp, api) => {
    passport.use(
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: secret,
          algorithms: ["HS256"],
        },
        (payload, done) => {
          done(null, payload);
        },
      ),
    );

    api.post("/login", async (req, res) => {
      try {
        const credentials = schema.parse(req.body);
        const scope = await login(credentials).then((arr) => arr.join(" "));
        const token = sign(
          { scope, exp: Math.floor(Date.now() / 1000) + exp },
          secret,
          { algorithm: "HS256" },
        );

        res.json({ token });
      } catch {
        res.status(401).json({ error: "Invalid credentials." });
      }
    });

    api.post("/logout", async (_, res) => {
      if (logout) await logout();
      res.status(200);
    });
  });

export const authorized =
  (scope: Scope): express.RequestHandler =>
  (req, res, next) =>
    passport.authenticate(
      "jwt",
      {},
      (err: unknown, user: Record<string, string> | false) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: "Unauthorized." });

        const userScope = user.scope?.split(" ") ?? [];
        if (scope.some((s) => !userScope.includes(s))) {
          return res.status(403).json({ error: "Forbidden." });
        }

        req.user = user;
        next();
      },
    )(req, res, next);
