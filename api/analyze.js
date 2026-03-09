
// File: api/analyze.js
// Place this at the ROOT of your repo (not inside src/)
// Vercel automatically treats files in /api as serverless functions

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY; // Server-side env var (no VITE_ prefix)

  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  try {
    const { accountText } = req.body;

    if (!accountText || !accountText.trim()) {
      return res.status(400).json({ error: "accountText is required" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a pricing analyst for Delegate, a Salesforce consulting firm. Analyze this account strategy and score all 6 pillars L/M/H, determine scope (defined/flexible) and time (ongoing/timebound), suggest ideation duration if applicable, recommend number of Builders if operational, and if execution suggest estimated hours per role and risk buffer (Low/Medium/High).

Pillar definitions:
- presence: Does the client need proactive outreach before they ask? L=self-sufficient, M=regular check-ins, H=exec visibility/high-touch
- clarity: Can the client explain what we're doing and why? L=well-defined reqs, M=some ambiguity, H=high decision volume
- predictability: Does the client trust we deliver? L=low-risk clear scope, M=some timeline risk, H=high complexity/unknowns
- driveValue: Is the client's business getting better? L=tactical/self-evident, M=needs articulation, H=ROI docs needed
- strategicGuidance: Does the client feel confident about what's next? L=clear direction, M=strategic questions, H=major decisions/vendor selection
- championing: Can client leadership articulate our value? L=single decision-maker, M=some internal selling, H=CFO approval/business case needed

Respond ONLY with valid JSON, no markdown, no explanation:
{"presence":"L|M|H","clarity":"L|M|H","predictability":"L|M|H","driveValue":"L|M|H","strategicGuidance":"L|M|H","championing":"L|M|H","scope":"defined|flexible","time":"ongoing|timebound","duration":4,"numBuilders":1,"exBuilderHrs":80,"exConnectorHrs":20,"exAmplifierHrs":0,"riskBuffer":"Low|Medium|High","summary":"2-3 sentence explanation of your scoring rationale"}

Account Strategy:
${accountText}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Anthropic API error" });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}
