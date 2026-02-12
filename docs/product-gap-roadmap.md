# ConstructionFlow Competitive Gap List and 10/10 Roadmap

This is the clear list of major product gaps versus top construction platforms (Procore, Autodesk Construction Cloud, Buildertrend, Fieldwire, PlanGrid legacy workflows), plus implementation status.

## 1) Core Gaps (Current)

| Area | Gap vs Market Leaders | Status |
|---|---|---|
| Multi-company tenancy | Deep org-level controls, data partitioning, per-company templates | Partial |
| RBAC/permissions | Fine-grained roles per module/action | Partial |
| Audit trail | Immutable system logs for every critical action | Missing |
| Workflow automation | Approvals, triggers, conditional workflows | Missing |
| Procurement/subcontracts | Full vendor bid leveling, buyout, POs, change orders | Partial |
| Document control | Versioning, transmittals, markup comparisons | Partial |
| Drawing management | CAD-level sheets, revision overlays, issue pins | Partial |
| Field collaboration | Mobile-first offline workflows and punch sync | Partial |
| Cost management | Forecasting, earned value, cost-to-complete | Partial |
| Scheduling | Baseline vs actual, critical path, delay impact | Partial |
| Integrations | Accounting (QuickBooks/Sage/NetSuite), BIM, calendars | Partial |
| Reporting | Portfolio dashboards + export templates | Partial |
| Security/compliance | SSO, audit exports, data retention policies | Partial |
| AI governance | Prompt logs, model policy, confidence traceability | Partial |

## 2) What Was Implemented In This Iteration

### Drawing Designer Maturity Upgrade
- Added a **visual designer workflow** in Bid Detail with symbol placement and annotation.
- Added **undo/redo history**, **snap-to-grid**, and **symbol count summary** to improve takeoff/design reliability.
- Added export to **PNG/PDF** and layout save to bid record.

These close part of the "Drawing management" gap.


### Phase 1 implementation status (in-app)
- ✅ Role & Permissions matrix page (`RolePermissions`) with module/action toggles and saved policy records.
- ✅ Audit Trail page (`AuditTrail`) that reads governance events from `AuditLog`.
- ✅ Documents page upgraded with version history, new-version upload, and side-by-side metadata compare.
- ✅ Audit events written on document create/delete/version upload and permission updates.

### Phase 2 implementation status (in-app)
- ✅ Phase 2 Operations Center (`Phase2Operations`) with three live tabs:
  1. Subcontractor bid leveling table and weighted ranking.
  2. Vendor scorecards from PO/invoice performance.
  3. Cost-to-complete forecast dashboard by project.
- ✅ Change order lifecycle actions (approve/reject) with audit log writes on status transitions.

### Phase 3 implementation status (in-app)
- ✅ Phase 3 Enterprise Hub (`Phase3Operations`) with:
  1. Integration marketplace controls (accounting, calendar, collaboration providers).
  2. SSO/compliance policy controls (SSO, MFA, SCIM, session timeout, retention).
  3. Portfolio BI summary cards with exportable CSV reporting.
- ✅ Audit events written for integration and compliance policy updates.


### Phase 4 implementation status (in-app)
- ✅ Phase 4 AI Governance + Automation hub (`Phase4AIAutomation`) with:
  1. AI governance policy controls (citations, confidence threshold, PII redaction, retention).
  2. Model routing policy controls (cost-sensitive, standard, high reasoning, compliance review models).
  3. Prompt traceability table with confidence badges and token estimates from `AgentMessage` history.
  4. Automation Studio rule preview for risk-threshold and bid-deadline triggers.
- ✅ Audit events written for policy/rule changes (`phase4_ai_policy_updated`, `phase4_automation_rules_updated`).


### Phase 5 implementation status (in-app)
- ✅ Phase 5 Platform & Scale Hub (`Phase5PlatformScale`) with:
  1. Integration Marketplace+ controls (accounting/construction/collaboration providers + webhook toggles).
  2. Tenant Admin Console (seat/storage/token limits, region, retention, data residency policy).
  3. Executive Command Center (portfolio KPI cards + revenue forecast by project start month).
- ✅ Audit events written for integration marketplace and tenant policy updates (`phase5_integrations_marketplace_updated`, `phase5_tenant_policy_updated`).


### Phase 6 implementation status (in-app)
- ✅ Phase 6 Reliability & Customer Ops hub (`Phase6ReliabilityOps`) with:
  1. Incident + SLA reliability console (auto-escalation policy + breach-rate visibility).
  2. Release quality gate metrics (deployment success rate + change-failure rate).
  3. Support runbooks and backup-drill log view for disaster-recovery readiness.
- ✅ Audit events written for reliability policy updates (`phase6_reliability_policy_updated`).


### Enterprise hardening upgrade (current iteration)
- ✅ Integration depth upgraded with sync-direction controls (ingest/push/bi-directional) in Phase 5 marketplace.
- ✅ Security/compliance upgraded with hash-chain audit verification and immutable-style CSV/JSONL export in Audit Trail.
- ✅ Multi-tenant hardening upgraded with tenant scope helpers and org-scoped automation preview/writes in Phase 4 rules.
- ✅ Advanced ticketing + client portal requests upgraded with SLA-tagged service desk queue and stakeholder ticket visibility.

## 3) Remaining Work to Reach 10/10

A realistic 10/10 requires multiple releases, not a single patch.

### Phase A (2-4 weeks)
1. RBAC permissions matrix + guards on every write endpoint.
2. Full audit log service (who/what/when before/after values).
3. Document version history + side-by-side compare.

### Phase B (4-8 weeks)
1. Subcontractor bid leveling + vendor scorecards.
2. Change order lifecycle with approvals.
3. Forecasting / cost-to-complete dashboard.

### Phase C (6-10 weeks)
1. Enterprise integrations (accounting + calendar + storage).
2. SSO + advanced compliance controls.
3. Portfolio BI/reporting engine.

## 4) Score Projection

- Current: ~6.8/10
- After Phase A: ~7.8/10
- After Phase B: ~8.8/10
- After Phase C: ~9.5-10/10

