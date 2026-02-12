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
| Integrations | Accounting (QuickBooks/Sage/NetSuite), BIM, calendars | Missing |
| Reporting | Portfolio dashboards + export templates | Partial |
| Security/compliance | SSO, audit exports, data retention policies | Missing |
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

