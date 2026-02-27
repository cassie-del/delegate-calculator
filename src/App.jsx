import { useState } from "react";

const B = {
  gold: "#E8A020", orange: "#D4501A", teal: "#1A7A8A", lightBlue: "#4AAFC0",
  bg: "#0A0A0A", surface: "#111111", surface2: "#1A1A1A", border: "#2A2A2A",
  border2: "#333333", text: "#FFFFFF", textMuted: "#888888", textDim: "#555555",
};

const PILLARS = [
  { id: "presence", label: "Presence", role: "Connector", question: "Does Devon hear from us before they have to ask?", low: "Client self-sufficient; minimal relationship mgmt", med: "Regular check-ins; some stakeholder complexity", high: "Multiple stakeholders, executive visibility, high-touch" },
  { id: "clarity", label: "Clarity", role: "Connector", question: "Can Devon confidently explain what we're doing and why?", low: "Requirements well-defined; minimal documentation", med: "Some ambiguity; decision-logging required", high: "High decision volume, complex solution design" },
  { id: "predictability", label: "Predictability", role: "Builder", question: "Does Devon trust we deliver on what we say?", low: "Low-risk, clear scope", med: "Some timeline risk; dependencies to manage", high: "High complexity, many unknowns, significant delivery risk" },
  { id: "driveValue", label: "Drive Value", role: "Builder", question: "Is Devon's business actually getting better?", low: "Tactical output; value is self-evident", med: "Value needs articulation and business connection", high: "Value case must be built and reinforced; ROI docs needed" },
  { id: "strategicGuidance", label: "Strategic Guidance", role: "Amplifier", question: "Does Devon feel confident about what's next?", low: "Client has clear direction; minimal advisory needed", med: "Strategic questions to navigate; recommendations needed", high: "Major decisions, vendor selection, org-wide implications" },
  { id: "championing", label: "Championing", role: "Amplifier", question: "Can Devon's leadership articulate our value?", low: "Single decision-maker; no internal selling required", med: "Some internal stakeholder management needed", high: "CFO/executive approval required; business case must be built" },
];

const MULT = { L: 1.0, M: 1.15, H: 1.30 };
const RATES = { builderOp: 240, builderSt: 225, builderEx: 225, connector: 265, amplifier: 325 };
const ROLE_COLORS = { Connector: B.lightBlue, Builder: B.gold, Amplifier: B.orange };
const RISK_BUFFERS = { Low: 0.10, Medium: 0.15, High: 0.25 };
const COMMIT_DISCOUNTS = { none: 0, "3mo": 0.05, "6mo": 0.08, "12mo": 0.12 };
const COMMIT_TERMS = { none: 0, "3mo": 3, "6mo": 6, "12mo": 12 };
const VOLUME_DISCOUNTS = [
  { label: "< 80 hrs", min: 0, max: 79, pct: 0 },
  { label: "80–119 hrs", min: 80, max: 119, pct: 0.03 },
  { label: "120–159 hrs", min: 120, max: 159, pct: 0.05 },
  { label: "160+ hrs", min: 160, max: Infinity, pct: 0.08 },
];
const MAX_AUTO_DISCOUNT = 0.10;
const MATRIX = [
  { scope: "defined", time: "timebound", eng: "execution", label: "Execution", color: "#2A9D6A", desc: "Deliver X by Y date", value: "Predictability & Accountability" },
  { scope: "flexible", time: "timebound", eng: "ideation", label: "Ideation", color: "#7C5CBF", desc: "Clarity before commitment", value: "Clarity & Confidence" },
  { scope: "defined", time: "ongoing", eng: "operational", label: "Operational", color: B.gold, desc: "Hands-on day-to-day relief", value: "Capacity & Reliability" },
  { scope: "flexible", time: "ongoing", eng: "strategic", label: "Strategic", color: B.teal, desc: "Build toward roadmap as priorities evolve", value: "Flexibility & Momentum" },
];
const OP_TIERS = [
  { id: "execute", label: "Execute", desc: "Reliable embedded execution", builderHrs: 40, connector: false, color: B.gold },
  { id: "elevate", label: "Elevate", desc: "Execution + proactive delivery presence", builderHrs: 40, connector: true, color: B.lightBlue },
  { id: "excel", label: "Excel", desc: "Max capacity + full delivery leadership", builderHrs: 40, connector: true, color: "#A855F7" },
];
const ST_TIERS = [
  { id: "drive", label: "Drive", desc: "Dedicated team with strategic oversight", builderHrs: 40, connectorHrs: 8, amplifierHrs: 8, color: B.gold },
  { id: "amplify", label: "Amplify", desc: "Deeper presence + increased strategic guidance", builderHrs: 60, connectorHrs: 12, amplifierHrs: 12, color: B.lightBlue },
  { id: "excel", label: "Excel", desc: "Full partnership — maximum depth across all roles", builderHrs: 80, connectorHrs: 16, amplifierHrs: 20, color: "#A855F7" },
];

const SS = {
  L: { bg: "#0D2318", text: "#4ADE80", border: "#166534" },
  M: { bg: "#231A0A", text: B.gold, border: "#854D0E" },
  H: { bg: "#2A0F0A", text: B.orange, border: "#7C2D12" },
};
const ssClass = (v) => v ? "text-xs font-bold px-3 py-1 rounded-full border" : "";
const ssStyle = (v) => v ? { background: SS[v].bg, color: SS[v].text, borderColor: SS[v].border } : {};
const SL = { L: "Low", M: "Medium", H: "High" };

