// File: api/me.js
// Returns the currently authenticated SF user info, or 401 if not signed in.
// The frontend calls this on load to decide whether to show the app or redirect to login.

import { getSession } from "./../lib/session.js";

export default async function handler(req, res) {
  const session = await getSession(req, res);

  if (!session?.accessToken) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    userId: session.userId,
    displayName: session.displayName,
    email: session.email,
    instanceUrl: session.instanceUrl,
  });
}
