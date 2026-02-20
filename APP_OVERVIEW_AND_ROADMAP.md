# ConstructFlow – App Overview & Roadmap to 10/10

## What This App Is

**ConstructFlow** is an **AI-powered construction management platform** aimed at contractors (with a tilt toward low-voltage / electrical / MEP). It runs as a React (Vite) front end with:

- **Base44** as the primary backend (auth, entities, integrations, functions), with optional **Supabase** or **self-hosted (VPS)** migration paths.
- **50+ pages** covering: home/landing, bids, bid discovery, estimates, projects, documents, calendar, team, safety, procurement, POs, invoices, daily logs, submittals, AI agents, phases (2–6), and more.

Positioning: “From Bid to Built” — discover opportunities → analyze documents → estimate → win work → manage projects, budget, and delivery.

---

## What Works Today

### ✅ Solid and usable

| Area | What works |
|------|------------|
| **Auth & shell** | Base44 auth (login, org), layout, nav, theme. Home/landing with sign-in and “Get Started.” |
| **Bids (pipeline)** | Full CRUD on bids via `base44.entities.BidOpportunity`: list, filter by status, create, update, delete. Bids page is a real pipeline. |
| **Projects** | Projects list and create via `base44.entities.Project`, filtered by org. Project detail, phases, budget components exist. |
| **Documents** | Project-scoped documents: create, list, update, delete, versioning via `Document` / `DocumentVersion`. |
| **Estimates** | Estimates page lists `BidOpportunity` and `BidEstimate`; bid detail has estimate editing (`EstimateEditor` with line items, qty, unit cost, labor). |
| **Purchase orders** | PO list, create, update, delete via `base44.entities.PurchaseOrder`; link to projects; PDF export. |
| **Bid discovery (real data)** | SAM.gov + county scrapers via `realBidDiscoveryService`; `fetchDiscoveryFromSources` in BidDiscovery with filters (state, work type, etc.). Returns real opportunities when APIs/keys are set. |
| **Bid document analysis** | `bidDocumentAnalysisService`: PDF/text extraction, scope/requirements/pricing extraction using OpenAI (VISION_GPT, etc.). Uses `VITE_OPENAI_API_KEY`. |
| **Drawing / takeoff (AI-assisted)** | Drawing analysis: upload plans → LLM (Base44 InvokeLLM or similar) with structured prompt → extract measurements and takeoff-style items (conduit ft, cable ft, devices, fixtures). Shown in BidDetail/BidOpportunityDetail (Drawing Analysis tab) and BidIntelligence. Not full auto-takeoff like Beam, but useful. |
| **AI estimate generator** | EstimateGenerator page: scope of work + optional file → Claude API → itemized estimate (labor, materials, contingency). Blocked by wrong env var: uses `REACT_APP_CLAUDE_API_KEY` (doesn’t work in Vite). |
| **Alerts** | Alert thresholds and alerts CRUD via Base44 entities. |
| **Other entities** | Invoices, Materials, TimeCards, Tasks, Calendar, Team, Safety, Daily Log, Submittals, etc. use Base44 (or local state) and render; many are functional for basic use. |

### ⚠️ Partially working or fragile

| Area | Issue |
|------|--------|
| **AI Agents** | 10 workflow agents are defined and `callAgent`/`streamAgent` exist, but: (1) AI Agents page “Use Agent” doesn’t open a chat; (2) only chat (Market Intelligence in BidDiscovery) uses a short prompt + Base44 InvokeLLM, not workflow prompts; (3) Claude key in `llmService` uses `REACT_APP_*` so it’s undefined in Vite. See `AGENT_FULL_FUNCTIONALITY_PLAN.md`. |
| **Estimate generator** | Same env issue: `REACT_APP_CLAUDE_API_KEY` → should be `VITE_CLAUDE_API_KEY` (or both). |
| **Live discovery from chat** | `shouldInvokeLiveDiscovery` exists but isn’t wired in the Market Intelligence chat, so “Find bids in California” in chat doesn’t trigger discovery. |
| **County / SAM.gov** | Real services exist; behavior depends on `VITE_SAM_GOV_API_KEY` and county scraper availability. |

