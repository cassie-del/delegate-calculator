// File: lib/sfClient.js
// Salesforce REST API helper. Handles automatic access-token refresh
// when SF returns 401, then retries the original request once.

const SF_TOKEN_URL = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const r = await fetch(SF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Token refresh failed: ${r.status} ${errText}`);
  }

  return r.json(); // { access_token, instance_url, issued_at, ... }
}

// session: the iron-session object with { accessToken, refreshToken, instanceUrl, ... }
// path: SF REST path, e.g. "/services/data/v60.0/sobjects/Opportunity/006XXX"
// init: standard fetch options (method, body, headers)
export async function sfFetch(session, path, init = {}) {
  if (!session?.accessToken) throw new Error("Not authenticated with Salesforce");

  const doFetch = async (token, instanceUrl) => {
    return fetch(`${instanceUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
  };

  let res = await doFetch(session.accessToken, session.instanceUrl);

  // If access token expired, refresh and retry once
  if (res.status === 401) {
    const refreshed = await refreshAccessToken(session.refreshToken);
    session.accessToken = refreshed.access_token;
    if (refreshed.instance_url) session.instanceUrl = refreshed.instance_url;
    await session.save();
    res = await doFetch(session.accessToken, session.instanceUrl);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SF API error ${res.status}: ${errText}`);
  }

  // 204 No Content -> return null
  if (res.status === 204) return null;
  return res.json();
}