const DelegateLogo = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#2A2A2A" strokeWidth="2"/>
    <polygon points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5" fill="none" stroke="#333" strokeWidth="1"/>
    <line x1="50" y1="5" x2="50" y2="95" stroke={B.teal} strokeWidth="3" opacity="0.6"/>
    <line x1="5" y1="27.5" x2="95" y2="72.5" stroke={B.gold} strokeWidth="3" opacity="0.6"/>
    <line x1="95" y1="27.5" x2="5" y2="72.5" stroke={B.orange} strokeWidth="3" opacity="0.6"/>
    <circle cx="50" cy="50" r="8" fill={B.gold} opacity="0.9"/>
    <circle cx="50" cy="5" r="4" fill={B.teal}/>
    <circle cx="95" cy="27.5" r="4" fill={B.lightBlue}/>
    <circle cx="95" cy="72.5" r="4" fill={B.gold}/>
    <circle cx="50" cy="95" r="4" fill={B.orange}/>
    <circle cx="5" cy="72.5" r="4" fill={B.orange}/>
    <circle cx="5" cy="27.5" r="4" fill={B.teal}/>
  </svg>
);

function Chip({ v }) {
  if (!v) return null;
  return <span className={ssClass(v)} style={ssStyle(v)}>{SL[v]}</span>;
}

function PillarCard({ pillar, value, onChange }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${B.border2}`, background: B.surface2 }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm">{pillar.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: ROLE_COLORS[pillar.role] + "22", color: ROLE_COLORS[pillar.role], border: `1px solid ${ROLE_COLORS[pillar.role]}44` }}>{pillar.role}</span>
          </div>
          <p className="text-xs italic" style={{ color: B.textMuted }}>"{pillar.question}"</p>
        </div>
        <Chip v={value} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {["L","M","H"].map(s => (
          <button key={s} onClick={() => onChange(pillar.id, s)}
            className="rounded-lg p-2 text-xs text-left transition-all"
            style={value === s ? { ...ssStyle(s), border: `1px solid ${SS[s].border}` } : { border: `1px solid ${B.border}`, background: B.surface, color: B.textMuted }}>
            <div className="font-semibold mb-1">{SL[s]}</div>
            <div className="opacity-80 text-xs">{s==="L"?pillar.low:s==="M"?pillar.med:pillar.high}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HrsInput({ label, value, onChange, rate, color }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 mb-2" style={{ background: B.surface2 }}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
        <div>
          <div className="text-xs font-medium text-white">{label}</div>
          <div className="text-xs" style={{ color: B.textDim }}>${rate}/hr</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(0, value - 5))} className="w-6 h-6 rounded text-white text-sm flex items-center justify-center" style={{ background: B.border2 }}>−</button>
        <span className="text-white font-bold text-sm w-10 text-center">{value}</span>
        <button onClick={() => onChange(value + 5)} className="w-6 h-6 rounded text-white text-sm flex items-center justify-center" style={{ background: B.border2 }}>+</button>
      </div>
    </div>
  );
}

function StepBadge({ n }) {
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0" style={{ background: `linear-gradient(135deg, ${B.gold}, ${B.orange})` }}>{n}</div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl p-5 mb-5 ${className}`} style={{ background: B.surface, border: `1px solid ${B.border2}` }}>
      {children}
    </div>
  );
}