---

## What Doesn’t Work or Is Missing (vs “10/10”)

### 1. AI agents not fully functional

- No chat from the AI Agents hub for the 10 custom agents.
- AgentChat doesn’t use `buildAgentSystemPrompt` + `callAgent`.
- Claude (and possibly other LLM) keys not read correctly in Vite.
- Live discovery not triggered from Market Intelligence chat.

**Fix:** Follow `AGENT_FULL_FUNCTIONALITY_PLAN.md` (Phases 1–4).

### 2. No true automated takeoff (Beam-level)

- **Beam:** Scans 2D PDFs, outputs material quantities automatically, multi-trade, QA in 24–72h, addendum handling.
- **ConstructFlow:** Drawing analysis is “upload → LLM describes/estimates quantities” (conduit, cable, devices, fixtures). No scale-aware measurement from PDFs, no trade-specific takeoff engine, no formal addendum detection.

**Gap:** To rival Beam you need:
- PDF/DPI-aware takeoff (measure from drawings) or a dedicated takeoff/vision pipeline.
- Multi-trade takeoff (electrical, low voltage, HVAC, etc.) with clear output schema.
- Optional: addendum detection and quantity delta handling.

### 3. Procurement not at “Procure” level

- **Procure-style:** BOQ management, RFQ/eAuctions, approval workflows, spend visibility, vendor portal, compliance tracking, subcontractor DB.
- **ConstructFlow:** POs, materials, some vendor UIs exist but no full BOQ/RFQ/eAuction, no approval routing engine, no vendor portal, no spend analytics dashboard.

**Gap:** To compete with Procure you need:
- BOQ (bill of quantities) tied to bids/projects and to POs.
- RFQ workflow (create RFQ, send to vendors, collect bids, score).
- Approval workflows (by project, amount, role).
- Spend views: committed vs invoiced vs actual by project/org.
- Vendor portal (or secure link) for tenders and PO visibility.

### 4. Estimating UX and depth

- Estimate generator is one-shot (scope → one estimate). No multi-version, no bid-line to estimate-line traceability, no labor/material libraries.
- Estimate editor has line items but no assembly/template library, no direct link from takeoff quantities to estimate lines (could be added from drawing analysis).

**Gap:** Versioned estimates, templates, and “takeoff → estimate line” flow would make it much stronger.

### 5. Integrations and reliability

- QuickBooks, Zapier, email, accounting sync exist in code; robustness and configuration UX are unknown.
- Base44 is the default; Supabase/VPS paths exist but need validation and docs.

### 6. Mobile and performance

- There is a BidDiscovery-Mobile page; the rest is desktop-first. No dedicated mobile takeoff or field data capture app.

---

## Competitor Snapshot: Beam Takeoff vs Procure vs ConstructFlow

| Dimension | Beam Takeoff | Procure-style | ConstructFlow today |
|-----------|----------------|---------------|----------------------|
| **Takeoff** | Automated from PDFs, multi-trade, QA’d | — | AI-assisted from drawings (LLM); not scale-accurate takeoff |
| **Bid discovery** | Bid dashboard | — | ✅ SAM.gov + county, filters, pipeline |
| **Bid/doc analysis** | BeamGPT on plans | — | ✅ PDF + drawing analysis (OpenAI/LLM) |
| **Estimating** | Quantities → estimate | — | ✅ Line-item estimates; AI generator (key fix needed) |
| **Procurement** | — | BOQ, RFQ, eAuction, approvals, spend, vendor portal | POs, materials; no BOQ/RFQ/approvals/vendor portal |
| **Project management** | — | — | ✅ Projects, docs, tasks, calendar, team |
| **AI agents** | In-product AI for plans | — | Designed but not wired (see plan) |

