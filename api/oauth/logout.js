// File: api/oauth/logout.js
// Clears the local session. Optionally revokes the SF refresh token too.

import { getSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const session = await getSession(req, res);
  const refreshToken = session.refreshToken;

  session.destroy();

  // Best-effort revocation on the Salesforce side
  if (refreshToken) {
    try {
      await fetch(`${process.env.SF_LOGIN_URL}/services/oauth2/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: refreshToken }),
      });
    } catch (e) {
      console.error("Token revoke failed (non-fatal):", e.message);
    }
  }

  res.redirect(302, "/");
}