export default function App() {
  // Password gate
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('dk_auth') === 'true');
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState(false);

  const handleLogin = () => {
    if (pw === import.meta.env.VITE_APP_PASSWORD) {
      sessionStorage.setItem('dk_auth', 'true');
      setAuthed(true);
    } else {
      setPwErr(true);
      setTimeout(() => setPwErr(false), 2000);
    }
  };

  if (!authed) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-10 w-full max-w-sm text-center">
        <img src="/logo.png" alt="Delegate" className="h-10 mx-auto mb-8 object-contain" />
        <h1 className="text-white font-bold text-lg mb-1">Pricing Calculator</h1>
        <p className="text-gray-500 text-xs mb-6">Internal use only</p>
        <input
          type="password"
          placeholder="Enter team password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white text-sm text-center focus:outline-none mb-3 ${pwErr ? 'border-red-500' : 'border-gray-600 focus:border-yellow-500'}`}
        />
        {pwErr && <p className="text-red-400 text-xs mb-3">Incorrect password. Try again.</p>}
        <button onClick={handleLogin}
          className="w-full py-3 rounded-lg font-semibold text-sm text-black transition-all"
          style={{ backgroundColor: '#F59E0B' }}>
          Enter
        </button>
      </div>
    </div>
  );

  // Calculator state
  const [scores, setScores] = useState({});
  const [scope, setScope] = useState(null);
  const [time, setTime] = useState(null);
  const [duration, setDuration] = useState(4);
  const [numBuilders, setNumBuilders] = useState(1);
  const [accountText, setAccountText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [exBuilderHrs, setExBuilderHrs] = useState(80);
  const [exConnectorHrs, setExConnectorHrs] = useState(20);
  const [exAmplifierHrs, setExAmplifierHrs] = useState(0);
  const [showAmplifier, setShowAmplifier] = useState(false);
  const [riskBuffer, setRiskBuffer] = useState("Medium");
  const [commitTerm, setCommitTerm] = useState("none");
  const [commitIncentive, setCommitIncentive] = useState("pct");
  const [newClient, setNewClient] = useState(false);
  const [newClientPct, setNewClientPct] = useState(5);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [showDiscounts, setShowDiscounts] = useState(false);

  const setScore = (id, val) => setScores(s => ({ ...s, [id]: val }));
  const allScored = PILLARS.every(p => scores[p.id]);

  const matrixCell = scope && time ? MATRIX.find(m => m.scope === scope && m.time === time) : null;
  const engType = matrixCell?.eng;
  const isOp = engType === "operational";
  const isSt = engType === "strategic";
  const isIdeation = engType === "ideation";
  const isExecution = engType === "execution";
  const isProject = isIdeation || isExecution;
  const isRetainer = isOp || isSt;
  const freeMonthEligible = isRetainer && (commitTerm === "6mo" || commitTerm === "12mo");

  const needsConnector = ["presence","clarity"].some(p => scores[p]==="M"||scores[p]==="H");
  const amplifierDepth = ["strategicGuidance","championing"].filter(p => scores[p]==="H").length;

  const getOpTier = () => needsConnector ? (numBuilders > 1 ? OP_TIERS[2] : OP_TIERS[1]) : OP_TIERS[0];
  const getStTier = () => amplifierDepth >= 2 ? ST_TIERS[2] : amplifierDepth === 1 ? ST_TIERS[1] : ST_TIERS[0];
  const recTier = isOp ? getOpTier() : isSt ? getStTier() : null;

  const avgMult = allScored ? PILLARS.reduce((s,p) => s + MULT[scores[p.id]], 0) / PILLARS.length : null;

  let builderHrs = 0, connectorHrs = 0, amplifierHrs = 0, builderRate = RATES.builderSt;
  if (isOp && recTier) {
    builderRate = RATES.builderOp; builderHrs = recTier.builderHrs * numBuilders; connectorHrs = recTier.connector ? 10 : 0;
  } else if (isSt && recTier) {
    builderRate = RATES.builderSt; builderHrs = recTier.builderHrs; connectorHrs = recTier.connectorHrs; amplifierHrs = recTier.amplifierHrs;
  } else if (isIdeation) {
    builderRate = RATES.builderSt; builderHrs = duration * 10; connectorHrs = needsConnector ? duration * 2 : 0;
    amplifierHrs = ["strategicGuidance","championing"].some(p=>scores[p]==="M"||scores[p]==="H") ? Math.ceil(duration*1.5) : 0;
  } else if (isExecution) {
    builderRate = RATES.builderEx; builderHrs = exBuilderHrs; connectorHrs = exConnectorHrs; amplifierHrs = showAmplifier ? exAmplifierHrs : 0;
  }

  const totalHrs = builderHrs + connectorHrs + amplifierHrs;
  const baseInv = (builderHrs * builderRate) + (connectorHrs * RATES.connector) + (amplifierHrs * RATES.amplifier);
  const blendedRate = totalHrs > 0 ? Math.round(baseInv / totalHrs) : 0;
  const afterMult = avgMult ? baseInv * avgMult : baseInv;
  const afterRisk = isExecution ? afterMult * (1 + RISK_BUFFERS[riskBuffer]) : afterMult;
  const monthlyInv = afterRisk;

  const useFreeMonth = freeMonthEligible && commitIncentive === "freemonth";
  const useCommitPct = !useFreeMonth && commitTerm !== "none";
  const commitDiscPct = useCommitPct ? COMMIT_DISCOUNTS[commitTerm] : 0;
  const freeMonthValue = useFreeMonth ? monthlyInv : 0;
  const newClientDisc = newClient ? newClientPct / 100 : 0;
  const volDisc = isRetainer ? (VOLUME_DISCOUNTS.find(v => totalHrs >= v.min && totalHrs <= v.max)?.pct || 0) : 0;
  const manualDisc = manualDiscount / 100;
  const pctDiscTotal = commitDiscPct + newClientDisc + volDisc + manualDisc;
  const monthlyAfterPctDisc = monthlyInv * (1 - pctDiscTotal);
  const termMonths = COMMIT_TERMS[commitTerm] || 1;
  const termRevenue = isRetainer && commitTerm !== "none" ? (monthlyAfterPctDisc * termMonths) - freeMonthValue : monthlyAfterPctDisc;
  const termHrsDelivered = isRetainer && commitTerm !== "none" ? totalHrs * termMonths : totalHrs;
  const effectiveBlendedRate = isRetainer && commitTerm !== "none" && termHrsDelivered > 0
    ? Math.round(termRevenue / termHrsDelivered) : Math.round(monthlyAfterPctDisc / (totalHrs || 1));
  const finalMonthly = Math.round(monthlyAfterPctDisc / 100) * 100;
  const finalTermTotal = isRetainer && commitTerm !== "none" ? Math.round(termRevenue / 100) * 100 : null;
  const discountEquivPct = blendedRate > 0 ? 1 - (effectiveBlendedRate / blendedRate) : 0;
  const needsApproval = (pctDiscTotal > MAX_AUTO_DISCOUNT) || (useFreeMonth && discountEquivPct > MAX_AUTO_DISCOUNT);
  const clientTierLabel = recTier?.label || (isIdeation ? "Ideation" : isExecution ? "Execution Project" : null);
  const clientTierColor = recTier?.color || (isIdeation ? "#7C5CBF" : isExecution ? "#2A9D6A" : B.textDim);

  const analyzeWithAI = async () => {
    if (!accountText.trim()) return;
    setAnalyzing(true); setAiSummary("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: "You are a pricing analyst for Delegate, a Salesforce consulting firm. Analyze this account strategy and score all 6 pillars L/M/H, determine scope (defined/flexible) and time (ongoing/timebound), suggest ideation duration if applicable, recommend number of Builders if operational, and if execution suggest estimated hours per role and risk buffer (Low/Medium/High).\n\nPillar definitions:\n- presence: Does the client need proactive outreach before they ask? L=self-sufficient, M=regular check-ins, H=exec visibility/high-touch\n- clarity: Can the client explain what we're doing and why? L=well-defined reqs, M=some ambiguity, H=high decision volume\n- predictability: Does the client trust we deliver? L=low-risk clear scope, M=some timeline risk, H=high complexity/unknowns\n- driveValue: Is the client's business getting better? L=tactical/self-evident, M=needs articulation, H=ROI docs needed\n- strategicGuidance: Does the client feel confident about what's next? L=clear direction, M=strategic questions, H=major decisions/vendor selection\n- championing: Can client leadership articulate our value? L=single decision-maker, M=some internal selling, H=CFO approval/business case needed\n\nRespond ONLY with valid JSON, no markdown, no explanation:\n{\"presence\":\"L|M|H\",\"clarity\":\"L|M|H\",\"predictability\":\"L|M|H\",\"driveValue\":\"L|M|H\",\"strategicGuidance\":\"L|M|H\",\"championing\":\"L|M|H\",\"scope\":\"defined|flexible\",\"time\":\"ongoing|timebound\",\"duration\":4,\"numBuilders\":1,\"exBuilderHrs\":80,\"exConnectorHrs\":20,\"exAmplifierHrs\":0,\"riskBuffer\":\"Low|Medium|High\",\"summary\":\"2-3 sentence explanation of your scoring rationale\"}\n\nAccount Strategy:\n" + accountText }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const p = JSON.parse(text.replace(/```json|```/g, "").trim());
      setScores({ presence:p.presence, clarity:p.clarity, predictability:p.predictability, driveValue:p.driveValue, strategicGuidance:p.strategicGuidance, championing:p.championing });
      if (p.scope) setScope(p.scope); if (p.time) setTime(p.time);
      if (p.duration) setDuration(p.duration); if (p.numBuilders) setNumBuilders(p.numBuilders);
      if (p.exBuilderHrs) setExBuilderHrs(p.exBuilderHrs); if (p.exConnectorHrs) setExConnectorHrs(p.exConnectorHrs);
      if (p.exAmplifierHrs && p.exAmplifierHrs > 0) { setExAmplifierHrs(p.exAmplifierHrs); setShowAmplifier(true); }
      if (p.riskBuffer) setRiskBuffer(p.riskBuffer); if (p.summary) setAiSummary(p.summary);
    } catch(e) { setAiSummary("Could not analyze — try again or complete fields manually."); }
    setAnalyzing(false);
  };

  const reset = () => {
    setScores({}); setScope(null); setTime(null); setDuration(4); setNumBuilders(1);
    setAccountText(""); setAiSummary(""); setExBuilderHrs(80); setExConnectorHrs(20);
    setExAmplifierHrs(0); setShowAmplifier(false); setRiskBuffer("Medium");
    setCommitTerm("none"); setCommitIncentive("pct"); setNewClient(false);
    setNewClientPct(5); setManualDiscount(0); setShowDiscounts(false);
  };

  const selBtn = (active, color) => ({
    border: `1px solid ${active ? color : B.border}`,
    background: active ? color + "18" : B.surface,
    color: active ? color : B.textMuted,
    transition: "all 0.15s",
  });

  return (
    <div className="min-h-screen font-sans" style={{ background: B.bg, color: B.text }}>
      <div style={{ borderBottom: `1px solid ${B.border2}`, background: B.surface }} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DelegateLogo />
            <div>
              <div className="text-lg font-black tracking-tight text-white">Delegate</div>
              <div className="text-xs" style={{ color: B.textDim }}>Pricing & Resourcing Calculator</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs mb-1" style={{ color: B.textDim }}>Role Rates</div>
            <div className="flex gap-3 text-xs">
              <div><span className="font-bold" style={{ color: B.gold }}>Builder</span><span style={{ color: B.textMuted }}> $225–$240</span></div>
              <div><span className="font-bold" style={{ color: B.lightBlue }}>Connector</span><span style={{ color: B.textMuted }}> $265</span></div>
              <div><span className="font-bold" style={{ color: B.orange }}>Amplifier</span><span style={{ color: B.textMuted }}> $325</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <StepBadge n="1" />
              <h2 className="font-semibold text-white">Paste Account Strategy</h2>
              <span className="text-xs" style={{ color: B.textDim }}>(optional)</span>
            </div>
            <textarea
              className="w-full rounded-lg p-3 text-sm resize-none focus:outline-none"
              style={{ background: B.surface2, border: `1px solid ${B.border2}`, color: "#CCC", caretColor: B.gold }}
              rows={4} placeholder="Paste account strategy or pre-sales notes. AI will auto-score all pillars and complete the engagement diagnostic..."
              value={accountText} onChange={e => setAccountText(e.target.value)} />
            <button onClick={analyzeWithAI} disabled={!accountText.trim() || analyzing}
              className="mt-2 w-full py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: accountText.trim() && !analyzing ? `linear-gradient(135deg, ${B.gold}, ${B.orange})` : B.surface2, color: accountText.trim() && !analyzing ? "#000" : B.textDim, border: `1px solid ${B.border2}` }}>
              {analyzing ? "Analyzing..." : "⚡ Auto-Score with AI"}
            </button>
            {aiSummary && (
              <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: B.teal + "18", border: `1px solid ${B.teal}44`, color: B.lightBlue }}>
                <span className="font-semibold" style={{ color: "#7DD3FC" }}>AI Analysis: </span>{aiSummary}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-1">
              <StepBadge n="2" />
              <h2 className="font-semibold text-white">What Does Devon Value?</h2>
            </div>
            <p className="text-xs mb-4 ml-8" style={{ color: B.textDim }}>Two questions place Devon in the right engagement.</p>

            <div className="mb-3">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Scope of work</div>
              <div className="grid grid-cols-2 gap-2">
                {[["defined","Defined","Clear requirements, known deliverables"],["flexible","Flexible","Still evolving, open questions remain"]].map(([v,l,s]) => (
                  <button key={v} onClick={() => setScope(v)} className="rounded-lg p-3 text-left transition-all"
                    style={selBtn(scope===v, B.gold)}>
                    <div className="font-semibold text-sm">{l}</div>
                    <div className="text-xs mt-0.5" style={{ color: B.textDim }}>{s}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Engagement horizon</div>
              <div className="grid grid-cols-2 gap-2">
                {[["ongoing","Ongoing","Continuous, no fixed end date"],["timebound","Time-Bound","Project with a defined end or deadline"]].map(([v,l,s]) => (
                  <button key={v} onClick={() => setTime(v)} className="rounded-lg p-3 text-left transition-all"
                    style={selBtn(time===v, B.gold)}>
                    <div className="font-semibold text-sm">{l}</div>
                    <div className="text-xs mt-0.5" style={{ color: B.textDim }}>{s}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${B.border2}` }}>
              <div className="grid grid-cols-3 text-xs">
                <div style={{ background: B.surface2 }} className="p-2"></div>
                <div style={{ background: B.surface2, borderLeft: `1px solid ${B.border2}`, color: B.textMuted }} className="p-2 text-center font-semibold">Defined Scope</div>
                <div style={{ background: B.surface2, borderLeft: `1px solid ${B.border2}`, color: B.textMuted }} className="p-2 text-center font-semibold">Flexible Scope</div>
                {[["timebound","Time-Bound"],["ongoing","Ongoing"]].map(([t, tLabel]) => [
                  <div key={t+"label"} style={{ background: B.surface2, borderTop: `1px solid ${B.border2}`, color: B.textMuted, writingMode:"vertical-rl", transform:"rotate(180deg)", minHeight: 80 }} className="p-2 font-semibold flex items-center justify-center">{tLabel}</div>,
                  ...["defined","flexible"].map((s) => {
                    const cell = MATRIX.find(m => m.scope===s && m.time===t), active = scope===s && time===t;
                    return <button key={t+s} onClick={() => { setScope(s); setTime(t); }} className="p-3 text-left transition-all"
                      style={{ background: active ? cell.color+"22" : "#0D0D0D", borderTop: `1px solid ${B.border2}`, borderLeft: `1px solid ${B.border2}` }}>
                      <div className="font-bold text-sm mb-1" style={{ color: active ? cell.color : B.textMuted }}>{cell.label}</div>
                      <div className="text-xs" style={{ color: B.textDim }}>{cell.desc}</div>
                      {active && <div className="text-xs mt-1 font-medium" style={{ color: cell.color }}>↳ {cell.value}</div>}
                    </button>;
                  })
                ])}
              </div>
            </div>

            {isOp && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${B.border2}` }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Number of Builders</div>
                <div className="flex gap-2">{[1,2,3,4].map(n => (
                  <button key={n} onClick={() => setNumBuilders(n)} className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                    style={selBtn(numBuilders===n, B.gold)}>{n}</button>
                ))}</div>
              </div>
            )}
            {isIdeation && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${B.border2}` }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Duration (sprint-aligned)</div>
                <div className="grid grid-cols-6 gap-1">{[2,4,6,8,10,12].map(w => (
                  <button key={w} onClick={() => setDuration(w)} className="py-2 rounded-lg text-sm font-bold transition-all"
                    style={selBtn(duration===w, "#7C5CBF")}>{w}w</button>
                ))}</div>
              </div>
            )}
            {isExecution && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${B.border2}` }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: B.textMuted }}>Estimated Implementation Hours</div>
                <HrsInput label="Builder" value={exBuilderHrs} onChange={setExBuilderHrs} rate={RATES.builderEx} color={ROLE_COLORS.Builder}/>
                <HrsInput label="Connector" value={exConnectorHrs} onChange={setExConnectorHrs} rate={RATES.connector} color={ROLE_COLORS.Connector}/>
                <button onClick={() => { setShowAmplifier(!showAmplifier); if(showAmplifier) setExAmplifierHrs(0); }}
                  className="w-full py-2 rounded-lg text-xs font-semibold transition-all mb-2"
                  style={selBtn(showAmplifier, B.orange)}>
                  {showAmplifier ? "− Remove Amplifier" : "+ Add Amplifier (optional)"}
                </button>
                {showAmplifier && <HrsInput label="Amplifier" value={exAmplifierHrs} onChange={setExAmplifierHrs} rate={RATES.amplifier} color={ROLE_COLORS.Amplifier}/>}
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Complexity / Risk Buffer</div>
                  <div className="grid grid-cols-3 gap-2">{["Low","Medium","High"].map(b => (
                    <button key={b} onClick={() => setRiskBuffer(b)} className="py-2 rounded-lg text-xs font-bold transition-all"
                      style={selBtn(riskBuffer===b, b==="Low"?"#4ADE80":b==="Medium"?B.gold:B.orange)}>
                      {b}<div className="text-xs opacity-70">+{RISK_BUFFERS[b]*100}%</div>
                    </button>
                  ))}</div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <StepBadge n="3" />
              <h2 className="font-semibold text-white">Score the Six Pillars</h2>
            </div>
            {PILLARS.map(p => <PillarCard key={p.id} pillar={p} value={scores[p.id]} onChange={setScore}/>)}
          </Card>

          <div className="rounded-xl p-5" style={{ background: B.surface, border: `1px solid ${B.border2}` }}>
            <button onClick={() => setShowDiscounts(!showDiscounts)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <StepBadge n="4" />
                <h2 className="font-semibold text-white">Discounts & Incentives</h2>
                {(pctDiscTotal>0||useFreeMonth) && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#14532D44", border: "1px solid #166534", color: "#4ADE80" }}>
                    {useFreeMonth?"1 free month":""}{useFreeMonth&&pctDiscTotal>0?" + ":""}{pctDiscTotal>0?`−${(pctDiscTotal*100).toFixed(0)}%`:""} applied
                  </span>
                )}
                {needsApproval && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: B.orange+"22", border: `1px solid ${B.orange}66`, color: B.orange }}>⚠ Approval required</span>}
              </div>
              <span className="text-xs" style={{ color: B.textDim }}>{showDiscounts?"▲":"▼"}</span>
            </button>

            {showDiscounts && (
              <div className="mt-4 space-y-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Commitment Term</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[["none","None","—"],["3mo","3 Month","5%"],["6mo","6 Month","8% or free mo"],["12mo","12 Month","12% or free mo"]].map(([v,l,d]) => (
                      <button key={v} onClick={() => { setCommitTerm(v); if(v==="none"||v==="3mo") setCommitIncentive("pct"); }}
                        className="rounded-lg p-2 text-center transition-all"
                        style={selBtn(commitTerm===v, B.gold)}>
                        <div className="font-semibold text-xs">{l}</div>
                        <div className="text-xs opacity-70">{d}</div>
                      </button>
                    ))}
                  </div>
                  {freeMonthEligible && (
                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Commit Incentive</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[["pct","% Discount", commitTerm==="6mo"?"8% off monthly rate":"12% off monthly rate"],
                          ["freemonth","1 Free Month", commitTerm==="6mo"?"Pay 5, get 6":"Pay 11, get 12"]].map(([v,l,s]) => (
                          <button key={v} onClick={() => setCommitIncentive(v)} className="rounded-lg p-3 text-left transition-all"
                            style={selBtn(commitIncentive===v, "#4ADE80")}>
                            <div className="font-semibold text-sm">{l}</div>
                            <div className="text-xs mt-0.5" style={{ color: B.textDim }}>{s}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>New Client Discount</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setNewClient(!newClient)} className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={selBtn(newClient, "#4ADE80")}>{newClient?"✓ Applied":"Apply"}</button>
                    {newClient && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: B.textMuted }}>Discount %</span>
                        <input type="number" min={0} max={20} value={newClientPct}
                          onChange={e => setNewClientPct(Math.min(20,Math.max(0,parseInt(e.target.value)||0)))}
                          className="w-16 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none"
                          style={{ background: B.surface2, border: `1px solid ${B.border2}` }}/>
                        <span className="text-xs" style={{ color: B.textMuted }}>%</span>
                      </div>
                    )}
                  </div>
                </div>

                {isRetainer && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Volume Discount <span style={{ color: B.textDim, textTransform:"none", fontWeight:"normal" }}>(auto-applied)</span></div>
                    <div className="grid grid-cols-4 gap-1">{VOLUME_DISCOUNTS.map(v => {
                      const active = totalHrs>=v.min && totalHrs<=v.max;
                      return <div key={v.label} className="rounded-lg p-2 text-center text-xs"
                        style={{ border: `1px solid ${active?"#166534":B.border}`, background: active?"#14532D44":B.surface2, color: active?"#4ADE80":B.textDim }}>
                        <div className="font-semibold">{v.label}</div>
                        <div>{v.pct>0?`${v.pct*100}%`:"No disc."}</div>
                        {active && <div className="text-xs mt-0.5">← current</div>}
                      </div>;
                    })}</div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: B.textMuted }}>Manual Override %</div>
                  <div className="flex items-center gap-3">
                    <input type="number" min={0} max={50} value={manualDiscount}
                      onChange={e => setManualDiscount(Math.min(50,Math.max(0,parseInt(e.target.value)||0)))}
                      className="w-20 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none"
                      style={{ background: B.surface2, border: `1px solid ${B.border2}` }}/>
                    <span className="text-xs" style={{ color: B.textMuted }}>% additional discount</span>
                  </div>
                </div>

                {needsApproval && (
                  <div className="p-3 rounded-lg" style={{ background: B.orange+"18", border: `1px solid ${B.orange}55` }}>
                    <div className="text-xs font-bold mb-1" style={{ color: B.orange }}>⚠ Manager Approval Required</div>
                    <div className="text-xs" style={{ color: "#FCA98A" }}>
                      Effective discount of {(discountEquivPct*100).toFixed(1)}% on blended rate exceeds the 10% auto-approval threshold.
                      List rate: ${blendedRate}/hr → Effective rate: ${effectiveBlendedRate}/hr. Manager sign-off required before presenting to client.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl p-5" style={{ background: B.surface, border: `1px solid ${B.border2}` }}>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span style={{ color: B.gold }}>◆</span> Internal Pricing Output
            </h2>

            {(!allScored||!scope||!time) ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📋</div>
                <div className="text-sm mb-4" style={{ color: B.textMuted }}>Complete the diagnostic and score all 6 pillars to generate your recommendation</div>
                <div className="space-y-2">
                  {[[scope&&time,"Devon Values Diagnostic"],[allScored,`All 6 Pillars Scored (${Object.keys(scores).length}/6)`]].map(([done,label],i) => (
                    <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                      style={{ background: done?"#14532D44":B.surface2, border: `1px solid ${done?"#166534":B.border}`, color: done?"#4ADE80":B.textDim }}>
                      {done?"✓":"○"} {label}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {matrixCell && (
                  <div className="rounded-xl p-4 mb-4" style={{ background: matrixCell.color+"11", border: `1px solid ${matrixCell.color}44` }}>
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: B.textMuted }}>Devon Values</div>
                    <div className="font-bold text-white">{matrixCell.value}</div>
                    <div className="text-xs mt-1" style={{ color: B.textMuted }}>{matrixCell.label} · {scope==="defined"?"Defined":"Flexible"} scope · {time==="ongoing"?"Ongoing":"Time-bound"}</div>
                  </div>
                )}

                {clientTierLabel && (
                  <div className="rounded-xl p-5 mb-4" style={{ background: clientTierColor+"11", border: `1px solid ${clientTierColor}44` }}>
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: B.textMuted }}>{isOp?"Operational Package":isSt?"Strategic Package":isIdeation?"Ideation · Fixed Duration":"Execution · Fixed Bid"}</div>
                    <div className="text-3xl font-black mb-1" style={{ color: clientTierColor }}>{clientTierLabel}</div>
                    <div className="text-sm" style={{ color: "#CCC" }}>{recTier?.desc||""}</div>
                    {isExecution && <div className="text-xs mt-2" style={{ color: B.textDim }}>Risk buffer: {riskBuffer} (+{RISK_BUFFERS[riskBuffer]*100}%)</div>}
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: B.textDim }}>Pillar Score Summary</div>
                  <div className="grid grid-cols-2 gap-2">
                    {PILLARS.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: B.surface2 }}>
                        <div>
                          <div className="text-xs font-medium text-white">{p.label}</div>
                          <div className="text-xs" style={{ color: B.textDim }}>{p.role}</div>
                        </div>
                        <Chip v={scores[p.id]} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2" style={{ background: B.surface2 }}>
                    <div className="text-xs font-semibold text-white">Pillar Multiplier</div>
                    <div className="text-sm font-black" style={{ color: B.gold }}>{avgMult?.toFixed(3)}x</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: B.textDim }}>Internal Resourcing</div>
                  <div className="space-y-2">
                    {[
                      { role:"Builder", color:ROLE_COLORS.Builder, sub:`Predictability + Drive Value${isOp&&numBuilders>1?` (×${numBuilders})`:""}`, hrs:builderHrs, rate:builderRate, show:true },
                      { role:"Connector", color:ROLE_COLORS.Connector, sub:"Presence + Clarity", hrs:connectorHrs, rate:RATES.connector, show:connectorHrs>0 },
                      { role:"Amplifier", color:ROLE_COLORS.Amplifier, sub:"Strategic Guidance + Championing", hrs:amplifierHrs, rate:RATES.amplifier, show:amplifierHrs>0 },
                    ].filter(r=>r.show).map(r => (
                      <div key={r.role} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: B.surface2 }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}></div>
                          <div>
                            <div className="text-xs font-medium text-white">{r.role}</div>
                            <div className="text-xs" style={{ color: B.textDim }}>{r.sub}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-white">{r.hrs} hrs</div>
                          <div className="text-xs" style={{ color: B.textDim }}>${r.rate}/hr · {isProject?"total":"/mo"}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: B.border2 }}>
                      <div className="text-xs font-semibold text-white">Total Hours</div>
                      <div className="text-right">
                        <div className="text-xs font-black text-white">{totalHrs} hrs {isProject?"total":"/mo"}</div>
                        <div className="text-xs" style={{ color: B.textMuted }}>List blended: ${blendedRate}/hr</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-lg p-3 space-y-1" style={{ background: B.surface2 }}>
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: B.textDim }}>Price Build-Up</div>
                  <div className="flex justify-between text-xs"><span style={{ color: B.textMuted }}>Base (hours × rates)</span><span className="text-white">${baseInv.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span style={{ color: B.textMuted }}>Pillar multiplier ({avgMult?.toFixed(3)}x)</span><span className="text-white">${Math.round(afterMult).toLocaleString()}{isRetainer?"/mo":""}</span></div>
                  {isExecution && <div className="flex justify-between text-xs"><span style={{ color: B.textMuted }}>Risk buffer (+{RISK_BUFFERS[riskBuffer]*100}%)</span><span className="text-white">${Math.round(afterRisk).toLocaleString()}</span></div>}

                  {(pctDiscTotal>0||useFreeMonth) && (
                    <div className="pt-1 mt-1 space-y-1" style={{ borderTop: `1px solid ${B.border2}` }}>
                      {useCommitPct&&commitDiscPct>0 && <div className="flex justify-between text-xs"><span className="text-green-400">Commit discount ({commitTerm})</span><span className="text-green-400">−{(commitDiscPct*100).toFixed(0)}%</span></div>}
                      {useFreeMonth && <div className="flex justify-between text-xs"><span className="text-green-400">1 free month ({commitTerm==="6mo"?"pay 5 get 6":"pay 11 get 12"})</span><span className="text-green-400">−${Math.round(freeMonthValue).toLocaleString()}</span></div>}
                      {newClientDisc>0 && <div className="flex justify-between text-xs"><span className="text-green-400">New client discount</span><span className="text-green-400">−{(newClientDisc*100).toFixed(0)}%</span></div>}
                      {volDisc>0 && <div className="flex justify-between text-xs"><span className="text-green-400">Volume discount</span><span className="text-green-400">−{(volDisc*100).toFixed(0)}%</span></div>}
                      {manualDisc>0 && <div className="flex justify-between text-xs"><span className="text-green-400">Manual override</span><span className="text-green-400">−{(manualDisc*100).toFixed(0)}%</span></div>}
                    </div>
                  )}

                  {isRetainer && commitTerm!=="none" && (
                    <div className="pt-2 mt-1 space-y-1" style={{ borderTop: `1px solid ${B.border2}` }}>
                      <div className="flex justify-between text-xs"><span style={{ color: B.textMuted }}>Monthly investment</span><span className="text-white">${finalMonthly.toLocaleString()}/mo</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: B.textMuted }}>{commitTerm} term total</span><span className="text-white">${finalTermTotal?.toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs font-bold"><span className="text-white">Hours delivered ({commitTerm})</span><span className="text-white">{termHrsDelivered.toLocaleString()} hrs</span></div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs font-bold pt-2 mt-1 rounded px-2 py-1"
                    style={{ borderTop: `1px solid ${B.border2}`, background: needsApproval?B.orange+"22":B.border2, color: needsApproval?B.orange:B.gold }}>
                    <span>Effective blended rate{isRetainer&&commitTerm!=="none"?` (${commitTerm} term)`:""}</span>
                    <span>${effectiveBlendedRate}/hr {needsApproval?"⚠":""}</span>
                  </div>
                </div>

                <div className="rounded-xl p-4 mb-4" style={{
                  border: `1px solid ${needsApproval?B.orange+"88":B.gold+"88"}`,
                  background: needsApproval?B.orange+"0F":B.gold+"0A"
                }}>
                  {needsApproval && <div className="text-xs font-bold mb-2" style={{ color: B.orange }}>⚠ Manager Approval Required — Effective rate ${effectiveBlendedRate}/hr</div>}
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: needsApproval?B.orange:B.gold, opacity:0.7 }}>
                    {isProject?"Total Investment (Client-Facing)":"Monthly Investment (Client-Facing)"}
                  </div>
                  <div className="text-4xl font-black" style={{ color: needsApproval?B.orange:B.gold }}>
                    ${finalMonthly.toLocaleString()}{isRetainer&&commitTerm!=="none"?<span className="text-lg">/mo</span>:""}
                  </div>
                  {isRetainer&&commitTerm!=="none" && (
                    <div className="text-sm mt-1 font-semibold" style={{ color: B.gold }}>
                      {commitTerm==="6mo"?"Pay 5 months, get 6":"Pay 11 months, get 12"} · ${finalTermTotal?.toLocaleString()} total
                    </div>
                  )}
                  <div className="text-xs mt-2 italic" style={{ color: B.textDim }}>Hours never shown to client</div>
                </div>

                <button onClick={reset} className="w-full py-2 rounded-lg text-xs transition-all"
                  style={{ color: B.textDim, border: `1px solid ${B.border2}`, background: "transparent" }}>
                  Reset Calculator
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
