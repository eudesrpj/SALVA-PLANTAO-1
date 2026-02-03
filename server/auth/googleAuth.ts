import type { Express, Request, Response } from "express";
import * as openid from "openid-client";
import { storage } from "../storage";
import { createToken, setAuthCookies } from "./independentAuth";

const GOOGLE_ISSUER_URL = "https://accounts.google.com";
const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_VERIFIER_COOKIE = "oauth_verifier";
const OAUTH_NONCE_COOKIE = "oauth_nonce";

function getBaseUrl(req: Request): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) return appUrl.replace(/\/$/, "");

  const protocol = (req.headers["x-forwarded-proto"] as string) || (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = req.headers.host || req.hostname;
  return `${protocol}://${host}`;
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
  };
}

let cachedConfig: openid.Configuration | null = null;

async function getConfig(): Promise<openid.Configuration> {
  if (cachedConfig) return cachedConfig;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados");
  }

  const config = await openid.discovery(
    new URL(GOOGLE_ISSUER_URL),
    clientId,
    clientSecret
  );

  cachedConfig = config;
  return config;
}

function splitName(fullName?: string | null) {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.slice(-1).join(" ") };
}

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/google/start", async (req: Request, res: Response) => {
    try {
      const config = await getConfig();
      const codeVerifier = openid.randomPKCECodeVerifier();
      const codeChallenge = await openid.calculatePKCECodeChallenge(codeVerifier);
      const state = openid.randomState();
      const nonce = openid.randomNonce();

      const baseUrl = getBaseUrl(req);
      const redirectUri = `${baseUrl}/api/auth/google/callback`;

      res.cookie(OAUTH_STATE_COOKIE, state, { ...getCookieOptions(), maxAge: 5 * 60 * 1000 });
      res.cookie(OAUTH_VERIFIER_COOKIE, codeVerifier, { ...getCookieOptions(), maxAge: 5 * 60 * 1000 });
      res.cookie(OAUTH_NONCE_COOKIE, nonce, { ...getCookieOptions(), maxAge: 5 * 60 * 1000 });

      const authorizationUrl = openid.buildAuthorizationUrl(config, {
        scope: "openid email profile",
        state,
        nonce,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      return res.redirect(authorizationUrl.toString());
    } catch (error) {
      console.error("Google OAuth start error:", error);
      return res.redirect("/login?error=google_oauth");
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const config = await getConfig();
      const baseUrl = getBaseUrl(req);
      const redirectUri = `${baseUrl}/api/auth/google/callback`;

      const stateCookie = req.cookies?.[OAUTH_STATE_COOKIE];
      const verifierCookie = req.cookies?.[OAUTH_VERIFIER_COOKIE];
      const nonceCookie = req.cookies?.[OAUTH_NONCE_COOKIE];

      if (!stateCookie || !verifierCookie || !nonceCookie) {
        return res.redirect("/login?error=google_state");
      }

      const currentUrl = new URL(req.originalUrl, baseUrl);
      const tokenSet = await openid.authorizationCodeGrant(config, currentUrl, {
        expectedState: stateCookie,
        expectedNonce: nonceCookie,
        pkceCodeVerifier: verifierCookie,
      }, {
        redirect_uri: redirectUri,
      });

      const claims = tokenSet.claims();
      if (!claims) {
        return res.redirect("/login?error=google_claims");
      }
      const googleUserId = claims.sub;
      const email = claims.email as string | undefined;
      const name = claims.name as string | undefined;
      const picture = claims.picture as string | undefined;

      if (!googleUserId || !email) {
        return res.redirect("/login?error=google_no_email");
      }

      let user = null;
      const existingIdentity = await storage.getAuthIdentityByProvider("google", googleUserId);
      if (existingIdentity) {
        user = await storage.getUser(existingIdentity.userId);
      }

      if (!user) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          user = existingUser;
        } else {
          const { firstName, lastName } = splitName(name);
          user = await storage.upsertUser({
            email,
            firstName,
            lastName,
            profileImageUrl: picture || null,
            authProvider: "google",
            status: "pending",
          });
        }

        if (user) {
          await storage.createAuthIdentity({
            userId: user.id,
            provider: "google",
            providerUserId: googleUserId,
            email,
          });
        }
      }

      if (!user) {
        return res.redirect("/login?error=google_user");
      }

      setAuthCookies(res, user.id);
      const token = createToken(user.id, false);

      res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });
      res.clearCookie(OAUTH_VERIFIER_COOKIE, { path: "/" });
      res.clearCookie(OAUTH_NONCE_COOKIE, { path: "/" });

      return res.redirect(`/auth/callback?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      return res.redirect("/login?error=google_callback");
    }
  });
}
