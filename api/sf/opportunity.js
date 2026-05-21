// File: api/sf/opportunity.js
// Fetches a Salesforce Opportunity by ID (passed as ?id=006XXX).
// Returns Opp fields + the related Account name so the calculator can pre-fill context.

import { getSession } from "../../lib/session.js";
import { sfFetch } from "../../lib/sfClient.js";

export default async function handler(req, res) {
  const session = await getSession(req, res);

  if (!session?.accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const opportunityId = req.query.id;
  if (!opportunityId || typeof opportunityId !== "string") {
    return res.status(400).json({ error: "Missing or invalid Opportunity id" });
  }

  // Basic sanity check on the ID format (15 or 18 char alphanumeric)
  if (!/^[a-zA-Z0-9]{15,18}$/.test(opportunityId)) {
    return res.status(400).json({ error: "Invalid Salesforce ID format" });
  }

  // SOQL-style query to get Opp fields plus Account name in one round-trip
  const fields = [
    "Id",
    "Name",
    "StageName",
    "Amount",
    "CloseDate",
    "Description",
    "Account.Name",
    "Account.Id",
    "Owner.Name",
  ].join(",");

  const soql = `SELECT ${fields} FROM Opportunity WHERE Id = '${opportunityId}' LIMIT 1`;
  const path = `/services/data/v60.0/query/?q=${encodeURIComponent(soql)}`;

  try {
    const result = await sfFetch(session, path);
    if (!result?.records || result.records.length === 0) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    const opp = result.records[0];

    // Flatten the response for easier consumption on the frontend
    return res.status(200).json({
      id: opp.Id,
      name: opp.Name,
      stage: opp.StageName,
      amount: opp.Amount,
      closeDate: opp.CloseDate,
      description: opp.Description,
      accountId: opp.Account?.Id,
      accountName: opp.Account?.Name,
      ownerName: opp.Owner?.Name,
    });
  } catch (e) {
    console.error("Opportunity fetch failed:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
