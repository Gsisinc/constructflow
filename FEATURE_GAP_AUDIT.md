# Feature Audit vs. Requirements

This document tracks ConstructFlow features against the full product list (Internal Users, Estimating & Proposals, Project Management, Financial Management, Compliance, Support).

## Summary

| Status       | Count |
|-------------|--------|
| Implemented | 15    |
| Partial     | 18    |
| Missing     | 12    |

## By Category

### Internal Users
| Feature | Status | Notes |
|---------|--------|--------|
| Internal Users (employees with access) | Implemented | TeamManagement, Directory, JoinRequest, UserApprovals |

### Estimating & Proposals
| Feature | Status | Notes |
|---------|--------|--------|
| Estimating and Proposals | Implemented | Estimates, BidOpportunityDetail, EstimateEditor, AddBid |
| Estimating AI Assistant | Implemented | EstimateGenerator |
| Cost Library | Implemented | CostLibrary page (Assembly Library + Unit Costs) |
| Send Text Messages | Implemented | TextMessages page (SMS integration hook) |
| E-signature Collection | Implemented | ESignatures page (DocuSign / status) |

### Project Management
| Feature | Status | Notes |
|---------|--------|--------|
| Client Portal | Implemented | ClientPortal, clientPortal/* |
| Daily Logs | Implemented | DailyLog |
| Schedules | Implemented | Calendar, GanttChart, ProjectCalendar |
| Scheduling AI Assistant | Partial | agentWorkflows schedule/risk; dedicated Scheduling AI in AI Agents |
| Task Management | Implemented | Tasks, TaskTracker |
| Change Order Management | Implemented | ChangeOrderManager, PhaseBudgetManager |
| Subcontractor Portal | Implemented | SubcontractorPortal page + SubcontractorCoordination |
| Share Schedules in Client Portal | Implemented | ClientPortal Calendar tab |
| Custom User Permissions | Implemented | RolePermissions, permissions.js, TeamRoleManager |

### Financial Management
| Feature | Status | Notes |
|---------|--------|--------|
| Invoicing | Implemented | Invoices page |
| Online Bill Payment | Partial | Placeholder/link from Invoices; payment gateway TBD |
| Expense Management | Implemented | Invoices, PhaseBudgetManager, Expense entity |
| Banking with APY | Missing | No banking product in app |
| QuickBooks Online Sync | Partial | QuickBooksService, accountingSync, Phase3/5 |
| Job Costing (Estimate vs Actuals & WIP) | Partial | accountingSync; dedicated report TBD |
| AIA Billing (G702/G703 Pay Apps) | Implemented | AIABilling page |
| Bill Approval Workflows | Implemented | BillApprovals page |
| Cost Plus Invoicing | Partial | Invoices; cost-plus line items TBD |

### Compliance
| Feature | Status | Notes |
|---------|--------|--------|
| Send Lien Waivers | Implemented | LienWaivers page |
| Collect Lien Waivers | Implemented | LienWaivers page |
| Document Tracking (Insurance, W9s, Licenses) | Implemented | DocumentTracking page |
| Sub-tier Lien Waivers | Implemented | LienWaivers (sub-tier section) |
| Custom Lien Waiver Templates | Implemented | LienWaivers Templates tab |

### Support
| Feature | Status | Notes |
|---------|--------|--------|
| Support Channels | Implemented | SupportChannels page |
| Onboarding | Implemented | Onboarding |
| Implementation | Implemented | Implementation page |
| Ongoing Training | Implemented | OngoingTraining page |

---

*Last updated from feature-list audit. New pages added to close gaps: CostLibrary, LienWaivers, DocumentTracking, AIABilling, BillApprovals, SupportChannels, Implementation, OngoingTraining, TextMessages, ESignatures, SubcontractorPortal.*
