// File: api/oauth/login.js
// Kicks off the Salesforce OAuth flow (Authorization Code + PKCE).
// Generates code_verifier, code_challenge, and state, stores them in the session,
// then redirects the user to Salesforce's authorize endpoint.

import crypto from "crypto";
import { getSession } from "../../lib/session.js";

function base64UrlEncode(buf) {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export default async function handler(req, res) {
  const session = await getSession(req, res);

  // Capture the post-login redirect target (e.g. /?opportunityId=006XXX)
  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/";

  // PKCE
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const codeChallenge = base64UrlEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  // CSRF protection
  const state = base64UrlEncode(crypto.randomBytes(16));

  session.oauthState = state;
  session.oauthCodeVerifier = codeVerifier;
  session.oauthReturnTo = returnTo;
  await session.save();

  const authorizeUrl = new URL(`${process.env.SF_LOGIN_URL}/services/oauth2/authorize`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", process.env.SF_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", process.env.SF_REDIRECT_URI);
  authorizeUrl.searchParams.set("scope", "api refresh_token offline_access id profile email");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  res.redirect(302, authorizeUrl.toString());
}
