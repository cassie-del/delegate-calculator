import { useState, useRef, useEffect } from "react";
import React from "react";

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

const getEngagement = (scope, time) => {
  if (!scope || !time || scope === "unknown" || time === "unknown")
    return { eng: "ideation", label: "Ideation", color: "#7C5CBF", desc: "Clarity before commitment", value: "Clarity & Confidence" };
  if (scope === "defined" && time === "timebound")
    return { eng: "execution", label: "Execution", color: "#2A9D6A", desc: "Deliver X by Y date", value: "Predictability & Accountability" };
  if (scope === "flexible" && time === "timebound")
    return { eng: "operational", label: "Operational", color: B.gold, desc: "Hands-on day-to-day relief", value: "Capacity & Reliability" };
  return { eng: "strategic", label: "Strategic", color: B.teal, desc: "Build toward roadmap as priorities evolve", value: "Flexibility & Momentum" };
};

const OP_TIERS = [
  { id: "execute", label: "Execute", desc: "Reliable embedded execution", color: B.gold },
  { id: "elevate", label: "Elevate", desc: "Execution + proactive delivery presence", color: B.lightBlue },
  { id: "excel", label: "Excel", desc: "Max capacity + full delivery leadership", color: "#A855F7" },
];
const ST_TIERS = [
  { id: "drive", label: "Drive", desc: "Dedicated team with strategic oversight", color: B.gold },
  { id: "amplify", label: "Amplify", desc: "Deeper presence + increased strategic guidance", color: B.lightBlue },
  { id: "excel", label: "Excel", desc: "Full partnership — maximum depth across all roles", color: "#A855F7" },
];

const SS = {
  L: { bg: "#0D2318", text: "#4ADE80", border: "#166534" },
  M: { bg: "#231A0A", text: B.gold, border: "#854D0E" },
  H: { bg: "#2A0F0A", text: B.orange, border: "#7C2D12" },
};
const ssClass = v => v ? "text-xs font-bold px-3 py-1 rounded-full border" : "";
const ssStyle = v => v ? { background: SS[v].bg, color: SS[v].text, borderColor: SS[v].border } : {};
const SL = { L: "Low", M: "Medium", H: "High" };

const PILLAR_EXTRA = { L: 0, M: 2, H: 5 };
const CONNECTOR_HRS = { L: 8, M: 15, H: 30 };
const AMPLIFIER_HRS = { L: 2, M: 5, H: 10 };
const BUILDER_BASE = 40;

const higherScore = (a, b) => {
  const order = { H: 3, M: 2, L: 1 };
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return order[a] >= order[b] ? a : b;
};

const DelegateLogo = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#2A2A2A" strokeWidth="2"/>
    <polygon points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5" fill="none" stroke="#333" strokeWidth="1"/>
    <line x1="50" y1="5" x2="50" y2="95" stroke={B.teal} strokeWidth="3" opacity="0.6"/>
    <line x1="5" y1="27.5" x2="95" y2="72.5" stroke={B.gold} strokeWidth="3" opacity="0.6"/>
    <line x1="95" y1="27.5" x2="5" y2="72.5" stroke={B.orange} strokeWidth="3" opacity="0.6"/>
    <circle cx="50" cy="50" r="8" fill={B.gold} opacity="0.9"/>
    <circle cx="50" cy="5" r="4" fill={B.teal}/><circle cx="95" cy="27.5" r="4" fill={B.lightBlue}/>
    <circle cx="95" cy="72.5" r="4" fill={B.gold}/><circle cx="50" cy="95" r="4" fill={B.orange}/>
    <circle cx="5" cy="72.5" r="4" fill={B.orange}/><circle cx="5" cy="27.5" r="4" fill={B.teal}/>
  </svg>
);

function Chip({ v }) { if (!v) return null; return <span className={ssClass(v)} style={ssStyle(v)}>{SL[v]}</span>; }

