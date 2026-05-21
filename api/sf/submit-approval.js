// File: api/sf/submit-approval.js
// POST endpoint that submits a Quote record into the active Salesforce Approval Process.
// The approval process itself must be defined in SF Setup (see Phase 2 README).
// This just kicks off the workflow.

import { getSession } from "../../lib/session.js";
import { sfFetch } from "../../lib/sfClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getSession(req, res);
  if (!session?.accessToken) return res.status(401).json({ error: "Not authenticated" });

  const { quoteId, comments } = req.body || {};
  if (!quoteId) return res.status(400).json({ error: "quoteId is required" });

  // Process.Approvals endpoint — submits the record into whatever Approval Process
  // is configured for this object & criteria in SF Setup.
  const body = {
    requests: [{
      actionType: "Submit",
      contextId: quoteId,
      comments: comments || "Submitted from Delegate Pricing Calculator",
    }],
  };

  try {
    const result = await sfFetch(session, "/services/data/v60.0/process/approvals", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const r = Array.isArray(result) ? result[0] : result;
    if (!r?.success) {
      const errors = r?.errors?.join("; ") || "Unknown error";
      return res.status(400).json({ error: `Approval submit failed: ${errors}` });
    }

    return res.status(200).json({
      success: true,
      instanceId: r.instanceId,
      instanceStatus: r.instanceStatus, // "Pending", "Approved", etc.
      nextApproverIds: r.nextApproverIds || [],
    });
  } catch (e) {
    console.error("Approval submit failed:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
