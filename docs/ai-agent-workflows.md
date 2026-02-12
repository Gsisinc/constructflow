# AI Agent Workflow Specs

This document defines what each agent is supposed to do, how it does it, required inputs, expected outputs, and example prompt/output pairs.

## 1) Central Orchestrator
- **Purpose:** Coordinate specialist agents into a single delivery plan.
- **Inputs:** Project goal, deadline, blockers, resource constraints.
- **Workflow:** classify request → assign specialist agents → sequence actions/dependencies → track risks/escalations.
- **Outputs:** execution plan, risk register, escalation/decision brief.
- **Typical Prompt:** "Coordinate a 3-week plan to submit a school retrofit bid while current projects remain on schedule."
- **Example Output:** "Execution plan created: (1) Market Intelligence by Friday, (2) Bid Package Assembly by Monday, (3) Proposal Generation by Wednesday..."

## 2) Market Intelligence
- **Purpose:** Discover and qualify live bid opportunities.
- **Inputs:** work type, geography, timeline window, value criteria.
- **Workflow:** parse intent → invoke live scraper/functions → rank opportunities → provide shortlist with next actions.
- **Outputs:** opportunity shortlist, qualification notes, action recommendations.
- **Typical Prompt:** "Find public low-voltage bids in California due in the next 14 days and rank top 10 by fit."
- **Example Output:** "Found 14 live opportunities... top picks: LA County courthouse, San Diego school modernization..."

## 3) Bid Package Assembly
- **Purpose:** Convert RFP/RFQ information into a complete submission package.
- **Inputs:** RFP text/docs, scope, exclusions, compliance requirements.
- **Workflow:** extract requirements → build checklist → organize pricing assumptions → identify missing artifacts.
- **Outputs:** bid checklist, pricing assumptions sheet, readiness report.
- **Typical Prompt:** "Turn this 60-page RFP into a checklist with required forms and insurance limits."
- **Example Output:** "Created 42-item checklist, flagged missing bond letter and affidavit..."

## 4) Proposal Generation
- **Purpose:** Produce client-tailored proposal content.
- **Inputs:** client profile, scope summary, differentiators, output format.
- **Workflow:** identify client priorities → draft proposal sections → tailor language by audience → generate revision checklist.
- **Outputs:** proposal draft, executive summary, revision checklist.
- **Typical Prompt:** "Create a persuasive proposal for a municipal CCTV modernization project."
- **Example Output:** "Generated executive summary, technical approach, schedule, and value section..."

## 5) Regulatory Intelligence
- **Purpose:** Map permit/compliance obligations into actionable steps.
- **Inputs:** project location, scope, governing codes/agencies, permit status.
- **Workflow:** identify authority path → map obligations → build timeline → flag compliance risks.
- **Outputs:** permit roadmap, compliance checklist, risk mitigation steps.
- **Typical Prompt:** "List expected permits and inspection checkpoints for a CA school low-voltage upgrade."
- **Example Output:** "Generated permit roadmap with AHJ checkpoints and submittal milestones..."

## 6) Risk Prediction
- **Purpose:** Predict schedule and cost risks with mitigation.
- **Inputs:** baseline schedule, budget, resource constraints, dependencies.
- **Workflow:** identify risk drivers → estimate impact/probability → propose mitigations → define monitoring KPIs.
- **Outputs:** risk matrix, mitigation plan, early warning indicators.
- **Typical Prompt:** "Assess risk for a 12-week deployment with one lead estimator and three parallel deadlines."
- **Example Output:** "Top risks: estimator bottleneck (High), procurement lead-time (Medium-High)..."

## 7) Quality Assurance
- **Purpose:** Prevent defects and support QA/QC execution.
- **Inputs:** deliverables, inspection criteria, historical defects, closeout requirements.
- **Workflow:** define checkpoints → set acceptance criteria → forecast defects → prepare punch-list prevention actions.
- **Outputs:** QA/QC plan, inspection checklist, punch-list prevention guidance.
- **Typical Prompt:** "Build a QA checklist for low-voltage installation, testing, and labeling."
- **Example Output:** "Created phase-based QA checklist for pre-wire, post-termination, commissioning..."

## 8) Safety Compliance
- **Purpose:** Build task-level hazard controls and compliance plans.
- **Inputs:** site conditions, activity list, crew profile, safety standards.
- **Workflow:** identify hazards → define controls → map training requirements → prepare incident response checklist.
- **Outputs:** JHA, control matrix, training/incident checklist.
- **Typical Prompt:** "Create a safety plan for night-shift conduit work in an occupied hospital."
- **Example Output:** "Produced hazard matrix for low light and occupied corridors, plus escalation flow..."

## 9) Sustainability Optimization
- **Purpose:** Improve sustainability outcomes with practical tradeoffs.
- **Inputs:** material options, certification target, budget constraints, performance goals.
- **Workflow:** estimate baseline impact → recommend substitutions → map certification implications → prioritize actions.
- **Outputs:** sustainability action plan, substitution options, certification notes.
- **Typical Prompt:** "Recommend lower-carbon alternatives for conduit and fixture package while preserving budget."
- **Example Output:** "Suggested three substitutions with cost/impact tradeoffs and likely LEED contribution..."

## 10) Stakeholder Communication
- **Purpose:** Produce audience-specific project communications.
- **Inputs:** audience, current status, objective, tone/format constraints.
- **Workflow:** identify audience context → draft message → adjust technical depth → define follow-up cadence.
- **Outputs:** message drafts, meeting scripts, escalation templates.
- **Typical Prompt:** "Draft updates for owner (exec), PM (technical), and installers (field briefing)."
- **Example Output:** "Created three tailored updates with unified facts and distinct calls-to-action..."

## Runtime Enforcement Notes
- Only **Market Intelligence** has live bid-discovery enabled.
- All non-discovery agents are constrained with guardrails to avoid fabricated scraping claims.
- Agent system prompts are generated from the structured workflow spec in `src/config/agentWorkflows.js`.
