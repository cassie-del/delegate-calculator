// File: api/oauth/callback.js
// Handles the redirect from Salesforce after user authorizes the app.
// Exchanges the authorization code (+ PKCE verifier) for access_token + refresh_token,
// fetches basic user info, persists them in the session, and redirects back into the app.

import { getSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const session = await getSession(req, res);
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`Salesforce auth error: ${error_description || error}`);
  }

  if (!code || !state) {
    return res.status(400).send("Missing code or state from Salesforce.");
  }

  if (state !== session.oauthState) {
    return res.status(400).send("Invalid state parameter — possible CSRF attempt.");
  }

  const codeVerifier = session.oauthCodeVerifier;
  const returnTo = session.oauthReturnTo || "/";

  // Clear the one-time OAuth bookkeeping
  delete session.oauthState;
  delete session.oauthCodeVerifier;
  delete session.oauthReturnTo;

  // Exchange code for tokens
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
    redirect_uri: process.env.SF_REDIRECT_URI,
    code,
    code_verifier: codeVerifier,
  });

  let tokenJson;
  try {
    const tokenRes = await fetch(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return res.status(500).send(`Token exchange failed: ${tokenRes.status} ${errText}`);
    }
    tokenJson = await tokenRes.json();
  } catch (e) {
    return res.status(500).send(`Token exchange error: ${e.message}`);
  }

  // Fetch user identity for display purposes
  let identity = {};
  try {
    const idRes = await fetch(tokenJson.id, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (idRes.ok) identity = await idRes.json();
  } catch (e) {
    // Non-fatal — we can proceed without identity info
    console.error("Identity fetch failed:", e.message);
  }

  session.accessToken = tokenJson.access_token;
  session.refreshToken = tokenJson.refresh_token;
  session.instanceUrl = tokenJson.instance_url;
  session.userId = identity.user_id || tokenJson.id;
  session.displayName = identity.display_name || identity.username || "Salesforce User";
  session.email = identity.email || null;
  session.issuedAt = tokenJson.issued_at;

  await session.save();

  res.redirect(302, returnTo);
}
