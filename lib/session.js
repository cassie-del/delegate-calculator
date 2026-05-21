// File: lib/session.js
// Shared session config for all API routes.
// Sessions are stored as encrypted HTTP-only cookies — no database required.

import { getIronSession } from "iron-session";

export const sessionOptions = {
  cookieName: "delegate_calc_session",
  password: process.env.SESSION_SECRET, // 32+ char random string set in Vercel env
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}