So: ConstructFlow is strong on **bid discovery + doc analysis + project/estimate/PO**, weak on **automated takeoff** (Beam) and **full procurement** (Procure). The AI agent layer is designed but not yet fully working.

---

## What You Need to Do to Get to 10/10 and Beat Beam / Procure

### Tier 1 – Must-do (foundation and differentiators)

1. **Fix AI agents (full functionality)**  
   Implement `AGENT_FULL_FUNCTIONALITY_PLAN.md`:  
   - Vite env for Claude (`VITE_CLAUDE_API_KEY`).  
   - AgentChat uses `buildAgentSystemPrompt` + `callAgent`.  
   - AI Agents page: “Use Agent” opens chat for each of the 10 agents.  
   - Market Intelligence chat triggers live discovery when the user asks for opportunities.

2. **Fix env vars everywhere**  
   Replace `process.env.REACT_APP_*` with `import.meta.env.VITE_*` (or support both) in:  
   - `llmService.js`  
   - `EstimateGenerator.jsx`  
   - Any other feature that needs API keys in the browser.

3. **One clear “hero” differentiator**  
   Choose and nail one of:  
   - **Option A – Takeoff:** Add a real takeoff pipeline (PDF → scale detection → quantity extraction, or partner with a takeoff API) so you can say “AI takeoff + bid + estimate in one place.”  
   - **Option B – Procurement:** Add BOQ + RFQ + approval workflows + spend dashboard so you can say “bid-to-PO-to-pay in one place.”  
   - **Option C – Intelligence:** Make the 10 agents and bid discovery so good (e.g. “find me bids that match my capacity and paste them into my pipeline”) that “AI-first bidding” is the differentiator.

### Tier 2 – Should-do (parity and trust)

4. **Estimate generator and estimates**  
   - Fix Estimate Generator (env + optional streaming).  
   - Add estimate versions and link estimate lines to bid/takeoff where possible.

5. **Drawing analysis → estimate**  
   - One-click “Apply to estimate” from drawing takeoff totals to bid estimate line items (you have part of this; make it default path and visible).

6. **Procurement depth (if not the hero)**  
   - BOQ per bid/project.  
   - Simple RFQ flow (send to N vendors, collect bids, compare).  
   - Approval rules (e.g. by amount, project, role).

7. **Takeoff depth (if not the hero)**  
   - At least: clear takeoff output (e.g. CSV/export), multi-page PDF support, and “re-run when plans change” or addendum note.

8. **Reliability and observability**  
   - Error boundaries, user-facing error messages, and optional “status” (e.g. LLM key configured, SAM.gov key configured).  
   - Basic logging or health checks for critical paths (auth, discovery, LLM).

### Tier 3 – Nice-to-have (scale and polish)

9. **Integrations**  
   - Document and test QuickBooks, Zapier, email; add Procore or Aconex if targeting those users.

10. **Vendor portal / client portal**  
    - Client portal exists; extend or add a vendor portal (view POs, confirm delivery, submit docs).

11. **Mobile**  
    - Improve mobile BidDiscovery and add “field capture” (photos, daily log, issues) so superintendents use the app on site.

12. **Beam-style takeoff (if you go all-in)**  
    - Scale-aware measurement, multi-trade output, addendum handling, QA step; likely requires dedicated takeoff engine or vendor.

---

## Suggested order of execution

1. **Week 1–2:** Env fixes (Vite keys) + AI agents Phases 1–2–3 (and Phase 4 if quick). Document “how to set up keys” in README.
2. **Week 2–3:** Estimate Generator fix + “Apply drawing to estimate” as the default path; optional estimate versions.
3. **Month 2:** Choose hero (Takeoff vs Procurement vs Intelligence) and ship the Tier 1 item for that (e.g. BOQ + RFQ, or takeoff pipeline, or agent + discovery polish).
4. **Month 3+:** Tier 2 (parity and trust), then Tier 3 (integrations, vendor portal, mobile).

This gets you to a clear “10/10” story: one area where you’re better than or comparable to Beam/Procure, with the rest solid and the AI layer actually working end to end.
