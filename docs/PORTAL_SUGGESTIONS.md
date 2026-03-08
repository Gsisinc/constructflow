# Portal enhancement suggestions

## Technician portal (make it best-in-class)

- **AI agents for service areas**  
  Create org-specific or trade-specific AI agents (e.g. fire alarm, CCTV, access control) that technicians can use onsite: “How do I wire this panel?”, “What’s the code requirement for …?” Use Claude API with a system prompt scoped to that trade and your org’s procedures.

- **Offline-first**  
  Let techs view assigned tasks, time cards, and key docs when offline; sync when back online.

- **Photo + notes on tasks**  
  Allow techs to attach photos and short notes when completing or updating a task (already partly there; extend to all task actions).

- **One-tap clock in/out** with optional job or project code so time cards stay accurate.

- **Push/notifications**  
  Notify techs of new assignments, schedule changes, or messages from the office.

- **Pay stub & time off**  
  Pay Stub and Request Time Off pages are in place; connect them to your payroll/time-off backend so stubs and requests are real.

- **Skills & certifications**  
  Surface expiring certs and suggested training on the Tech Home so techs and admins can stay on top of compliance.

- **Directory**  
  Tech-specific directory (peers, supervisors, office) so they can call or message without seeing full org admin data.

---

## Client / stakeholder portal

- **Project dashboard**  
  Single view: active projects, status, next milestones, and key documents. No bids or internal tools.

- **Approvals & sign-off**  
  Let clients approve phases, change orders, or documents (e-signatures) from the portal.

- **Messages & updates**  
  Threaded messages or updates per project so clients see progress without email.

- **Document vault**  
  Read-only (or download-only) access to drawings, reports, and handover docs by project.

- **Support**  
  Clear “Support” or “Contact us” that creates a ticket or notifies the PM so clients don’t see internal admin options.

---

## Backend requirements

- **Profiles**  
  When a user joins via onboarding with `role: 'technician'` or `role: 'client'`, set `profiles.role` (and optionally `profiles.avatar_url`, `profiles.phone`) so the app can show the correct sidebar and redirect.

- **Pay stubs**  
  If you use Pay Stub, add an entity or API that returns pay periods and PDF URLs (or inline data) for the signed-in user.

- **Time off**  
  If you use Request Time Off, persist requests (e.g. `TimeOffRequest` with user_id, start_date, end_date, reason, status) and optionally notify managers.