function PillarCard({ pillar, value, onChange }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${B.border2}`, background: B.surface2 }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm">{pillar.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: ROLE_COLORS[pillar.role]+"22", color: ROLE_COLORS[pillar.role], border: `1px solid ${ROLE_COLORS[pillar.role]}44` }}>{pillar.role}</span>
          </div>
          <p className="text-xs italic" style={{ color: B.textMuted }}>"{pillar.question}"</p>
        </div>
        <Chip v={value} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {["L","M","H"].map(s => (
          <button key={s} onClick={() => onChange(pillar.id, s)} className="rounded-lg p-2 text-xs text-left transition-all"
            style={value===s ? { ...ssStyle(s), border: `1px solid ${SS[s].border}` } : { border: `1px solid ${B.border}`, background: B.surface, color: B.textMuted }}>
            <div className="font-semibold mb-1">{SL[s]}</div>
            <div className="opacity-80 text-xs">{s==="L"?pillar.low:s==="M"?pillar.med:pillar.high}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HrsTypeInput({ label, value, onChange, rate, color, recommended, breakdownLabel }) {
  const [localVal, setLocalVal] = useState(String(value));
  const diff = recommended !== undefined ? value - recommended : 0;
  const hasDiff = recommended !== undefined && diff !== 0;
  const prevVal = React.useRef(value);
  if (prevVal.current !== value && String(value) !== localVal) { setLocalVal(String(value)); }
  prevVal.current = value;
  return (
    <div className="rounded-lg px-3 py-2 mb-2" style={{ background: B.surface2 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
          <div><div className="text-xs font-medium text-white">{label}</div><div className="text-xs" style={{ color: B.textDim }}>${rate}/hr</div></div>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={0} max={999} value={localVal}
            onChange={e => { setLocalVal(e.target.value); const p = parseInt(e.target.value); if (!isNaN(p)) onChange(Math.max(0, p)); }}
            onBlur={() => { if (isNaN(parseInt(localVal)) || localVal === "") setLocalVal(String(value)); }}
            className="w-16 rounded-md px-2 py-1 text-sm text-white text-center font-bold focus:outline-none"
            style={{ background: B.surface, border: `1px solid ${hasDiff ? B.gold+"88" : B.border2}` }} />
          <span className="text-xs" style={{ color: B.textDim }}>hrs</span>
        </div>
      </div>
      {breakdownLabel && (
        <div className="mt-1.5 pt-1.5 flex items-center justify-between" style={{ borderTop: `1px solid ${B.border}` }}>
          <span className="text-xs" style={{ color: B.textDim }}>{breakdownLabel}</span>
          {hasDiff && <span className="text-xs font-semibold" style={{ color: diff > 0 ? B.orange : "#4ADE80" }}>{diff > 0 ? `+${diff}` : diff}h vs recommended</span>}
        </div>
      )}
    </div>
  );
}

function StepBadge({ n }) {
  return <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0" style={{ background: `linear-gradient(135deg, ${B.gold}, ${B.orange})` }}>{n}</div>;
}
function Card({ children, className="" }) {
  return <div className={`rounded-xl p-5 mb-5 ${className}`} style={{ background: B.surface, border: `1px solid ${B.border2}` }}>{children}</div>;
}

export default function App() {
  // Salesforce auth state
  const [me, setMe] = useState(null);          // { authenticated, displayName, email, ... } or null
  const [meLoading, setMeLoading] = useState(true);
  const [oppData, setOppData] = useState(null); // { id, name, accountName, stage, amount, ... } or null
  const [oppLoading, setOppLoading] = useState(false);
  const [oppError, setOppError] = useState(null);

  const [scores, setScores] = useState({});
  const [scope, setScope] = useState(null);
  const [time, setTime] = useState(null);
  const [duration, setDuration] = useState(4);
  const [numBuilders, setNumBuilders] = useState(1);
  const [accountText, setAccountText] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [manBuilderHrs, setManBuilderHrs] = useState(null);
  const [manConnectorHrs, setManConnectorHrs] = useState(null);
  const [manAmplifierHrs, setManAmplifierHrs] = useState(null);
  const [exBuilderHrs, setExBuilderHrs] = useState(80);
  const [exConnectorHrs, setExConnectorHrs] = useState(20);
  const [exAmplifierHrs, setExAmplifierHrs] = useState(0);
  const [showAmplifier, setShowAmplifier] = useState(false);
  const [riskBuffer, setRiskBuffer] = useState("Medium");
  const [commitTerm, setCommitTerm] = useState("none");
  const [newClient, setNewClient] = useState(false);
  const [newClientPct, setNewClientPct] = useState(5);
  const [freeMonths, setFreeMonths] = useState(0);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [showDiscounts, setShowDiscounts] = useState(false);
  const fileInputRef = useRef(null);

  // On mount: check whether the user is already signed in via SF
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setMe(data); setMeLoading(false); })
      .catch(() => { setMe({ authenticated: false }); setMeLoading(false); });
  }, []);

  // Once authed, if the URL has ?opportunityId=..., fetch the Opp and pre-fill context
  useEffect(() => {
    if (!me?.authenticated) return;
    const params = new URLSearchParams(window.location.search);
    const oppId = params.get("opportunityId") || params.get("oppId");
    if (!oppId) return;
    setOppLoading(true);
    fetch(`/api/sf/opportunity?id=${encodeURIComponent(oppId)}`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: r.statusText }));
          throw new Error(err.error || "Failed to fetch Opportunity");
        }
        return r.json();
      })
      .then(opp => {
        setOppData(opp);
        // Pre-populate the Account Strategy field with Opp context
        // (only if user hasn't typed anything yet)
        setAccountText(prev => {
          if (prev && prev.trim().length > 0) return prev;
          const lines = [
            opp.accountName ? `Account: ${opp.accountName}` : null,
            opp.name ? `Opportunity: ${opp.name}` : null,
            opp.stage ? `Stage: ${opp.stage}` : null,
            opp.amount != null ? `Amount: $${Number(opp.amount).toLocaleString()}` : null,
            opp.closeDate ? `Close Date: ${opp.closeDate}` : null,
            opp.ownerName ? `Owner: ${opp.ownerName}` : null,
            opp.description ? `\nDescription:\n${opp.description}` : null,
          ].filter(Boolean);
          return lines.join("\n");
        });
      })
      .catch(e => setOppError(e.message))
      .finally(() => setOppLoading(false));
  }, [me?.authenticated]);

  // Build the OAuth login URL, preserving the current opportunityId in returnTo
  const buildLoginUrl = () => {
    const returnTo = window.location.pathname + window.location.search;
    return `/api/oauth/login?returnTo=${encodeURIComponent(returnTo)}`;
  };

  // Loading state while checking auth
  if (meLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading…</div>
    </div>
  );

  // Not authenticated → show Sign in with Salesforce
  if (!me?.authenticated) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-10 w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-8"><DelegateLogo /><span className="text-lg font-black tracking-tight text-white">Delegate</span></div>
        <h1 className="text-white font-bold text-lg mb-1">Pricing Calculator</h1>
        <p className="text-gray-500 text-xs mb-6">Sign in with your Salesforce account to continue</p>
        <a href={buildLoginUrl()} className="w-full inline-block py-3 rounded-lg font-semibold text-sm text-black transition-all" style={{ backgroundColor: '#F59E0B' }}>
          Sign in with Salesforce
        </a>
      </div>
    </div>
  );

  // Calculator logic
  const setScore = (id, val) => setScores(s => ({ ...s, [id]: val }));
  const allScored = PILLARS.every(p => scores[p.id]);
  const engCell = (scope && time) ? getEngagement(scope, time) : null;
  const engType = engCell?.eng;
  const isOp = engType==="operational", isSt = engType==="strategic", isIdeation = engType==="ideation", isExecution = engType==="execution";
  const isProject = isIdeation||isExecution, isRetainer = isOp||isSt;
  const avgMult = allScored ? PILLARS.reduce((s,p) => s+MULT[scores[p.id]],0)/PILLARS.length : null;

  const predScore = scores.predictability, dvScore = scores.driveValue;
  const connScore = higherScore(scores.presence, scores.clarity);
  const ampScore = higherScore(scores.strategicGuidance, scores.championing);
  const recBuilderExtra = (predScore ? PILLAR_EXTRA[predScore] : 0) + (dvScore ? PILLAR_EXTRA[dvScore] : 0);
  const recBuilderHrs = allScored ? (BUILDER_BASE * numBuilders) + (recBuilderExtra * numBuilders) : 0;
  const recConnectorHrs = connScore ? CONNECTOR_HRS[connScore] : 0;
  const recAmplifierHrs = ampScore ? AMPLIFIER_HRS[ampScore] : 0;

  const builderBreakdown = allScored ? `${numBuilders}×${BUILDER_BASE}h + ${numBuilders}×${recBuilderExtra}h (Pred:${predScore} +${PILLAR_EXTRA[predScore]}, DV:${dvScore} +${PILLAR_EXTRA[dvScore]})` : "Score pillars to calculate";
  const connBreakdown = connScore ? `Higher of Pres(${scores.presence})/Clar(${scores.clarity}) → ${connScore} = ${CONNECTOR_HRS[connScore]}h/mo` : "Score pillars to calculate";
  const ampBreakdown = ampScore ? `Higher of Strat(${scores.strategicGuidance})/Champ(${scores.championing}) → ${ampScore} = ${AMPLIFIER_HRS[ampScore]}h/mo` : "Score pillars to calculate";

  let builderRate = RATES.builderSt;
  if (isOp) builderRate = RATES.builderOp;
  else if (isExecution) builderRate = RATES.builderEx;

  let builderHrs, connectorHrs, amplifierHrs;
  if (isExecution) { builderHrs=exBuilderHrs; connectorHrs=exConnectorHrs; amplifierHrs=showAmplifier?exAmplifierHrs:0; }
  else { builderHrs=manBuilderHrs!==null?manBuilderHrs:recBuilderHrs; connectorHrs=manConnectorHrs!==null?manConnectorHrs:recConnectorHrs; amplifierHrs=manAmplifierHrs!==null?manAmplifierHrs:recAmplifierHrs; }

  const anyDiff = !isExecution && (manBuilderHrs!==null||manConnectorHrs!==null||manAmplifierHrs!==null) && (builderHrs!==recBuilderHrs||connectorHrs!==recConnectorHrs||amplifierHrs!==recAmplifierHrs);
  const totalHrs = builderHrs+connectorHrs+amplifierHrs;
  const recTotalHrs = recBuilderHrs+recConnectorHrs+recAmplifierHrs;
  const baseInv = (builderHrs*builderRate)+(connectorHrs*RATES.connector)+(amplifierHrs*RATES.amplifier);
  const recBaseInv = (recBuilderHrs*builderRate)+(recConnectorHrs*RATES.connector)+(recAmplifierHrs*RATES.amplifier);
  const blendedRate = totalHrs>0 ? Math.round(baseInv/totalHrs) : 0;
  const afterMult = avgMult ? baseInv*avgMult : baseInv;
  const afterRisk = isExecution ? afterMult*(1+RISK_BUFFERS[riskBuffer]) : afterMult;
  const monthlyInv = afterRisk;

  const commitDiscPct = commitTerm!=="none" ? COMMIT_DISCOUNTS[commitTerm] : 0;
  const newClientDisc = newClient ? newClientPct/100 : 0;
  const volDisc = isRetainer ? (VOLUME_DISCOUNTS.find(v => totalHrs>=v.min && totalHrs<=v.max)?.pct||0) : 0;
  const manualDisc = manualDiscount/100;
  const pctDiscTotal = commitDiscPct+newClientDisc+volDisc+manualDisc;
  const monthlyAfterPctDisc = monthlyInv*(1-pctDiscTotal);
  const termMonths = COMMIT_TERMS[commitTerm]||1;
  const paidMonths = Math.max(1, termMonths-freeMonths);
  const freeMonthValue = freeMonths>0 ? monthlyAfterPctDisc*freeMonths : 0;
  const termRevenue = isRetainer&&commitTerm!=="none" ? monthlyAfterPctDisc*paidMonths : monthlyAfterPctDisc;
  const termHrsDelivered = isRetainer&&commitTerm!=="none" ? totalHrs*termMonths : totalHrs;
  const effectiveBlendedRate = isRetainer&&commitTerm!=="none"&&termHrsDelivered>0 ? Math.round(termRevenue/termHrsDelivered) : Math.round(monthlyAfterPctDisc/(totalHrs||1));
  const finalMonthly = Math.round(monthlyAfterPctDisc/100)*100;
  const finalTermTotal = isRetainer&&commitTerm!=="none" ? Math.round(termRevenue/100)*100 : null;
  const discountEquivPct = blendedRate>0 ? 1-(effectiveBlendedRate/blendedRate) : 0;
  const needsApproval = (pctDiscTotal>MAX_AUTO_DISCOUNT)||(freeMonths>0&&discountEquivPct>MAX_AUTO_DISCOUNT);

  const needsConnector = ["presence","clarity"].some(p => scores[p]==="M"||scores[p]==="H");
  const amplifierDepth = ["strategicGuidance","championing"].filter(p => scores[p]==="H").length;
  // Recommendation: use original calculator logic. Operational tier depends on Connector need
  // and number of builders. Strategic tier depends on how many amplifier-related pillars are High.
  const recTier = isOp?(needsConnector?(numBuilders>1?OP_TIERS[2]:OP_TIERS[1]):OP_TIERS[0]):isSt?(amplifierDepth>=2?ST_TIERS[2]:amplifierDepth===1?ST_TIERS[1]:ST_TIERS[0]):null;
  const clientTierLabel = recTier?.label||(isIdeation?"Ideation":isExecution?"Execution Project":null);
  const clientTierColor = recTier?.color||(isIdeation?"#7C5CBF":isExecution?"#2A9D6A":B.textDim);

  // Tier scenario math.
  // RECOMMENDED tier: mirrors main pricing flow exactly (actual hours, actual final price) so the
  // number on the recommended card always equals the client-facing investment in the right column.
  // NON-RECOMMENDED tiers: show canonical reference pricing for that tier level, with discounts applied.
  const computeTierScenario = (tierId, engagement) => {
    const isRecommended = recTier?.id === tierId;
    let bHrs, cHrs, aHrs, bldrs;
    const perBuilderHrs = BUILDER_BASE + (PILLAR_EXTRA[predScore]||0) + (PILLAR_EXTRA[dvScore]||0);

    if (isRecommended) {
      // Actual scored engagement — matches main output by construction
      bldrs = numBuilders; bHrs = builderHrs; cHrs = connectorHrs; aHrs = amplifierHrs;
    } else if (engagement === "strategic") {
      bldrs = 1;
      if (tierId === "drive") {
        bHrs = BUILDER_BASE; cHrs = CONNECTOR_HRS.L; aHrs = AMPLIFIER_HRS.L;
      } else if (tierId === "amplify") {
        bHrs = BUILDER_BASE + (PILLAR_EXTRA.M * 2); cHrs = CONNECTOR_HRS.M; aHrs = AMPLIFIER_HRS.M;
      } else {
        bHrs = BUILDER_BASE + (PILLAR_EXTRA.H * 2); cHrs = CONNECTOR_HRS.H; aHrs = AMPLIFIER_HRS.H;
      }
    } else if (engagement === "operational") {
      if (tierId === "execute") {
        bldrs = 1; bHrs = perBuilderHrs; cHrs = 0; aHrs = 0;
      } else if (tierId === "elevate") {
        bldrs = 1; bHrs = perBuilderHrs; cHrs = connScore ? CONNECTOR_HRS[connScore] : 0; aHrs = 0;
      } else {
        bldrs = 2; bHrs = 2 * perBuilderHrs; cHrs = connScore ? CONNECTOR_HRS[connScore] : 0; aHrs = 0;
      }
    } else {
      return null;
    }

    // Recommended tier reuses the main pricing output's final number (guaranteed match)
    if (isRecommended) {
      return {
        builders: bldrs, bHrs, cHrs, aHrs,
        totalHrs: bHrs + cHrs + aHrs,
        includeConn: cHrs > 0, includeAmp: aHrs > 0,
        finalRounded: finalMonthly,
        discountPct: pctDiscTotal,
      };
    }

    // Non-recommended tier: run pricing build-up fresh with discounts applied
    const tBuilderRate = engagement === "operational" ? RATES.builderOp : RATES.builderSt;
    const tBase = (bHrs * tBuilderRate) + (cHrs * RATES.connector) + (aHrs * RATES.amplifier);
    const tAfterMult = avgMult ? tBase * avgMult : tBase;
    const tTotalHrs = bHrs + cHrs + aHrs;
    const tVolDisc = VOLUME_DISCOUNTS.find(v => tTotalHrs >= v.min && tTotalHrs <= v.max)?.pct || 0;
    const tDiscTotal = commitDiscPct + newClientDisc + tVolDisc + manualDisc;
    const tAfterDisc = tAfterMult * (1 - tDiscTotal);

    return {
      builders: bldrs, bHrs, cHrs, aHrs,
      totalHrs: tTotalHrs,
      includeConn: cHrs > 0, includeAmp: aHrs > 0,
      finalRounded: Math.round(tAfterDisc / 100) * 100,
      discountPct: tDiscTotal,
    };
  };

  const discountParts = [];
  if (freeMonths>0) discountParts.push(`${freeMonths} free mo`);
  if (pctDiscTotal>0) discountParts.push(`−${(pctDiscTotal*100).toFixed(0)}%`);
  const discountBadgeText = discountParts.join(" + ");
  const hasEngagement = scope && time;

  // File upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10*1024*1024) { alert("File too large. Max 10MB."); return; }
    const allowed = ["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword","image/png","image/jpeg"];
    if (!allowed.includes(file.type)) { alert("Please upload a PDF, Word doc, or image."); return; }
    const reader = new FileReader();
    reader.onload = () => { setUploadedFile({ data: reader.result.split(",")[1], type: file.type, name: file.name }); setUploadedFileName(file.name); };
    reader.readAsDataURL(file);
  };
  const removeFile = () => { setUploadedFile(null); setUploadedFileName(""); if (fileInputRef.current) fileInputRef.current.value=""; };

  // AI scoring
  const analyzeWithAI = async () => {
    if (!accountText.trim() && !uploadedFile) return;
    setAnalyzing(true); setAiSummary("");
    try {
      const body = { accountText: accountText.trim() };
      if (uploadedFile) { body.fileData = uploadedFile.data; body.fileType = uploadedFile.type; body.fileName = uploadedFile.name; }
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API request failed");
      const text = data.content?.find(b => b.type==="text")?.text || "";
      const p = JSON.parse(text.replace(/```json|```/g,"").trim());
      setScores({ presence:p.presence, clarity:p.clarity, predictability:p.predictability, driveValue:p.driveValue, strategicGuidance:p.strategicGuidance, championing:p.championing });
      if (p.scope) setScope(p.scope);
      if (p.time) setTime(p.time);
      if (p.duration) setDuration(p.duration);
      if (p.numBuilders) setNumBuilders(p.numBuilders);
      if (p.exBuilderHrs) setExBuilderHrs(p.exBuilderHrs);
      if (p.exConnectorHrs) setExConnectorHrs(p.exConnectorHrs);
      if (p.exAmplifierHrs && p.exAmplifierHrs>0) { setExAmplifierHrs(p.exAmplifierHrs); setShowAmplifier(true); }
      if (p.riskBuffer) setRiskBuffer(p.riskBuffer);
      if (p.summary) setAiSummary(p.summary);
      setManBuilderHrs(null); setManConnectorHrs(null); setManAmplifierHrs(null);
    } catch(e) { setAiSummary("Could not analyze — "+(e.message||"try again or complete fields manually.")); }
    setAnalyzing(false);
  };

  const reset = () => {
    setScores({}); setScope(null); setTime(null); setDuration(4); setNumBuilders(1);
    setAccountText(""); setUploadedFile(null); setUploadedFileName(""); setAiSummary(""); setAnalyzing(false);
    setExBuilderHrs(80); setExConnectorHrs(20); setExAmplifierHrs(0); setShowAmplifier(false); setRiskBuffer("Medium");
    setCommitTerm("none"); setNewClient(false); setNewClientPct(5); setFreeMonths(0); setManualDiscount(0); setShowDiscounts(false);
    setManBuilderHrs(null); setManConnectorHrs(null); setManAmplifierHrs(null);
    if (fileInputRef.current) fileInputRef.current.value="";
  };

  const selBtn = (active, color) => ({ border:`1px solid ${active?color:B.border}`, background:active?color+"18":B.surface, color:active?color:B.textMuted, transition:"all 0.15s" });

  const matrixData = [
    [null,"Defined","Flexible","Unknown"],
    ["Timebound",
      { label:"Execution", color:"#2A9D6A", desc:"Deliver X by Y date", s:"defined", t:"timebound" },
      { label:"Operational", color:B.gold, desc:"Hands-on day-to-day relief", s:"flexible", t:"timebound" },
      { label:"Ideation", color:"#7C5CBF", desc:"Clarity before commitment", s:"unknown", t:"timebound" }],
    ["Ongoing",
      { label:"Strategic", color:B.teal, desc:"Build toward roadmap", s:"defined", t:"ongoing" },
      { label:"Strategic", color:B.teal, desc:"Build toward roadmap", s:"flexible", t:"ongoing" },
      { label:"Ideation", color:"#7C5CBF", desc:"Clarity before commitment", s:"unknown", t:"ongoing" }],
    ["Unknown",
      { label:"Ideation", color:"#7C5CBF", desc:"Clarity before commitment", s:"defined", t:"unknown" },
      { label:"Ideation", color:"#7C5CBF", desc:"Clarity before commitment", s:"flexible", t:"unknown" },
      { label:"Ideation", color:"#7C5CBF", desc:"Clarity before commitment", s:"unknown", t:"unknown" }],
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background:B.bg, color:B.text }}>
      <div style={{ borderBottom:`1px solid ${B.border2}`, background:B.surface }} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3"><DelegateLogo /><div><div className="text-lg font-black tracking-tight text-white">Delegate</div><div className="text-xs" style={{ color:B.textDim }}>Pricing & Resourcing Calculator</div></div></div>
          <div className="flex items-center gap-5">
            <div className="text-right hidden md:block"><div className="text-xs mb-1" style={{ color:B.textDim }}>Role Rates</div>
              <div className="flex gap-3 text-xs"><div><span className="font-bold" style={{ color:B.gold }}>Builder</span><span style={{ color:B.textMuted }}> $225–$240</span></div><div><span className="font-bold" style={{ color:B.lightBlue }}>Connector</span><span style={{ color:B.textMuted }}> $265</span></div><div><span className="font-bold" style={{ color:B.orange }}>Amplifier</span><span style={{ color:B.textMuted }}> $325</span></div></div>
            </div>
            <div className="flex items-center gap-2 pl-4" style={{ borderLeft:`1px solid ${B.border2}` }}>
              <div className="text-right">
                <div className="text-xs" style={{ color:B.textDim }}>Signed in</div>
                <div className="text-xs font-semibold text-white">{me.displayName}</div>
              </div>
              <a href="/api/oauth/logout" className="text-xs px-2 py-1 rounded" style={{ color:B.textDim, border:`1px solid ${B.border2}` }} title="Sign out">↗</a>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity context banner — shows when launched from a Salesforce Opp */}
      {(oppLoading || oppData || oppError) && (
        <div style={{ background:B.surface2, borderBottom:`1px solid ${B.border}` }} className="px-6 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center gap-3 text-xs">
            {oppLoading && <span style={{ color:B.textDim }}>Loading Opportunity from Salesforce…</span>}
            {oppError && <span style={{ color:"#FCA5A5" }}>⚠ {oppError}</span>}
            {oppData && (
              <>
                <span className="font-bold" style={{ color:B.gold }}>◆ Working from Salesforce Opportunity</span>
                <span style={{ color:B.textDim }}>·</span>
                <span className="text-white font-semibold">{oppData.accountName}</span>
                <span style={{ color:B.textDim }}>·</span>
                <span style={{ color:B.textMuted }}>{oppData.name}</span>
                <span style={{ color:B.textDim }}>·</span>
                <span style={{ color:B.textMuted }}>{oppData.stage}</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {/* STEP 1: Account Strategy + File Upload + AI */}
          <Card>
            <div className="flex items-center gap-2 mb-3"><StepBadge n="1" /><h2 className="font-semibold text-white">Account Strategy</h2><span className="text-xs" style={{ color:B.textDim }}>(optional)</span></div>
            <textarea className="w-full rounded-lg p-3 text-sm resize-none focus:outline-none" style={{ background:B.surface2, border:`1px solid ${B.border2}`, color:"#CCC", caretColor:B.gold }} rows={3} placeholder="Paste account strategy or pre-sales notes..." value={accountText} onChange={e => setAccountText(e.target.value)} />
            <div className="mt-2">
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
              {!uploadedFile ? (
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2" style={{ border:`1px dashed ${B.border2}`, background:B.surface2, color:B.textMuted }}>
                  <span style={{ fontSize:"16px" }}>📎</span> Upload PDF, Word doc, or image
                </button>
              ) : (
                <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background:B.teal+"15", border:`1px solid ${B.teal}44` }}>
                  <div className="flex items-center gap-2"><span style={{ fontSize:"14px" }}>📄</span><span className="text-xs font-medium" style={{ color:B.lightBlue }}>{uploadedFileName}</span></div>
                  <button onClick={removeFile} className="text-xs px-2 py-1 rounded" style={{ color:B.textMuted, background:B.surface2 }}>✕ Remove</button>
                </div>
              )}
            </div>
            <button onClick={analyzeWithAI} disabled={(!accountText.trim()&&!uploadedFile)||analyzing}
              className="mt-2 w-full py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background:(accountText.trim()||uploadedFile)&&!analyzing?`linear-gradient(135deg, ${B.gold}, ${B.orange})`:B.surface2, color:(accountText.trim()||uploadedFile)&&!analyzing?"#000":B.textDim, border:`1px solid ${B.border2}` }}>
              {analyzing ? "Analyzing..." : `⚡ Auto-Score with AI${uploadedFile?" (with document)":""}`}
            </button>
            {aiSummary && <div className="mt-3 p-3 rounded-lg text-xs" style={{ background:B.teal+"18", border:`1px solid ${B.teal}44`, color:B.lightBlue }}><span className="font-semibold" style={{ color:"#7DD3FC" }}>AI Analysis: </span>{aiSummary}</div>}
          </Card>

          {/* STEP 2: Scope + Time */}
          <Card>
            <div className="flex items-center gap-2 mb-1"><StepBadge n="2" /><h2 className="font-semibold text-white">What Does Devon Value?</h2></div>
            <p className="text-xs mb-4 ml-8" style={{ color:B.textDim }}>Select scope and engagement horizon. Choose "Unknown" to default to Ideation.</p>
            <div className="mb-3">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Scope of work</div>
              <div className="grid grid-cols-3 gap-2">
                {[["defined","Defined","Clear requirements"],["flexible","Flexible","Still evolving"],["unknown","Unknown","Not yet determined"]].map(([v,l,s]) => (
                  <button key={v} onClick={() => { setScope(v); setManBuilderHrs(null); setManConnectorHrs(null); setManAmplifierHrs(null); }} className="rounded-lg p-3 text-left transition-all" style={selBtn(scope===v, v==="unknown"?"#7C5CBF":B.gold)}>
                    <div className="font-semibold text-sm">{l}</div><div className="text-xs mt-0.5" style={{ color:B.textDim }}>{s}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Engagement horizon</div>
              <div className="grid grid-cols-3 gap-2">
                {[["timebound","Time-Bound","Defined end date"],["ongoing","Ongoing","No fixed end date"],["unknown","Unknown","Not yet determined"]].map(([v,l,s]) => (
                  <button key={v} onClick={() => { setTime(v); setManBuilderHrs(null); setManConnectorHrs(null); setManAmplifierHrs(null); }} className="rounded-lg p-3 text-left transition-all" style={selBtn(time===v, v==="unknown"?"#7C5CBF":B.gold)}>
                    <div className="font-semibold text-sm">{l}</div><div className="text-xs mt-0.5" style={{ color:B.textDim }}>{s}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${B.border2}` }}>
              <div className="grid grid-cols-4 text-xs">
                {matrixData[0].map((h,i) => <div key={i} style={{ background:B.surface2, borderLeft:i>0?`1px solid ${B.border2}`:"none", color:B.textMuted }} className="p-2 text-center font-semibold">{h||""}</div>)}
                {matrixData.slice(1).map((row,ri) => row.map((cell,ci) => {
                  if (ci===0) return <div key={`r${ri}`} style={{ background:B.surface2, borderTop:`1px solid ${B.border2}`, color:B.textMuted }} className="p-2 font-semibold flex items-center justify-center text-center">{cell}</div>;
                  const active = scope===cell.s && time===cell.t;
                  return <button key={`r${ri}c${ci}`} onClick={() => { setScope(cell.s); setTime(cell.t); setManBuilderHrs(null); setManConnectorHrs(null); setManAmplifierHrs(null); }}
                    className="p-2.5 text-left transition-all" style={{ background:active?cell.color+"22":"#0D0D0D", borderTop:`1px solid ${B.border2}`, borderLeft:`1px solid ${B.border2}` }}>
                    <div className="font-bold text-xs mb-0.5" style={{ color:active?cell.color:B.textMuted }}>{cell.label}</div>
                    <div className="text-xs" style={{ color:B.textDim }}>{cell.desc}</div>
                  </button>;
                })).flat()}
              </div>
            </div>
            {hasEngagement && engCell && (
              <div className="mt-3 p-3 rounded-lg flex items-center gap-3" style={{ background:engCell.color+"15", border:`1px solid ${engCell.color}44` }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor:engCell.color }}></div>
                <div><div className="text-sm font-bold" style={{ color:engCell.color }}>{engCell.label}</div><div className="text-xs" style={{ color:B.textMuted }}>{engCell.desc} — {engCell.value}</div></div>
              </div>
            )}
            {isIdeation && (
              <div className="mt-4 pt-4" style={{ borderTop:`1px solid ${B.border2}` }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Duration (sprint-aligned)</div>
                <div className="grid grid-cols-6 gap-1">{[2,4,6,8,10,12].map(w => (
                  <button key={w} onClick={() => setDuration(w)} className="py-2 rounded-lg text-sm font-bold transition-all" style={selBtn(duration===w, "#7C5CBF")}>{w}w</button>
                ))}</div>
              </div>
            )}
          </Card>

          {/* STEP 3: Pillars */}
          <Card>
            <div className="flex items-center gap-2 mb-4"><StepBadge n="3" /><h2 className="font-semibold text-white">Score the Six Pillars</h2></div>
            {PILLARS.map(p => <PillarCard key={p.id} pillar={p} value={scores[p.id]} onChange={setScore}/>)}
          </Card>

          {/* STEP 4: Hours (non-execution) */}
          {!isExecution && allScored && hasEngagement && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><StepBadge n="4" /><h2 className="font-semibold text-white">Resourcing — Hours / {isIdeation?"Sprint":"Month"}</h2></div>
                {anyDiff && <button onClick={() => { setManBuilderHrs(null); setManConnectorHrs(null); setManAmplifierHrs(null); }} className="text-xs px-2 py-1 rounded" style={{ color:B.gold, background:B.gold+"18", border:`1px solid ${B.gold}44` }}>↺ Reset</button>}
              </div>
              <p className="text-xs mb-4 ml-8" style={{ color:B.textDim }}>Hours calculated from pillar scores. Override below.</p>
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Number of Builders</div>
                <div className="flex gap-2">{[1,2,3,4].map(n => <button key={n} onClick={() => { setNumBuilders(n); setManBuilderHrs(null); }} className="flex-1 py-2 rounded-lg text-sm font-bold transition-all" style={selBtn(numBuilders===n, B.gold)}>{n}</button>)}</div>
              </div>
              <HrsTypeInput label="Builder" value={builderHrs} recommended={recBuilderHrs} onChange={v=>setManBuilderHrs(v)} rate={builderRate} color={ROLE_COLORS.Builder} breakdownLabel={builderBreakdown}/>
              <HrsTypeInput label="Connector" value={connectorHrs} recommended={recConnectorHrs} onChange={v=>setManConnectorHrs(v)} rate={RATES.connector} color={ROLE_COLORS.Connector} breakdownLabel={connBreakdown}/>
              <HrsTypeInput label="Amplifier" value={amplifierHrs} recommended={recAmplifierHrs} onChange={v=>setManAmplifierHrs(v)} rate={RATES.amplifier} color={ROLE_COLORS.Amplifier} breakdownLabel={ampBreakdown}/>
              <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2" style={{ background:B.border2 }}><div className="text-xs font-semibold text-white">Total Hours</div><div className="text-xs font-black text-white">{totalHrs} hrs/{isIdeation?"sprint":"mo"}</div></div>
            </Card>
          )}

          {/* STEP 4: Hours (execution) */}
          {isExecution && allScored && hasEngagement && (
            <Card>
              <div className="flex items-center gap-2 mb-4"><StepBadge n="4" /><h2 className="font-semibold text-white">Estimated Implementation Hours</h2></div>
              <HrsTypeInput label="Builder" value={exBuilderHrs} onChange={setExBuilderHrs} rate={RATES.builderEx} color={ROLE_COLORS.Builder} breakdownLabel="Execution project estimate"/>
              <HrsTypeInput label="Connector" value={exConnectorHrs} onChange={setExConnectorHrs} rate={RATES.connector} color={ROLE_COLORS.Connector} breakdownLabel="Execution project estimate"/>
              <button onClick={() => { setShowAmplifier(!showAmplifier); if(showAmplifier) setExAmplifierHrs(0); }} className="w-full py-2 rounded-lg text-xs font-semibold transition-all mb-2" style={selBtn(showAmplifier, B.orange)}>{showAmplifier?"− Remove Amplifier":"+ Add Amplifier"}</button>
              {showAmplifier && <HrsTypeInput label="Amplifier" value={exAmplifierHrs} onChange={setExAmplifierHrs} rate={RATES.amplifier} color={ROLE_COLORS.Amplifier} breakdownLabel="Execution project estimate"/>}
              <div className="mt-3"><div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Complexity / Risk Buffer</div>
                <div className="grid grid-cols-3 gap-2">{["Low","Medium","High"].map(b => <button key={b} onClick={() => setRiskBuffer(b)} className="py-2 rounded-lg text-xs font-bold transition-all" style={selBtn(riskBuffer===b, b==="Low"?"#4ADE80":b==="Medium"?B.gold:B.orange)}>{b}<div className="text-xs opacity-70">+{RISK_BUFFERS[b]*100}%</div></button>)}</div>
              </div>
            </Card>
          )}

          {/* STEP 5: Discounts */}
          <div className="rounded-xl p-5" style={{ background:B.surface, border:`1px solid ${B.border2}` }}>
            <button onClick={() => setShowDiscounts(!showDiscounts)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap"><StepBadge n="5" /><h2 className="font-semibold text-white">Discounts & Incentives</h2>
                {discountBadgeText && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"#14532D44", border:"1px solid #166534", color:"#4ADE80" }}>{discountBadgeText} applied</span>}
                {needsApproval && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:B.orange+"22", border:`1px solid ${B.orange}66`, color:B.orange }}>⚠ Approval required</span>}
              </div>
              <span className="text-xs" style={{ color:B.textDim }}>{showDiscounts?"▲":"▼"}</span>
            </button>
            {showDiscounts && (
              <div className="mt-4 space-y-5">
                <div><div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Commitment Term</div>
                  <div className="grid grid-cols-4 gap-2">{[["none","None","—"],["3mo","3 Month","5% off"],["6mo","6 Month","8% off"],["12mo","12 Month","12% off"]].map(([v,l,d]) => (
                    <button key={v} onClick={() => { setCommitTerm(v); if(v==="none") setFreeMonths(0); }} className="rounded-lg p-2 text-center transition-all" style={selBtn(commitTerm===v, B.gold)}><div className="font-semibold text-xs">{l}</div><div className="text-xs opacity-70">{d}</div></button>
                  ))}</div>
                </div>
                {isRetainer && commitTerm!=="none" && (
                  <div><div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Free Months</div>
                    <div className="flex items-center gap-3">
                      <input type="number" min={0} max={termMonths-1} value={freeMonths} onChange={e => setFreeMonths(Math.min(termMonths-1, Math.max(0, parseInt(e.target.value)||0)))} className="w-20 rounded-lg px-3 py-2 text-sm text-white text-center font-bold focus:outline-none" style={{ background:B.surface2, border:`1px solid ${freeMonths>0?"#4ADE8066":B.border2}` }}/>
                      <div><span className="text-xs" style={{ color:B.textMuted }}>free month{freeMonths!==1?"s":""} in {commitTerm} term</span>{freeMonths>0 && <div className="text-xs mt-0.5" style={{ color:"#4ADE80" }}>Client pays {paidMonths}, gets {termMonths}</div>}</div>
                    </div>
                    {freeMonths>0 && <div className="mt-2 p-2 rounded-lg text-xs" style={{ background:"#14532D22", border:"1px solid #16653444", color:"#4ADE80" }}>Free month value: ${Math.round(freeMonthValue).toLocaleString()}</div>}
                  </div>
                )}
                <div><div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>New Client Discount</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setNewClient(!newClient)} className="px-4 py-2 rounded-lg text-xs font-semibold transition-all" style={selBtn(newClient, "#4ADE80")}>{newClient?"✓ Applied":"Apply"}</button>
                    {newClient && <div className="flex items-center gap-2"><input type="number" min={0} max={20} value={newClientPct} onChange={e => setNewClientPct(Math.min(20,Math.max(0,parseInt(e.target.value)||0)))} className="w-16 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none" style={{ background:B.surface2, border:`1px solid ${B.border2}` }}/><span className="text-xs" style={{ color:B.textMuted }}>%</span></div>}
                  </div>
                </div>
                {isRetainer && <div><div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Volume Discount <span style={{ color:B.textDim, textTransform:"none", fontWeight:"normal" }}>(auto)</span></div>
                  <div className="grid grid-cols-4 gap-1">{VOLUME_DISCOUNTS.map(v => { const active=totalHrs>=v.min&&totalHrs<=v.max; return <div key={v.label} className="rounded-lg p-2 text-center text-xs" style={{ border:`1px solid ${active?"#166534":B.border}`, background:active?"#14532D44":B.surface2, color:active?"#4ADE80":B.textDim }}><div className="font-semibold">{v.label}</div><div>{v.pct>0?`${v.pct*100}%`:"—"}</div>{active && <div className="text-xs mt-0.5">← current</div>}</div>; })}</div>
                </div>}
                <div><div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:B.textMuted }}>Manual Override %</div>
                  <div className="flex items-center gap-3"><input type="number" min={0} max={50} value={manualDiscount} onChange={e => setManualDiscount(Math.min(50,Math.max(0,parseInt(e.target.value)||0)))} className="w-20 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none" style={{ background:B.surface2, border:`1px solid ${B.border2}` }}/><span className="text-xs" style={{ color:B.textMuted }}>% additional</span></div>
                </div>
                {needsApproval && <div className="p-3 rounded-lg" style={{ background:B.orange+"18", border:`1px solid ${B.orange}55` }}><div className="text-xs font-bold mb-1" style={{ color:B.orange }}>⚠ Manager Approval Required</div><div className="text-xs" style={{ color:"#FCA98A" }}>Effective discount {(discountEquivPct*100).toFixed(1)}% exceeds 10% threshold.</div></div>}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl p-5" style={{ background:B.surface, border:`1px solid ${B.border2}` }}>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><span style={{ color:B.gold }}>◆</span> Internal Pricing Output</h2>
            {(!allScored||!hasEngagement) ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📋</div>
                <div className="text-sm mb-4" style={{ color:B.textMuted }}>Complete the diagnostic to generate your recommendation</div>
                <div className="space-y-2">
                  {[[hasEngagement,"Engagement Type Selected"],[allScored,`All 6 Pillars Scored (${Object.keys(scores).length}/6)`]].map(([done,label],i) => (
                    <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background:done?"#14532D44":B.surface2, border:`1px solid ${done?"#166534":B.border}`, color:done?"#4ADE80":B.textDim }}>{done?"✓":"○"} {label}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {engCell && <div className="rounded-xl p-4 mb-4" style={{ background:engCell.color+"11", border:`1px solid ${engCell.color}44` }}><div className="text-xs uppercase tracking-widest mb-1" style={{ color:B.textMuted }}>Devon Values</div><div className="font-bold text-white">{engCell.value}</div><div className="text-xs mt-1" style={{ color:B.textMuted }}>{engCell.label} · {scope==="unknown"?"Unknown":scope==="defined"?"Defined":"Flexible"} · {time==="unknown"?"Unknown":time==="ongoing"?"Ongoing":"Time-bound"}</div></div>}
                {clientTierLabel && <div className="rounded-xl p-5 mb-4" style={{ background:clientTierColor+"11", border:`1px solid ${clientTierColor}44` }}><div className="text-xs uppercase tracking-widest mb-1" style={{ color:B.textMuted }}>{isOp?"Operational Package":isSt?"Strategic Package":isIdeation?"Ideation · Discovery":"Execution · Fixed Bid"}</div><div className="text-3xl font-black mb-1" style={{ color:clientTierColor }}>{clientTierLabel}</div><div className="text-sm" style={{ color:"#CCC" }}>{recTier?.desc||""}</div></div>}

                <div className="mb-4"><div className="text-xs uppercase tracking-widest mb-2" style={{ color:B.textDim }}>Pillar Score Summary</div>
                  <div className="grid grid-cols-2 gap-2">{PILLARS.map(p => <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background:B.surface2 }}><div><div className="text-xs font-medium text-white">{p.label}</div><div className="text-xs" style={{ color:B.textDim }}>{p.role}</div></div><Chip v={scores[p.id]}/></div>)}</div>
                  <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2" style={{ background:B.surface2 }}><div className="text-xs font-semibold text-white">Pillar Multiplier</div><div className="text-sm font-black" style={{ color:B.gold }}>{avgMult?.toFixed(3)}x</div></div>
                </div>

                {anyDiff && !isExecution && (
                  <div className="mb-4 rounded-xl overflow-hidden" style={{ border:`1px solid ${B.gold}44` }}>
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-widest" style={{ background:B.gold+"18", color:B.gold }}>Recommended vs Yours</div>
                    <div className="grid grid-cols-4 text-xs" style={{ background:B.surface2 }}>
                      <div className="px-3 py-2 font-semibold" style={{ color:B.textMuted, borderBottom:`1px solid ${B.border}` }}>Role</div>
                      <div className="px-3 py-2 font-semibold text-center" style={{ color:B.textMuted, borderBottom:`1px solid ${B.border}`, borderLeft:`1px solid ${B.border}` }}>Rec.</div>
                      <div className="px-3 py-2 font-semibold text-center" style={{ color:B.gold, borderBottom:`1px solid ${B.border}`, borderLeft:`1px solid ${B.border}` }}>Yours</div>
                      <div className="px-3 py-2 font-semibold text-center" style={{ color:B.textMuted, borderBottom:`1px solid ${B.border}`, borderLeft:`1px solid ${B.border}` }}>Δ</div>
                      {[{role:"Builder",color:ROLE_COLORS.Builder,rec:recBuilderHrs,cur:builderHrs},{role:"Connector",color:ROLE_COLORS.Connector,rec:recConnectorHrs,cur:connectorHrs},{role:"Amplifier",color:ROLE_COLORS.Amplifier,rec:recAmplifierHrs,cur:amplifierHrs}].filter(r=>r.rec>0||r.cur>0).map(r=>{const d=r.cur-r.rec;return(<React.Fragment key={r.role}><div className="px-3 py-2 flex items-center gap-1.5" style={{ borderBottom:`1px solid ${B.border}` }}><div className="w-2 h-2 rounded-full" style={{ backgroundColor:r.color }}></div><span className="text-white">{r.role}</span></div><div className="px-3 py-2 text-center" style={{ color:B.textMuted, borderBottom:`1px solid ${B.border}`, borderLeft:`1px solid ${B.border}` }}>{r.rec}h</div><div className="px-3 py-2 text-center font-bold" style={{ color:B.text, borderBottom:`1px solid ${B.border}`, borderLeft:`1px solid ${B.border}` }}>{r.cur}h</div><div className="px-3 py-2 text-center font-bold" style={{ color:d===0?B.textDim:d>0?B.orange:"#4ADE80", borderBottom:`1px solid ${B.border}`, borderLeft:`1px solid ${B.border}` }}>{d===0?"—":d>0?`+${d}`:d}</div></React.Fragment>);})}
                      <div className="px-3 py-2 font-bold text-white">Total</div>
                      <div className="px-3 py-2 text-center font-bold" style={{ color:B.textMuted, borderLeft:`1px solid ${B.border}` }}>{recTotalHrs}h</div>
                      <div className="px-3 py-2 text-center font-bold" style={{ color:B.text, borderLeft:`1px solid ${B.border}` }}>{totalHrs}h</div>
                      <div className="px-3 py-2 text-center font-bold" style={{ color:totalHrs-recTotalHrs===0?B.textDim:totalHrs-recTotalHrs>0?B.orange:"#4ADE80", borderLeft:`1px solid ${B.border}` }}>{totalHrs-recTotalHrs===0?"—":totalHrs-recTotalHrs>0?`+${totalHrs-recTotalHrs}`:totalHrs-recTotalHrs}</div>
                    </div>
                    <div className="grid grid-cols-2 text-xs" style={{ borderTop:`1px solid ${B.gold}33` }}>
                      <div className="px-3 py-2.5" style={{ background:B.surface2 }}><div className="font-semibold mb-0.5" style={{ color:B.textMuted }}>Recommended</div><div className="text-sm font-bold text-white">${Math.round((avgMult?recBaseInv*avgMult:recBaseInv)/100)*100}</div><div style={{ color:B.textDim }}>{isRetainer?"/mo":"total"}</div></div>
                      <div className="px-3 py-2.5" style={{ background:B.gold+"0D", borderLeft:`1px solid ${B.gold}33` }}><div className="font-semibold mb-0.5" style={{ color:B.gold }}>Yours</div><div className="text-sm font-bold" style={{ color:B.gold }}>${Math.round(afterMult/100)*100}</div><div style={{ color:B.textDim }}>{isRetainer?"/mo":"total"} ({(()=>{const r=Math.round((avgMult?recBaseInv*avgMult:recBaseInv)/100)*100,c=Math.round(afterMult/100)*100,d=c-r;return d===0?"no change":d>0?`+$${d.toLocaleString()}`:`-$${Math.abs(d).toLocaleString()}`;})()})</div></div>
                    </div>
                  </div>
                )}

                <div className="mb-4"><div className="text-xs uppercase tracking-widest mb-2" style={{ color:B.textDim }}>Internal Resourcing</div>
                  <div className="space-y-2">
                    {[{role:"Builder",color:ROLE_COLORS.Builder,sub:`${numBuilders} builder${numBuilders>1?"s":""} · Pred(${predScore||"–"})+DV(${dvScore||"–"})`,hrs:builderHrs,rate:builderRate,show:true},{role:"Connector",color:ROLE_COLORS.Connector,sub:`Pres(${scores.presence||"–"})/Clar(${scores.clarity||"–"})→${connScore||"–"}`,hrs:connectorHrs,rate:RATES.connector,show:connectorHrs>0},{role:"Amplifier",color:ROLE_COLORS.Amplifier,sub:`Strat(${scores.strategicGuidance||"–"})/Champ(${scores.championing||"–"})→${ampScore||"–"}`,hrs:amplifierHrs,rate:RATES.amplifier,show:amplifierHrs>0}].filter(r=>r.show).map(r=>(
                      <div key={r.role} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background:B.surface2 }}><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor:r.color }}></div><div><div className="text-xs font-medium text-white">{r.role}</div><div className="text-xs" style={{ color:B.textDim }}>{r.sub}</div></div></div><div className="text-right"><div className="text-xs font-bold text-white">{r.hrs} hrs</div><div className="text-xs" style={{ color:B.textDim }}>${r.rate}/hr · {isProject?"total":"/mo"}</div></div></div>
                    ))}
                    <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background:B.border2 }}><div className="text-xs font-semibold text-white">Total Hours</div><div className="text-right"><div className="text-xs font-black text-white">{totalHrs} hrs {isProject?"total":"/mo"}</div><div className="text-xs" style={{ color:B.textMuted }}>Blended: ${blendedRate}/hr</div></div></div>
                  </div>
                </div>

                <div className="mb-4 rounded-lg p-3 space-y-1" style={{ background:B.surface2 }}>
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color:B.textDim }}>Price Build-Up</div>
                  <div className="flex justify-between text-xs"><span style={{ color:B.textMuted }}>Base (hours × rates)</span><span className="text-white">${baseInv.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span style={{ color:B.textMuted }}>Pillar multiplier ({avgMult?.toFixed(3)}x)</span><span className="text-white">${Math.round(afterMult).toLocaleString()}{isRetainer?"/mo":""}</span></div>
                  {isExecution && <div className="flex justify-between text-xs"><span style={{ color:B.textMuted }}>Risk buffer (+{RISK_BUFFERS[riskBuffer]*100}%)</span><span className="text-white">${Math.round(afterRisk).toLocaleString()}</span></div>}
                  {(pctDiscTotal>0||freeMonths>0) && <div className="pt-1 mt-1 space-y-1" style={{ borderTop:`1px solid ${B.border2}` }}>
                    {commitDiscPct>0 && <div className="flex justify-between text-xs"><span className="text-green-400">Commit ({commitTerm})</span><span className="text-green-400">−{(commitDiscPct*100).toFixed(0)}%</span></div>}
                    {freeMonths>0 && <div className="flex justify-between text-xs"><span className="text-green-400">{freeMonths} free mo (pay {paidMonths} get {termMonths})</span><span className="text-green-400">−${Math.round(freeMonthValue).toLocaleString()}</span></div>}
                    {newClientDisc>0 && <div className="flex justify-between text-xs"><span className="text-green-400">New client</span><span className="text-green-400">−{(newClientDisc*100).toFixed(0)}%</span></div>}
                    {volDisc>0 && <div className="flex justify-between text-xs"><span className="text-green-400">Volume</span><span className="text-green-400">−{(volDisc*100).toFixed(0)}%</span></div>}
                    {manualDisc>0 && <div className="flex justify-between text-xs"><span className="text-green-400">Manual</span><span className="text-green-400">−{(manualDisc*100).toFixed(0)}%</span></div>}
                  </div>}
                  {isRetainer&&commitTerm!=="none" && <div className="pt-2 mt-1 space-y-1" style={{ borderTop:`1px solid ${B.border2}` }}>
                    <div className="flex justify-between text-xs"><span style={{ color:B.textMuted }}>Monthly</span><span className="text-white">${finalMonthly.toLocaleString()}/mo</span></div>
                    <div className="flex justify-between text-xs"><span style={{ color:B.textMuted }}>{commitTerm} ({paidMonths} paid{freeMonths>0?` + ${freeMonths} free`:""})</span><span className="text-white">${finalTermTotal?.toLocaleString()}</span></div>
                    <div className="flex justify-between text-xs font-bold"><span className="text-white">Hours ({commitTerm})</span><span className="text-white">{termHrsDelivered.toLocaleString()} hrs</span></div>
                  </div>}
                  <div className="flex justify-between text-xs font-bold pt-2 mt-1 rounded px-2 py-1" style={{ borderTop:`1px solid ${B.border2}`, background:needsApproval?B.orange+"22":B.border2, color:needsApproval?B.orange:B.gold }}><span>Effective rate{isRetainer&&commitTerm!=="none"?` (${commitTerm})`:""}</span><span>${effectiveBlendedRate}/hr{needsApproval?" ⚠":""}</span></div>
                </div>

                <div className="rounded-xl p-4 mb-4" style={{ border:`1px solid ${needsApproval?B.orange+"88":B.gold+"88"}`, background:needsApproval?B.orange+"0F":B.gold+"0A" }}>
                  {needsApproval && <div className="text-xs font-bold mb-2" style={{ color:B.orange }}>⚠ Manager Approval Required</div>}
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color:needsApproval?B.orange:B.gold, opacity:0.7 }}>{isProject?"Total Investment (Client-Facing)":"Monthly Investment (Client-Facing)"}</div>
                  <div className="text-4xl font-black" style={{ color:needsApproval?B.orange:B.gold }}>${finalMonthly.toLocaleString()}{isRetainer&&commitTerm!=="none"?<span className="text-lg">/mo</span>:""}</div>
                  {isRetainer&&commitTerm!=="none" && <div className="text-sm mt-1 font-semibold" style={{ color:B.gold }}>Pay {paidMonths}{freeMonths>0?`, get ${freeMonths} free`:""} · ${finalTermTotal?.toLocaleString()} total</div>}
                  <div className="text-xs mt-2 italic" style={{ color:B.textDim }}>Hours never shown to client</div>
                </div>
                <button onClick={reset} className="w-full py-2 rounded-lg text-xs transition-all" style={{ color:B.textDim, border:`1px solid ${B.border2}`, background:"transparent" }}>Reset Calculator</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TIER COMPARISON — side-by-side view of all three engagement tiers */}
      {isRetainer && allScored && hasEngagement && (
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="rounded-xl p-5" style={{ background:B.surface, border:`1px solid ${B.border2}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color:B.gold, fontSize:"18px" }}>◆</span>
              <h2 className="font-semibold text-white">Compare {isOp?"Operational":"Strategic"} Tiers</h2>
            </div>
            <p className="text-xs mb-5" style={{ color:B.textDim }}>
              Recommended tier highlighted in gold (matches your engagement above). Other tiers show reference pricing for trading down or up. All prices include the pillar multiplier ({avgMult?.toFixed(2)}x) and any active discounts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(isOp ? OP_TIERS : ST_TIERS).map(tier => {
                const data = computeTierScenario(tier.id, engType);
                if (!data) return null;
                const isRec = recTier?.id === tier.id;
                return (
                  <div key={tier.id} className="rounded-xl overflow-hidden relative flex flex-col"
                    style={{
                      border: `2px solid ${isRec ? B.gold : B.border2}`,
                      background: isRec ? B.gold+"08" : B.surface2,
                      boxShadow: isRec ? `0 8px 24px -8px ${B.gold}55` : "none",
                      transform: isRec ? "translateY(-2px)" : "none",
                      transition: "all 0.2s",
                    }}>
                    {isRec && (
                      <div className="py-1.5 text-center text-xs font-bold tracking-widest"
                        style={{ background:B.gold, color:"#000" }}>
                        RECOMMENDED FIT
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="text-xl font-black tracking-tight mb-1" style={{ color: tier.color }}>
                        {tier.label}
                      </div>
                      <div className="text-xs mb-4 leading-relaxed" style={{ color:B.textMuted, minHeight:"32px" }}>
                        {tier.desc}
                      </div>
                      <div className="text-3xl font-black" style={{ color: isRec ? B.gold : "#FFF" }}>
                        ${data.finalRounded.toLocaleString()}
                      </div>
                      <div className="text-xs mb-1" style={{ color:B.textDim }}>
                        per month · {data.totalHrs} hrs total
                      </div>
                      {data.discountPct > 0 && (
                        <div className="text-xs mb-2 font-semibold" style={{ color: "#4ADE80" }}>
                          −{(data.discountPct*100).toFixed(0)}% discount applied
                        </div>
                      )}
                      <div className="pt-3 space-y-1.5 mt-auto" style={{ borderTop:`1px solid ${B.border}` }}>
                        <div className="flex items-center justify-between text-xs" style={{ opacity: data.bHrs > 0 ? 1 : 0.3 }}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background:ROLE_COLORS.Builder }}></div>
                            <span style={{ color:"#CCC" }}>
                              Builder{data.builders > 1 ? ` ×${data.builders}` : ""}
                            </span>
                          </div>
                          <span className="font-bold text-white">{data.bHrs}h</span>
                        </div>
                        <div className="flex items-center justify-between text-xs" style={{ opacity: data.includeConn ? 1 : 0.3 }}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background:ROLE_COLORS.Connector }}></div>
                            <span style={{ color:"#CCC" }}>Connector</span>
                          </div>
                          <span className="font-bold text-white">{data.includeConn ? `${data.cHrs}h` : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs" style={{ opacity: data.includeAmp ? 1 : 0.3 }}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background:ROLE_COLORS.Amplifier }}></div>
                            <span style={{ color:"#CCC" }}>Amplifier</span>
                          </div>
                          <span className="font-bold text-white">{data.includeAmp ? `${data.aHrs}h` : "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-lg text-xs italic" style={{ background:B.surface2, color:B.textDim, border:`1px solid ${B.border}` }}>
              {isOp ? (
                <>Operational tiers differ by role mix — Execute is Builder-only, Elevate adds proactive delivery presence with a Connector, Excel scales to multiple Builders for max throughput.</>
              ) : (
                <>Strategic tiers map to engagement intensity — Drive at baseline depth, Amplify with deeper presence and guidance, Excel at maximum partnership across all three roles.</>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
