import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import * as oidc from "openid-client";
import {
  clearSession,
  createSession,
  getOidcConfig,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();
const OIDC_COOKIE_TTL = 10 * 60 * 1000;

function getOrigin(req: Request): string {
  const protocol = req.get("x-forwarded-proto")?.split(",")[0] ?? "https";
  const host =
    req.get("x-forwarded-host")?.split(",")[0] ??
    req.get("host") ??
    "localhost";
  return `${protocol}://${host}`;
}

function safeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("\r") ||
    value.includes("\n")
  ) {
    return "/";
  }
  return value;
}

function setSessionCookie(res: Response, sid: string): void {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string): void {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function upsertUser(claims: Record<string, unknown>) {
  if (typeof claims.sub !== "string" || !claims.sub) {
    throw new Error("OIDC identity did not include a subject");
  }

  const profileImage =
    optionalString(claims.profile_image_url) ?? optionalString(claims.picture);
  const userData = {
    id: claims.sub,
    email: optionalString(claims.email),
    firstName: optionalString(claims.first_name),
    lastName: optionalString(claims.last_name),
    profileImageUrl: profileImage,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { ...userData, updatedAt: new Date() },
    })
    .returning();
  return user;
}

router.get("/auth/user", (req: Request, res: Response): void => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getOidcConfig();
    const callbackUrl = `${getOrigin(req)}/api/callback`;
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const redirectTo = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: "openid email profile offline_access",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "login consent",
      state,
      nonce,
    });

    setOidcCookie(res, "code_verifier", codeVerifier);
    setOidcCookie(res, "nonce", nonce);
    setOidcCookie(res, "state", state);
    setOidcCookie(res, "return_to", safeReturnTo(req.query.returnTo));
    res.redirect(redirectTo.href);
  } catch (error) {
    req.log.error(
      { errorName: error instanceof Error ? error.name : "Error" },
      "Could not begin browser sign-in",
    );
    res.status(503).send("Sign-in is temporarily unavailable.");
  }
});

router.get("/callback", async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getOidcConfig();
    const callbackUrl = `${getOrigin(req)}/api/callback`;
    const codeVerifier = req.cookies?.code_verifier;
    const nonce = req.cookies?.nonce;
    const expectedState = req.cookies?.state;
    if (!codeVerifier || !expectedState) {
      res.redirect("/admin");
      return;
    }

    const query = new URL(req.url, `http://${req.get("host") ?? "localhost"}`)
      .searchParams;
    const currentUrl = new URL(`${callbackUrl}?${query.toString()}`);
    const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    if (!claims) {
      res.redirect("/admin");
      return;
    }

    const dbUser = await upsertUser(claims as Record<string, unknown>);
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = tokens.expiresIn();
    const sessionData: SessionData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at:
        (expiresIn ? now + expiresIn : undefined) ??
        (typeof claims.exp === "number" ? claims.exp : undefined),
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    for (const cookie of ["code_verifier", "nonce", "state", "return_to"]) {
      res.clearCookie(cookie, { path: "/" });
    }
    res.redirect(safeReturnTo(req.cookies?.return_to));
  } catch (error) {
    req.log.warn(
      { errorName: error instanceof Error ? error.name : "Error" },
      "Browser sign-in callback failed",
    );
    for (const cookie of ["code_verifier", "nonce", "state", "return_to"]) {
      res.clearCookie(cookie, { path: "/" });
    }
    res.redirect("/admin");
  }
});

router.get("/logout", async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getOidcConfig();
    const origin = getOrigin(req);
    const returnTo = safeReturnTo(req.query.returnTo);
    const sid = getSessionId(req);
    await clearSession(res, sid);

    const endSessionUrl = oidc.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: new URL(returnTo, `${origin}/`).href,
    });
    res.redirect(endSessionUrl.href);
  } catch (error) {
    req.log.warn(
      { errorName: error instanceof Error ? error.name : "Error" },
      "Browser sign-out provider unavailable",
    );
    res.redirect(safeReturnTo(req.query.returnTo));
  }
});

export default router;