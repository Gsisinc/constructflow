// GSIS Fire Alarm PM Field Manual — Appendix A-I form definitions.
// Each checklist form renders a Done checkbox + a Notes field per row.
// Each field/entry table renders a labeled input per row.

export const APPENDIX_FORMS = [
  {
    id: 'A',
    title: 'Appendix A: Handoff Review Checklist',
    type: 'checklist',
    rows: [
      { key: 'a1', label: 'Contract / PO received; notice, retainage, and payment terms noted' },
      { key: 'a2', label: 'Proposal inclusions, exclusions, and assumptions reviewed' },
      { key: 'a3', label: 'Device counts reconciled to drawings' },
      { key: 'a4', label: 'Labor units reviewed for building type and site conditions' },
      { key: 'a5', label: 'Engineering, programming, pre-test, AHJ test, and re-test hours present' },
      { key: 'a6', label: 'Closeout hours present (as-builts, O&M, training)' },
      { key: 'a7', label: 'Lift, permits, freight, travel, per diem included' },
      { key: 'a8', label: 'Subcontractor quotes current and matching scope' },
      { key: 'a9', label: 'Live-site factors priced: access windows, after-hours, cutover, fire watch' },
      { key: 'a10', label: 'Spec requirements vs. proposal exclusions compared' },
      { key: 'a11', label: 'Site walked (or walk scheduled)' },
      { key: 'a12', label: 'Handoff Review memo written and reviewed with Ops Manager' },
      { key: 'a13', label: 'Ownership accepted in writing with assumptions attached' },
      { key: 'a14', label: 'Budget, cost codes, and SOV loaded' },
    ],
  },
  {
    id: 'B',
    title: 'Appendix B: Risk Register Entry',
    type: 'fields',
    rows: [
      { key: 'b1', label: 'Risk ID / description' },
      { key: 'b2', label: 'Likelihood (L/M/H)' },
      { key: 'b3', label: 'Impact ($ and days)' },
      { key: 'b4', label: 'Owner' },
      { key: 'b5', label: 'Trigger' },
      { key: 'b6', label: 'Mitigation' },
      { key: 'b7', label: 'Status / date reviewed' },
    ],
  },
  {
    id: 'C',
    title: 'Appendix C: Daily Huddle Card',
    type: 'fields',
    rows: [
      { key: 'c1', label: 'Date / job' },
      { key: 'c2', label: "Today's areas and tasks" },
      { key: 'c3', label: 'Safety topic' },
      { key: 'c4', label: 'Blockers' },
      { key: 'c5', label: 'Material needed' },
      { key: 'c6', label: 'Who is on what' },
    ],
  },
  {
    id: 'D',
    title: 'Appendix D: Site Walk Report',
    type: 'fields',
    rows: [
      { key: 'd1', label: 'Job / date / walked by' },
      { key: 'd2', label: 'Areas walked' },
      { key: 'd3', label: 'Percent complete by area' },
      { key: 'd4', label: 'Quality issues found' },
      { key: 'd5', label: 'Safety observations' },
      { key: 'd6', label: "Other trades' impacts" },
      { key: 'd7', label: 'Photos taken (count / folder)' },
      { key: 'd8', label: 'Items flagged in writing (to whom)' },
      { key: 'd9', label: 'Actions for next huddle' },
    ],
  },
  {
    id: 'E',
    title: 'Appendix E: RFI',
    type: 'fields',
    rows: [
      { key: 'e1', label: 'RFI number / date' },
      { key: 'e2', label: 'To (GC / engineer)' },
      { key: 'e3', label: 'Drawing and spec references' },
      { key: 'e4', label: 'Condition observed (attach photos)' },
      { key: 'e5', label: 'Question' },
      { key: 'e6', label: 'Proposed solution' },
      { key: 'e7', label: 'Response needed by' },
      { key: 'e8', label: 'Impact if late (cost / schedule)' },
    ],
  },
  {
    id: 'F',
    title: 'Appendix F: Change Order Log Entry',
    type: 'fields',
    rows: [
      { key: 'f1', label: 'CO number' },
      { key: 'f2', label: 'Description' },
      { key: 'f3', label: 'Cause (owner add / unforeseen / design / code / delay)' },
      { key: 'f4', label: 'Date identified / date notified in writing' },
      { key: 'f5', label: 'Priced amount' },
      { key: 'f6', label: 'Status (pending / approved / rejected)' },
      { key: 'f7', label: 'Approval reference' },
    ],
  },
  {
    id: 'G',
    title: 'Appendix G: Cutover & AHJ Readiness',
    type: 'checklist',
    rows: [
      { key: 'g1', label: 'Site contact called and visit confirmed' },
      { key: 'g2', label: 'Restricted areas and times agreed' },
      { key: 'g3', label: 'New system installed and programmed alongside existing' },
      { key: 'g4', label: 'New system online with monitoring; signals verified' },
      { key: 'g5', label: 'Owner, site contact, monitoring (and AHJ if required) notified of cutover' },
      { key: 'g6', label: 'Occupants notified that alarms may sound' },
      { key: 'g7', label: 'Fire watch arranged for any impairment period' },
      { key: 'g8', label: 'Rollback plan agreed' },
      { key: 'g9', label: '100% pre-test complete and documented' },
      { key: 'g10', label: 'Interfaces tested with their trades' },
      { key: 'g11', label: 'Equipment spaces enclosed and conditioned' },
      { key: 'g12', label: 'Critical functions re-verified immediately before AHJ' },
      { key: 'g13', label: 'Test report, drawings, and calcs on site for AHJ' },
    ],
  },
  {
    id: 'H',
    title: 'Appendix H: Closeout Checklist',
    type: 'checklist',
    rows: [
      { key: 'h1', label: 'Punch list complete and signed off' },
      { key: 'h2', label: 'AHJ acceptance obtained' },
      { key: 'h3', label: 'Record of completion' },
      { key: 'h4', label: 'Test reports' },
      { key: 'h5', label: 'As-built / record drawings' },
      { key: 'h6', label: 'Program backup and sequence of operations delivered' },
      { key: 'h7', label: 'O&M manuals and product data' },
      { key: 'h8', label: 'Warranty letter' },
      { key: 'h9', label: 'Owner training complete with sign-in sheet' },
      { key: 'h10', label: 'Attic stock turned over with signed receipt' },
      { key: 'h11', label: 'Final billing and retainage request submitted' },
      { key: 'h12', label: 'Service department handoff meeting held' },
      { key: 'h13', label: 'Lessons learned captured and shared with estimating' },
    ],
  },
  {
    id: 'I',
    title: 'Appendix I: Weekly Status Report',
    type: 'fields',
    rows: [
      { key: 'i1', label: 'Job / week ending' },
      { key: 'i2', label: 'Progress this week (percent complete)' },
      { key: 'i3', label: 'Next two weeks (look-ahead)' },
      { key: 'i4', label: 'Schedule status and key dates' },
      { key: 'i5', label: 'Cost status / EAC vs. budget' },
      { key: 'i6', label: 'Open RFIs' },
      { key: 'i7', label: 'Pending change orders' },
      { key: 'i8', label: 'Top risks and mitigations' },
      { key: 'i9', label: 'Safety' },
      { key: 'i10', label: 'Needs from customer / Ops Manager' },
    ],
  },
];

export function emptyFormData(formDef) {
  const data = {};
  if (formDef.type === 'checklist') {
    formDef.rows.forEach((r) => { data[r.key] = { done: false, notes: '' }; });
  } else {
    formDef.rows.forEach((r) => { data[r.key] = ''; });
  }
  return data;
}

export function checklistProgress(formDef, data) {
  if (formDef.type !== 'checklist') return null;
  const total = formDef.rows.length;
  const done = formDef.rows.filter((r) => data?.[r.key]?.done).length;
  return { done, total };
}