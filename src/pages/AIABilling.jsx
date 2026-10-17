// AIABilling.jsx — Financials hub consolidated into the existing, registered AIABilling page
// (Base44 editor cannot create new files). Route name stays "AIABilling".
// Tabs (deep-linkable via ?tab=): dashboard | billing | wip | sov
// Inlined: lib/financials/{compute,pdf}.js, components/financials/{GSISHeader,SourceTag,DocumentPreview}.jsx
import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { stampCreate, stampUpdate } from '@/lib/audit';
import { fmtMoney, signedMoney, roundCents } from '@/lib/money';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LayoutDashboard, Banknote, Calculator, ListChecks, AlertTriangle, Clock, TrendingUp, Eye, Search, Save, Download, Mail, Printer } from 'lucide-react';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Upload, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// ==== inlined from lib/financials/compute.js ====
// Financials data math. Pure functions; no writes. Every figure returns
// { value, missing, source } so the UI can render MISSING + a source tag.

const safeNum = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);
const has = (v) => v !== undefined && v !== null && v !== '';
const asList = (r) => (Array.isArray(r) ? r : r?.items || []);
const todayISO = () => new Date().toISOString().slice(0, 10);

// Approved change-order rule, same as JobCosting.jsx (approved | executed).
const coApproved = (co) => co.status === 'approved' || co.status === 'executed';

// WIP rows: copied 1:1 from the fixed WIP math in src/pages/JobCosting.jsx
// (2026-10-15). NOT reused: `wipValue = totalBudget * 0.6 - totalSpent` and the
// category budget splits (labor 0.35 / materials 0.3 / sub 0.2 / other 0.05);
// those are guessed numbers and are flagged in the report.
// TODO: extract this into src/lib/wip.js and import from both pages.
function computeWipRows({ projects, expenses, changeOrders, invoices }) {
  const billedBy = {};
  invoices.forEach((inv) => {
    if (!inv.project_id || inv.status === 'draft') return;
    billedBy[inv.project_id] = safeNum(billedBy[inv.project_id]) + safeNum(inv.total_amount);
  });
  return projects.map((p) => {
    const cost = expenses.filter((e) => e.project_id === p.id).reduce((s, e) => s + safeNum(e.amount), 0);
    const coImpact = changeOrders.filter((co) => co.project_id === p.id && coApproved(co)).reduce((s, co) => s + safeNum(co.cost_impact), 0);
    const contract = safeNum(p.budget) + coImpact;
    const finalCost = safeNum(p.projected_final_cost);
    const toComplete = safeNum(p.cost_to_complete);
    const eac = finalCost > 0 ? finalCost : toComplete > 0 ? cost + toComplete : 0;
    const pct = eac > 0 ? Math.min(cost / eac, 1) : 0;
    const earned = roundCents(pct * contract);
    const billed = roundCents(safeNum(billedBy[p.id]));
    return {
      id: p.id, name: p.name || 'MISSING', client: p.client_name,
      contract: roundCents(contract), contractMissing: !has(p.budget) || safeNum(p.budget) === 0,
      coImpact: roundCents(coImpact), eac: roundCents(eac), eacMissing: eac === 0,
      cost: roundCents(cost), pct, earned, billed,
      overUnder: roundCents(billed - earned),
    };
  });
}

// Past-due AR: SalesInvoice not draft/paid, due_date before today.
// SalesInvoice has no amount_paid / balance field, so the full total_amount
// is counted (partial payments are invisible). Flagged.
function pastDueAR(invoices, today = todayISO()) {
  const rows = invoices.filter((i) => i.status !== 'paid' && i.status !== 'draft' && (i.status === 'overdue' || (has(i.due_date) && i.due_date < today)));
  const noDueDate = invoices.filter((i) => i.status === 'sent' && !has(i.due_date));
  return { rows, total: roundCents(rows.reduce((s, i) => s + safeNum(i.total_amount), 0)), noDueDate };
}

// Local-calendar YYYY-MM-DD (todayISO() is UTC, which rolls to tomorrow after
// 5 PM PT; due-date comparisons should use the user's calendar day).
const localTodayISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Retention: Σ PayApplication.retention_amount on non-draft pay apps, by project.
// Due date / release state come from Project.retention_due_date and
// Project.retention_release_status (new fields, approved 2026-10-15).
//   missing   = retention held (> 0) but Project.retention_due_date empty
//   released  = Project.retention_release_status === 'released'
//   pastDue   = due date < today and not released
//   dueThisMonth = due date in current calendar month and not released
// dueThisMonthTotal sums only rows with a real date; nothing is estimated.
function retentionHeld(payApps, projects, today = localTodayISO()) {
  const byProject = {};
  payApps.filter((a) => a.status !== 'draft' && a.project_id).forEach((a) => {
    byProject[a.project_id] = safeNum(byProject[a.project_id]) + safeNum(a.retention_amount);
  });
  const month = today.slice(0, 7);
  const rows = Object.entries(byProject)
    .map(([pid, amt]) => {
      const project = projects.find((p) => p.id === pid);
      const due = has(project?.retention_due_date) ? String(project.retention_due_date).slice(0, 10) : null;
      const releaseStatus = project?.retention_release_status || null;
      const released = releaseStatus === 'released';
      return {
        project_id: pid, project, amount: roundCents(amt),
        dueDate: due, releaseStatus, released, notes: project?.retention_notes || '',
        missing: !due,
        pastDue: !!due && !released && due < today,
        dueThisMonth: !!due && !released && due.slice(0, 7) === month,
      };
    })
    .filter((r) => r.amount > 0.005)
    // past due first, then by date, undated last
    .sort((a, b) => (b.pastDue - a.pastDue) || ((a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1));
  const sum = (list) => roundCents(list.reduce((s, r) => s + r.amount, 0));
  const dueRows = rows.filter((r) => r.dueThisMonth);
  return {
    rows,
    total: sum(rows),
    dueThisMonthTotal: sum(dueRows), dueThisMonthCount: dueRows.length,
    pastDueTotal: sum(rows.filter((r) => r.pastDue)), pastDueCount: rows.filter((r) => r.pastDue).length,
    missingCount: rows.filter((r) => r.missing).length,
  };
}

// G702 / G703 from a ScheduleOfValues. percent_complete is 0-100 (as SOVTab).
// billed_to_date = "previous applications" (SOVTab writes cumulative earned there
// after each pay app).
function buildPayApp({ sov, project, changeOrders, payApps }) {
  const retPct = has(sov?.retention_percent) ? safeNum(sov.retention_percent) : null;
  const lines = (sov?.line_items || []).map((l, i) => {
    const sv = safeNum(l.scheduled_value);
    const pct = safeNum(l.percent_complete);
    const completed = roundCents(sv * (pct / 100));
    const previous = roundCents(safeNum(l.billed_to_date));
    const thisPeriod = roundCents(completed - previous);
    return {
      no: i + 1, description: l.description || 'MISSING', cost_code: l.cost_code || '',
      scheduled: roundCents(sv), previous, thisPeriod, completed, pct,
      balance: roundCents(sv - completed),
      retainage: retPct === null ? null : roundCents(completed * (retPct / 100)),
    };
  });
  const sum = (k) => roundCents(lines.reduce((s, l) => s + safeNum(l[k]), 0));
  const originalSum = sum('scheduled');
  const coNet = roundCents(changeOrders.filter((co) => co.project_id === project?.id && coApproved(co)).reduce((s, co) => s + safeNum(co.cost_impact), 0));
  const completed = sum('completed');
  const retainage = retPct === null ? null : roundCents(completed * (retPct / 100));
  const earnedLessRet = retainage === null ? null : roundCents(completed - retainage);
  // Line 7: less previous certificates = sum of net_amount_due on prior non-draft pay apps.
  const prior = payApps.filter((a) => a.project_id === project?.id && a.status !== 'draft');
  const previousCerts = roundCents(prior.reduce((s, a) => s + safeNum(a.net_amount_due), 0));
  const currentDue = earnedLessRet === null ? null : roundCents(earnedLessRet - previousCerts);
  return {
    lines, retPct, originalSum, coNet,
    contractSum: roundCents(originalSum + coNet), completed, retainage, earnedLessRet,
    previousCerts, currentDue, balanceToFinish: roundCents(originalSum + coNet - completed),
    thisPeriodTotal: sum('thisPeriod'), previousTotal: sum('previous'),
    nextAppNo: prior.length + 1,
    sovVsBudget: has(project?.budget) ? roundCents(originalSum - safeNum(project.budget)) : null,
  };
}

// ==== inlined from lib/financials/pdf.js ====
// PDF export + email draft. package.json has jspdf ^4 and html2canvas ^1.4,
// so we render the preview DOM to canvas and paginate onto Letter pages.
// If either import fails at runtime we fall back to window.print() with the
// @media print stylesheet in Financials.jsx.


async function buildPdf(node) {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgW = pageW - margin * 2;
  const pxPerPt = canvas.width / imgW;
  const sliceH = Math.floor((pageH - margin * 2) * pxPerPt);
  for (let y = 0, page = 0; y < canvas.height; y += sliceH, page++) {
    const part = document.createElement('canvas');
    part.width = canvas.width;
    part.height = Math.min(sliceH, canvas.height - y);
    part.getContext('2d').drawImage(canvas, 0, y, canvas.width, part.height, 0, 0, canvas.width, part.height);
    if (page > 0) pdf.addPage();
    pdf.addImage(part.toDataURL('image/png'), 'PNG', margin, margin, imgW, part.height / pxPerPt);
  }
  return pdf;
}

async function downloadPdf(node, filename) {
  try {
    const pdf = await buildPdf(node);
    pdf.save(filename);
  } catch (e) {
    console.warn('jsPDF export failed, falling back to print', e);
    window.print();
  }
}

// Opens the user's mail client with a DRAFT only. Nothing is sent from the app.
// mailto: cannot carry attachments, so the body tells the user to attach the
// PDF they just downloaded.
function mailtoDraftHref({ to = '', subject = '', body = '' }) {
  const q = new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20');
  return `mailto:${encodeURIComponent(to)}?${q}`;
}

// ==== inlined from components/financials/GSISHeader.jsx ====
// Company info from /workspace/GSIS/04-Templates/Invoice-Progress.md (letterhead
// line). Logo: public/mygsis-logo.png (used by Onboarding.jsx);
// 04-Templates/gsis-logo.png is the template copy. Copy it into public/ if the
// in-app one is not the GSIS mark.
const GSIS = {
  name: 'Golden State Integrated Systems',
  short: 'GSIS',
  license: 'CA License #1150625',
  classes: 'C7 Low Voltage · C10 Electrical',
  address: '601 Brannan Island Road, Isleton, CA 95641',
  phone: '209-200-1073',
  web: 'gsistech.com',
  email: null, // MISSING: {{GSIS_EMAIL}} is still a placeholder in the template
  owner: 'Kemar McKenzie',
  logo: '/mygsis-logo.png',
};

function Logo({ className }) {
  const [ok, setOk] = React.useState(true);
  if (!ok) return <div className={`${className} flex items-center justify-center rounded-md bg-navy-900 text-gold-500 font-black tracking-tight`}>GSIS</div>;
  return <img src={GSIS.logo} alt="GSIS" className={`${className} object-contain`} onError={() => setOk(false)} crossOrigin="anonymous" />;
}

// Page header (navy band) for every Financials tab.
function GSISPageHeader({ title, subtitle, right }) {
  return (
    <div className="rounded-xl overflow-hidden border border-navy-100 shadow-sm bg-white">
      <div className="gs-attn bg-gradient-to-r from-navy-900 to-navy-700 text-white px-4 sm:px-6 py-4 flex items-center gap-4" style={{ color: '#ffffff' }}>
        <Logo className="h-11 w-11 bg-white/95 p-1 rounded-md" />
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold-500 font-semibold">{GSIS.name}</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate" style={{ color: '#ffffff' }}>{title}</h1>
          {subtitle && <p className="text-[12px] text-navy-200 truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{subtitle}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>
      <div className="h-1 bg-gold-500" />
      <div className="px-4 sm:px-6 py-1.5 text-[11px] text-navy-700 bg-navy-50 flex flex-wrap gap-x-4">
        <span>{GSIS.license}</span><span>{GSIS.classes}</span><span>{GSIS.address}</span><span>{GSIS.phone}</span><span>{GSIS.web}</span>
      </div>
    </div>
  );
}

// Letterhead used on every document preview / PDF.
function GSISLetterhead({ docTitle, docNo, docDate }) {
  return (
    <div className="border-b-2 border-navy-900 pb-3 mb-4">
      <div className="flex items-start gap-4">
        <Logo className="h-16 w-16" />
        <div className="flex-1">
          <div className="text-lg font-bold text-navy-900 leading-tight">{GSIS.name}</div>
          <div className="text-[11px] text-slate-600 leading-snug">
            {GSIS.license} ({GSIS.classes})<br />
            {GSIS.address} · {GSIS.phone} · {GSIS.web}{GSIS.email ? ` · ${GSIS.email}` : ''}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-bold uppercase tracking-wide text-navy-900">{docTitle}</div>
          {docNo && <div className="text-[12px] text-slate-700">No. {docNo}</div>}
          {docDate && <div className="text-[12px] text-slate-700">{docDate}</div>}
        </div>
      </div>
      <div className="h-0.5 bg-gold-500 mt-3" />
    </div>
  );
}

// ==== inlined from components/financials/SourceTag.jsx ====
// Small "i"-style source chip; hidden in print/PDF via .no-print.
function SourceTag({ source }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="no-print ml-1 inline-flex items-center rounded px-1 text-[9px] font-semibold uppercase tracking-wide text-navy-500 bg-navy-50 ring-1 ring-navy-100 cursor-help align-middle">src</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-[11px]">{source}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Missing({ why }) {
  return <span title={why} className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-red-700 bg-red-50 ring-1 ring-red-200">MISSING</span>;
}

// Money figure with MISSING handling + source tag.
function Fig({ value, missing, source, signed, className = '', why }) {
  const show = missing || value === null || value === undefined;
  return (
    <span className={`tabular-nums whitespace-nowrap ${className}`}>
      {show ? <Missing why={why || source} /> : signed ? signedMoney(value) : fmtMoney(value)}
      <SourceTag source={source} />
    </span>
  );
}

// ==== inlined from components/financials/DocumentPreview.jsx ====
// Preview-first document modal. Download = PDF. Send = opens an email DRAFT
// in the user's mail client (mailto:). Nothing is sent from the app.
function DocumentPreview({ open, onOpenChange, title, filename, email, children, footer }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const onDownload = async () => { setBusy(true); try { await downloadPdf(ref.current, filename); } finally { setBusy(false); } };
  const href = mailtoDraftHref({
    to: email?.to || '',
    subject: email?.subject || title,
    body: (email?.body || '') + '\n\n(Attach the PDF downloaded from MyGSIS before sending.)\n\nKemar McKenzie\nGolden State Integrated Systems · CA License #1150625\n209-200-1073 · gsistech.com',
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="no-print px-4 py-3 bg-gradient-to-r from-navy-900 to-navy-700 text-white flex-row items-center gap-2 space-y-0">
          <Eye className="h-4 w-4 text-gold-500" />
          <DialogTitle className="text-[14px] font-bold">Preview · {title}</DialogTitle>
          <span className="ml-2 rounded bg-gold-500/20 text-gold-500 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">Draft preview</span>
        </DialogHeader>
        <div className="flex-1 overflow-auto overflow-x-auto bg-slate-200 p-2 sm:p-4">
          <div ref={ref} className="fin-doc mx-auto bg-white shadow-lg w-full min-w-[720px] max-w-[816px] p-8 text-[12px] text-slate-800">{children}</div>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2 px-4 py-3 border-t border-navy-100 bg-navy-50">
          <div className="text-[11px] text-navy-700 mr-auto">{footer || 'Review every figure. MISSING marks data that does not exist in MyGSIS yet.'}</div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5"><Printer className="h-4 w-4" />Print</Button>
          <Button size="sm" onClick={onDownload} disabled={busy} className="gap-1.5 bg-navy-900 hover:bg-navy-700 text-white"><Download className="h-4 w-4 text-gold-500" />{busy ? 'Building PDF…' : 'Download PDF'}</Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5 border-navy-300 text-navy-900">
            <a href={href} title="Opens an email draft in your mail app. Nothing is sent from MyGSIS."><Mail className="h-4 w-4" />Send (open draft)</a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==== inlined from pages/Financials.jsx ====
// Financials (2026-10-17). Replaces the sidebar "Billing" group.
// Tabs (deep-linkable via ?tab=): dashboard | billing | wip | sov
// Data: SalesInvoice, PayApplication, ScheduleOfValues, Project, ChangeOrder, Expense.
// No delete / send / submit / publish. Only write: SOV % complete edits and a
// PayApplication saved with status 'draft' (both via stampCreate/stampUpdate).















const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'billing', label: 'Billing', icon: Banknote },
  { id: 'wip', label: 'WIP', icon: Calculator },
  { id: 'sov', label: 'SOV & Pay Apps', icon: ListChecks },
];

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  .fin-doc, .fin-doc * { visibility: visible !important; }
  .fin-doc { position: absolute; inset: 0; width: 100% !important; max-width: none !important; box-shadow: none !important; padding: 0.4in !important; }
  .no-print { display: none !important; }
  @page { size: letter; margin: 0.4in; }
}`;

const fmtDate = (d) => (has(d) ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null);
const D = ({ d }) => (fmtDate(d) || <Missing why="date not set" />);

function useEntity(name, opts = {}) {
  return useQuery({
    queryKey: ['fin', name],
    queryFn: async () => asList(await base44.entities[name].filter({}, { limit: 1000, ...opts })),
  });
}

// ---------- shared UI ----------
function Card({ title, icon: Icon, children, right, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-navy-100 border-t-2 border-t-navy-700 shadow-sm ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-navy-50">
          {Icon && <Icon className="h-4 w-4 text-gold-500" />}
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-navy-900">{title}</h3>
          {right && <div className="w-full sm:w-auto sm:ml-auto max-w-full">{right}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
function Kpi({ label, children, sub, tone = 'navy', icon: Icon }) {
  const ring = tone === 'red' ? 'border-t-red-600' : tone === 'amber' ? 'border-t-amber-500' : 'border-t-navy-700';
  return (
    <div className={`bg-white rounded-xl border border-navy-100 border-t-4 ${ring} shadow-sm p-4`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-navy-700">{Icon && <Icon className="h-4 w-4 text-gold-500" />}{label}</div>
      <div className="mt-2 text-2xl font-bold text-navy-900">{children}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}
const Th = ({ children, r }) => <th className={`px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-navy-700 ${r ? 'text-right' : 'text-left'}`}>{children}</th>;
const Td = ({ children, r, className = '' }) => <td className={`px-2 py-2 ${r ? 'text-right' : ''} ${className}`}>{children}</td>;
const StatusPill = ({ s }) => {
  const c = { paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200', overdue: 'bg-red-50 text-red-700 ring-red-200', sent: 'bg-navy-50 text-navy-700 ring-navy-200', submitted: 'bg-navy-50 text-navy-700 ring-navy-200', draft: 'bg-slate-100 text-slate-600 ring-slate-200' }[s] || 'bg-slate-100 text-slate-600 ring-slate-200';
  return s ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${c}`}>{s}</span> : <Missing why="status not set" />;
};

// ---------- page ----------
function FinancialsHub() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'dashboard';
  const setTab = (t) => { const p = new URLSearchParams(params); p.set('tab', t); setParams(p, { replace: true }); };

  const { data: projects = [] } = useEntity('Project');
  const { data: invoices = [] } = useEntity('SalesInvoice', { sort: '-invoice_date' });
  const { data: payApps = [] } = useEntity('PayApplication');
  const { data: sovs = [] } = useEntity('ScheduleOfValues');
  const { data: changeOrders = [] } = useEntity('ChangeOrder');
  const { data: expenses = [] } = useEntity('Expense');

  const data = { projects, invoices, payApps, sovs, changeOrders, expenses };
  const wipRows = useMemo(() => computeWipRows(data), [projects, expenses, changeOrders, invoices]); // eslint-disable-line react-hooks/exhaustive-deps
  const projName = (id) => projects.find((p) => p.id === id)?.name;

  return (
    <div className="min-h-full bg-slate-50 p-3 sm:p-6 space-y-4">
      <style>{PRINT_CSS}</style>
      <div className="no-print">
        <GSISPageHeader title="Financials" subtitle="AR, billing, WIP and pay applications · every figure is computed from MyGSIS records"
          right={<span className="hidden sm:inline rounded bg-gold-500/20 text-gold-500 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">Draft</span>} />
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-print bg-white border border-navy-100 h-auto p-1 flex flex-wrap gap-1 justify-start">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-[13px] data-[state=active]:bg-navy-900 data-[state=active]:text-white">
              <t.icon className="h-4 w-4 text-gold-500" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="dashboard" className="mt-4"><DashboardTab {...data} wipRows={wipRows} projName={projName} /></TabsContent>
        <TabsContent value="billing" className="mt-4"><BillingTab {...data} projName={projName} /></TabsContent>
        <TabsContent value="wip" className="mt-4"><WipTab wipRows={wipRows} /></TabsContent>
        <TabsContent value="sov" className="mt-4"><SovTab {...data} /></TabsContent>
      </Tabs>
      <div className="no-print text-[11px] text-slate-500">
        Legacy pages remain available: <Link className="underline text-navy-700" to={createPageUrl('Billing')}>Billing</Link> · <Link className="underline text-navy-700" to={createPageUrl('WIPReport')}>WIP Report</Link> · <Link className="underline text-navy-700" to={createPageUrl('JobCosting')}>Job Costing</Link>
      </div>
    </div>
  );
}

// ---------- 1) Dashboard ----------
function DashboardTab({ invoices, payApps, projects, wipRows, projName }) {
  const ar = pastDueAR(invoices);
  const ret = retentionHeld(payApps, projects, localTodayISO());
  const over = wipRows.filter((r) => r.overUnder > 0.005 && !r.eacMissing).sort((a, b) => b.overUnder - a.overUnder);
  const noEac = wipRows.filter((r) => r.eacMissing).length;
  const [open, setOpen] = useState(false);
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const body = (
    <>
      <GSISLetterhead docTitle="Financial Snapshot" docDate={fmtDate(todayISO())} />
      <SnapshotBody ar={ar} ret={ret} over={over} projName={projName} month={month} />
    </>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi label="Past-due AR" tone="red" icon={AlertTriangle} sub={`${ar.rows.length} invoice(s) past due_date, not paid${ar.noDueDate.length ? ` · ${ar.noDueDate.length} sent with no due date` : ''}`}>
          <Fig value={ar.total} source="SalesInvoice.total_amount where status ∉ {paid, draft} and (status = overdue or due_date < today). No amount_paid field: partial payments not netted." />
        </Kpi>
        <Kpi label={`Retention due ${month}`} tone="amber" icon={Clock} sub={<>Held to date: <Fig value={ret.total} source="Σ PayApplication.retention_amount (status ≠ draft)" /> · {ret.dueThisMonthCount} job(s) due this month{ret.pastDueCount ? <> · <span className="font-bold text-red-700">{ret.pastDueCount} PAST DUE</span> <Fig value={ret.pastDueTotal} source="Σ PayApplication.retention_amount where Project.retention_due_date < today and Project.retention_release_status ≠ released" /></> : null}{ret.missingCount ? <> · {ret.missingCount} with no due date <Missing why="Project.retention_due_date empty" /></> : null}</>}>
          <Fig value={ret.dueThisMonthTotal} source="Σ PayApplication.retention_amount (status ≠ draft) for jobs whose Project.retention_due_date is in this calendar month and Project.retention_release_status ≠ released. Jobs with no date are excluded (shown as MISSING)." />
        </Kpi>
        <Kpi label="Over-billed jobs" icon={TrendingUp} sub={`${noEac} job(s) excluded: no EAC (Project.projected_final_cost / cost_to_complete)`}>
          {over.length}<span className="text-base font-semibold text-slate-500"> · </span>
          <Fig className="text-base" value={over.reduce((s, r) => s + r.overUnder, 0)} source="WIP: billed (SalesInvoice.total_amount, non-draft) − earned (cost/EAC × contract). Same math as JobCosting.jsx" />
        </Kpi>
      </div>
      <div className="flex justify-end no-print"><Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 bg-navy-900 hover:bg-navy-700 text-white"><Eye className="h-4 w-4 text-gold-500" />Preview snapshot PDF</Button></div>
      <Card title="At a glance" icon={LayoutDashboard}><SnapshotBody ar={ar} ret={ret} over={over} projName={projName} month={month} /></Card>
      <DocumentPreview open={open} onOpenChange={setOpen} title="Financial Snapshot" filename={`GSIS-Financial-Snapshot-${todayISO()}.pdf`}
        email={{ subject: `GSIS Financial Snapshot ${fmtDate(todayISO())}`, body: 'Attached is the current financial snapshot.' }}>{body}</DocumentPreview>
    </div>
  );
}
function SnapshotBody({ ar, ret, over, projName }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-[12px]">
      <div>
        <h4 className="font-bold text-navy-900 mb-1">Past-due invoices</h4>
        <table className="w-full"><tbody>
          {ar.rows.map((i) => <tr key={i.id} className="border-b border-navy-50"><Td>{i.invoice_number || <Missing />}<div className="text-[10px] text-slate-500">{projName(i.project_id) || i.customer_name || ''} · due <D d={i.due_date} /></div></Td><Td r><Fig value={safeNum(i.total_amount)} missing={!has(i.total_amount)} source="SalesInvoice.total_amount" /></Td></tr>)}
          {!ar.rows.length && <tr><Td className="text-slate-400">None past due</Td></tr>}
        </tbody></table>
      </div>
      <div>
        <h4 className="font-bold text-navy-900 mb-1">Retention held by job<span className="ml-1 font-normal text-[10px] text-slate-500">(due this month <Fig value={ret.dueThisMonthTotal} source="Σ PayApplication.retention_amount where Project.retention_due_date in this month, not released" />)</span></h4>
        <table className="w-full"><tbody>
          {ret.rows.map((r) => <tr key={r.project_id} className="border-b border-navy-50"><Td>{r.project?.name || <Missing why="project not found" />}<div className="text-[10px] text-slate-500">due {r.missing ? <Missing why="Project.retention_due_date not set" /> : fmtDate(r.dueDate)}<SourceTag source="Project.retention_due_date" />{r.pastDue && <span className="ml-1 rounded px-1 py-0.5 text-[9px] font-bold tracking-wide text-white bg-red-600">PAST DUE</span>}{r.dueThisMonth && !r.pastDue && <span className="ml-1 rounded px-1 py-0.5 text-[9px] font-bold tracking-wide text-amber-800 bg-amber-100 ring-1 ring-amber-200">THIS MONTH</span>}{r.releaseStatus && <> · {r.releaseStatus}<SourceTag source="Project.retention_release_status" /></>}</div></Td><Td r><Fig value={r.amount} source="Σ PayApplication.retention_amount (status ≠ draft, this project)" /></Td></tr>)}
          {!ret.rows.length && <tr><Td className="text-slate-400">No retention recorded on pay apps</Td></tr>}
        </tbody></table>
      </div>
      <div>
        <h4 className="font-bold text-navy-900 mb-1">Over-billed jobs</h4>
        <table className="w-full"><tbody>
          {over.map((r) => <tr key={r.id} className="border-b border-navy-50"><Td>{r.name}<div className="text-[10px] text-slate-500">{Math.round(r.pct * 100)}% complete (cost/EAC)</div></Td><Td r className="text-amber-700"><Fig value={r.overUnder} source="WIP billed − earned" /></Td></tr>)}
          {!over.length && <tr><Td className="text-slate-400">No over-billed jobs with an EAC</Td></tr>}
        </tbody></table>
      </div>
    </div>
  );
}

// ---------- 2) Billing ----------
function BillingTab({ invoices, payApps, projects, projName }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [doc, setDoc] = useState(null);
  const rows = useMemo(() => {
    const inv = invoices.map((i) => ({ kind: 'Invoice', id: i.id, no: i.invoice_number, date: i.invoice_date, due: i.due_date, project_id: i.project_id, who: i.customer_name, amount: i.total_amount, status: i.status, rec: i }));
    const pa = payApps.map((a) => ({ kind: 'Pay App', id: a.id, no: a.application_number, date: a.period, due: null, project_id: a.project_id, who: projects.find((p) => p.id === a.project_id)?.client_name, amount: a.net_amount_due, status: a.status, rec: a }));
    const t = q.trim().toLowerCase();
    return [...inv, ...pa]
      .filter((r) => status === 'all' || r.status === status)
      .filter((r) => !t || [r.no, r.who, projName(r.project_id)].some((x) => (x || '').toLowerCase().includes(t)))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [invoices, payApps, projects, q, status]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = roundCents(rows.reduce((s, r) => s + safeNum(r.amount), 0));

  return (
    <Card title={`All invoices & pay apps · ${rows.length}`} icon={Banknote}
      right={<div className="flex flex-wrap gap-2 no-print">
        <div className="relative flex-1 sm:flex-none"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-navy-300" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search no., client, job" className="h-8 pl-7 pr-2 w-full sm:w-48 rounded-md ring-1 ring-navy-100 focus:ring-2 focus:ring-gold-500 outline-none text-[12px]" /></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 rounded-md ring-1 ring-navy-100 text-[12px] px-2">{['all', 'draft', 'sent', 'overdue', 'submitted', 'paid'].map((s) => <option key={s}>{s}</option>)}</select>
      </div>}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-navy-50"><tr><Th>Type</Th><Th>No.</Th><Th>Project</Th><Th>Client</Th><Th>Date</Th><Th>Due</Th><Th>Status</Th><Th r>Amount</Th><Th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kind + r.id} onClick={() => setDoc(r)} className="border-b border-navy-50 hover:bg-navy-50/60 cursor-pointer">
                <Td><span className="text-[10px] font-bold uppercase text-navy-500">{r.kind}</span></Td>
                <Td className="font-semibold text-navy-900">{r.no || <Missing why={r.kind === 'Invoice' ? 'SalesInvoice.invoice_number' : 'PayApplication.application_number'} />}</Td>
                <Td>{projName(r.project_id) || <Missing why="project_id empty or not found" />}</Td>
                <Td>{r.who || <Missing why={r.kind === 'Invoice' ? 'SalesInvoice.customer_name' : 'Project.client_name'} />}</Td>
                <Td><D d={r.date} /></Td>
                <Td>{r.kind === 'Invoice' ? <D d={r.due} /> : <span className="text-slate-400">n/a</span>}</Td>
                <Td><StatusPill s={r.status} /></Td>
                <Td r><Fig value={safeNum(r.amount)} missing={!has(r.amount)} source={r.kind === 'Invoice' ? 'SalesInvoice.total_amount' : 'PayApplication.net_amount_due'} /></Td>
                <Td r><Eye className="h-4 w-4 text-navy-300 inline" /></Td>
              </tr>
            ))}
            {!rows.length && <tr><Td className="text-slate-400 py-8 text-center" >No invoices or pay apps</Td></tr>}
          </tbody>
          {rows.length > 0 && <tfoot><tr className="bg-navy-900 text-white font-semibold"><Td>Total (listed)</Td><Td /><Td /><Td /><Td /><Td /><Td /><Td r>{fmtMoney(total)}</Td><Td /></tr></tfoot>}
        </table>
      </div>
      {doc && (
        <DocumentPreview open onOpenChange={(o) => !o && setDoc(null)} title={`${doc.kind} ${doc.no || ''}`} filename={`GSIS-${doc.kind.replace(' ', '')}-${doc.no || doc.id}.pdf`}
          email={{ to: doc.rec.customer_email || projects.find((p) => p.id === doc.project_id)?.client_email || '', subject: `GSIS ${doc.kind} ${doc.no || ''} · ${projName(doc.project_id) || ''}`, body: `Please find attached ${doc.kind.toLowerCase()} ${doc.no || ''}.` }}>
          {doc.kind === 'Invoice' ? <InvoiceDoc inv={doc.rec} project={projects.find((p) => p.id === doc.project_id)} /> : <SavedPayAppDoc app={doc.rec} project={projects.find((p) => p.id === doc.project_id)} />}
        </DocumentPreview>
      )}
    </Card>
  );
}
function InvoiceDoc({ inv, project }) {
  const lines = inv.line_items || [];
  return (
    <>
      <GSISLetterhead docTitle="Invoice" docNo={inv.invoice_number || 'MISSING'} docDate={fmtDate(inv.invoice_date) || 'Date MISSING'} />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><div className="text-[10px] font-bold uppercase text-navy-700">Bill to</div>{inv.customer_name || <Missing />}<br />{inv.customer_email}{inv.customer_phone ? ` · ${inv.customer_phone}` : ''}</div>
        <div><div className="text-[10px] font-bold uppercase text-navy-700">Job</div>{project?.name || <Missing />}<br />{project?.address}<div className="mt-1">Terms: {inv.payment_terms || <Missing />} · Due: <D d={inv.due_date} /></div></div>
      </div>
      <table className="w-full mb-4"><thead className="bg-navy-900 text-white"><tr><th className="text-left px-2 py-1.5">Description</th><th className="text-right px-2">Qty</th><th className="text-right px-2">Unit</th><th className="text-right px-2">Total</th></tr></thead>
        <tbody>{lines.map((l, i) => <tr key={i} className="border-b border-navy-50"><Td>{l.product_name || l.description || <Missing />}</Td><Td r>{has(l.quantity) ? l.quantity : <Missing />}</Td><Td r><Fig value={l.unit_price} missing={!has(l.unit_price)} source="SalesInvoice.line_items[].unit_price" /></Td><Td r><Fig value={l.total} missing={!has(l.total)} source="SalesInvoice.line_items[].total" /></Td></tr>)}
          {!lines.length && <tr><Td><Missing why="SalesInvoice.line_items empty" /></Td></tr>}</tbody></table>
      <div className="ml-auto w-64 space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><Fig value={inv.subtotal} missing={!has(inv.subtotal)} source="SalesInvoice.subtotal" /></div>
        <div className="flex justify-between"><span>Tax</span><Fig value={inv.tax_amount} missing={!has(inv.tax_amount)} source="SalesInvoice.tax_amount" /></div>
        <div className="flex justify-between font-bold text-navy-900 border-t-2 border-navy-900 pt-1"><span>Amount due</span><Fig value={inv.total_amount} missing={!has(inv.total_amount)} source="SalesInvoice.total_amount" /></div>
      </div>
      {inv.notes && <p className="mt-4 text-[11px] text-slate-600">{inv.notes}</p>}
    </>
  );
}
function SavedPayAppDoc({ app, project }) {
  const snap = app.sov_snapshot?.lines || [];
  return (
    <>
      <GSISLetterhead docTitle="Application for Payment" docNo={app.application_number || 'MISSING'} docDate={fmtDate(app.period) || 'Period MISSING'} />
      <div className="mb-3">Project: <b>{project?.name || <Missing />}</b> · Owner: {project?.client_name || <Missing />} · Status: <StatusPill s={app.status} /></div>
      <div className="w-80 space-y-1 mb-4">
        <div className="flex justify-between"><span>Total completed & stored</span><Fig value={app.total_completed_value} missing={!has(app.total_completed_value)} source="PayApplication.total_completed_value" /></div>
        <div className="flex justify-between"><span>Retainage ({has(app.retention_percent) ? app.retention_percent + '%' : 'MISSING'})</span><Fig value={app.retention_amount} missing={!has(app.retention_amount)} source="PayApplication.retention_amount" /></div>
        <div className="flex justify-between font-bold border-t-2 border-navy-900 pt-1"><span>Net amount due</span><Fig value={app.net_amount_due} missing={!has(app.net_amount_due)} source="PayApplication.net_amount_due" /></div>
      </div>
      {snap.length > 0 ? (
        <table className="w-full text-[11px]"><thead className="bg-navy-900 text-white"><tr><th className="text-left px-2 py-1">Line (snapshot)</th><th className="text-right px-2">Scheduled</th><th className="text-right px-2">%</th><th className="text-right px-2">Billed to date</th></tr></thead>
          <tbody>{snap.map((l, i) => <tr key={i} className="border-b border-navy-50"><Td>{l.description || <Missing />}</Td><Td r>{fmtMoney(safeNum(l.scheduled_value))}</Td><Td r>{safeNum(l.percent_complete)}%</Td><Td r>{fmtMoney(safeNum(l.billed_to_date))}</Td></tr>)}</tbody></table>
      ) : <Missing why="PayApplication.sov_snapshot.lines empty" />}
    </>
  );
}

// ---------- 3) WIP ----------
function WipTab({ wipRows }) {
  const [open, setOpen] = useState(false);
  const T = (k) => roundCents(wipRows.reduce((s, r) => s + safeNum(r[k]), 0));
  const table = (
    <table className="w-full text-[12px]">
      <thead className="bg-navy-50"><tr><Th>Job</Th><Th r>Contract</Th><Th r>EAC</Th><Th r>Cost to date</Th><Th r>% complete</Th><Th r>Earned</Th><Th r>Billed</Th><Th r>Over / (Under)</Th></tr></thead>
      <tbody>{wipRows.map((r) => (
        <tr key={r.id} className="border-b border-navy-50">
          <Td className="font-semibold text-navy-900">{r.name}</Td>
          <Td r><Fig value={r.contract} missing={r.contractMissing} source="Project.budget + Σ ChangeOrder.cost_impact (approved|executed)" why="Project.budget not set" /></Td>
          <Td r><Fig value={r.eac} missing={r.eacMissing} source="Project.projected_final_cost, else cost + Project.cost_to_complete" why="No EAC on project" /></Td>
          <Td r><Fig value={r.cost} source="Σ Expense.amount (all statuses)" /></Td>
          <Td r>{r.eacMissing ? <Missing why="needs EAC" /> : `${(r.pct * 100).toFixed(1)}%`}<SourceTag source="cost to date ÷ EAC, capped at 100%" /></Td>
          <Td r><Fig value={r.earned} missing={r.eacMissing || r.contractMissing} source="% complete × contract" /></Td>
          <Td r><Fig value={r.billed} source="Σ SalesInvoice.total_amount (status ≠ draft)" /></Td>
          <Td r className={r.overUnder > 0.005 ? 'text-amber-700 font-semibold' : r.overUnder < -0.005 ? 'text-navy-700' : ''}>
            {r.eacMissing ? <Missing why="needs EAC" /> : <>{r.overUnder < 0 ? `(${fmtMoney(-r.overUnder)})` : fmtMoney(r.overUnder)}<span className="ml-1 text-[10px]">{r.overUnder > 0.005 ? 'Over' : r.overUnder < -0.005 ? 'Under' : ''}</span></>}<SourceTag source="billed − earned" />
          </Td>
        </tr>))}
        {!wipRows.length && <tr><Td className="text-slate-400">No projects</Td></tr>}
      </tbody>
      {wipRows.length > 0 && <tfoot><tr className="bg-navy-900 text-white font-semibold"><Td>Totals</Td><Td r>{fmtMoney(T('contract'))}</Td><Td r>{fmtMoney(T('eac'))}</Td><Td r>{fmtMoney(T('cost'))}</Td><Td /><Td r>{fmtMoney(T('earned'))}</Td><Td r>{fmtMoney(T('billed'))}</Td><Td r>{fmtMoney(T('overUnder'))}</Td></tr></tfoot>}
    </table>
  );
  return (
    <Card title="Work in progress · billed vs earned" icon={Calculator} right={<Button size="sm" onClick={() => setOpen(true)} className="no-print gap-1.5 bg-navy-900 hover:bg-navy-700 text-white"><Eye className="h-4 w-4 text-gold-500" />Preview WIP PDF</Button>}>
      <div className="overflow-x-auto">{table}</div>
      <p className="mt-3 text-[11px] text-slate-500">Math matches the fixed WIP report in Job Costing (cost-to-cost). Jobs without an EAC show MISSING instead of 0% complete.</p>
      <DocumentPreview open={open} onOpenChange={setOpen} title="WIP Report" filename={`GSIS-WIP-${todayISO()}.pdf`} email={{ subject: `GSIS WIP Report ${fmtDate(todayISO())}`, body: 'Attached is the current WIP report.' }}>
        <GSISLetterhead docTitle="WIP Report" docDate={fmtDate(todayISO())} />{table}
      </DocumentPreview>
    </Card>
  );
}

// ---------- 4) SOV & Pay Apps ----------
function SovTab({ projects, sovs, changeOrders, payApps }) {
  const qc = useQueryClient();
  const withSov = projects.filter((p) => sovs.some((s) => s.project_id === p.id));
  const [pid, setPid] = useState('');
  const projectId = pid || withSov[0]?.id || '';
  const project = projects.find((p) => p.id === projectId);
  const sov = sovs.find((s) => s.project_id === projectId);
  const [edits, setEdits] = useState({}); // { [sovId]: { [lineIdx]: pct } }
  const [open, setOpen] = useState(false);
  const draftSov = sov ? { ...sov, line_items: (sov.line_items || []).map((l, i) => (edits[sov.id]?.[i] !== undefined ? { ...l, percent_complete: edits[sov.id][i] } : l)) } : null;
  const pa = draftSov ? buildPayApp({ sov: draftSov, project, changeOrders, payApps }) : null;
  const dirty = !!(sov && edits[sov.id] && Object.keys(edits[sov.id]).length);
  const appNo = pa ? String(pa.nextAppNo) : '';

  const saveSov = useMutation({
    mutationFn: async () => base44.entities.ScheduleOfValues.update(sov.id, await stampUpdate({ line_items: draftSov.line_items })),
    onSuccess: () => { setEdits((e) => ({ ...e, [sov.id]: {} })); qc.invalidateQueries({ queryKey: ['fin', 'ScheduleOfValues'] }); toast.success('SOV % complete saved'); },
    onError: (e) => toast.error('Save failed: ' + (e.message || '')),
  });
  // Saves a DRAFT PayApplication only. No SalesInvoice, no status change, no SOV billed_to_date roll-forward.
  const saveDraft = useMutation({
    mutationFn: async () => base44.entities.PayApplication.create(await stampCreate({
      organization_id: project?.organization_id, project_id: projectId, application_number: appNo, period: todayISO(),
      total_completed_value: pa.completed, retention_percent: pa.retPct, retention_amount: pa.retainage, net_amount_due: pa.currentDue,
      sov_snapshot: { lines: draftSov.line_items, g702: { ...pa, lines: undefined } }, status: 'draft',
    })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fin', 'PayApplication'] }); toast.success(`Draft pay app #${appNo} saved (not submitted)`); setOpen(false); },
    onError: (e) => toast.error('Save failed: ' + (e.message || '')),
  });

  return (
    <div className="space-y-4">
      <Card title="Schedule of values" icon={ListChecks} right={
        <select value={projectId} onChange={(e) => setPid(e.target.value)} className="no-print h-10 sm:h-8 w-full sm:w-auto max-w-full sm:max-w-[260px] truncate rounded-md ring-1 ring-navy-100 text-[12px] px-2">
          {withSov.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          {!withSov.length && <option value="">No project has an SOV</option>}
        </select>}>
        {!sov ? <div className="text-slate-500 text-[13px]"><Missing why="no ScheduleOfValues record" /> Create the SOV on the project&apos;s SOV tab first.</div> : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="min-w-0">
              <div className="space-y-2 block sm:hidden">{pa.lines.map((l, i) => (
                <div key={i} className="rounded-lg ring-1 ring-navy-100 p-3 text-[12px] space-y-1">
                  <div className="font-semibold text-navy-900">{l.no}. {l.description}{l.cost_code && <span className="ml-1 text-[10px] font-normal text-slate-400">{l.cost_code}</span>}</div>
                  <div className="flex justify-between gap-2"><span className="text-slate-500">Billable Amount</span><Fig value={l.scheduled} source="ScheduleOfValues.line_items[].scheduled_value" /></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-500">Prev. billed</span><Fig value={l.previous} source="ScheduleOfValues.line_items[].billed_to_date" /></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-500">Remaining Balance</span><Fig value={(l.scheduled == null || l.previous == null) ? null : roundCents(Number(l.scheduled) - Number(l.previous))} source="billable amount − billed to date" /></div>
                  <label className="block pt-1"><span className="text-[10px] font-bold uppercase tracking-wider text-navy-700">% complete</span>
                    <input type="number" inputMode="decimal" min={0} max={100} step="0.5" value={l.pct} onChange={(e) => setEdits((x) => ({ ...x, [sov.id]: { ...(x[sov.id] || {}), [i]: Math.max(0, Math.min(100, Number(e.target.value))) } }))} className="mt-1 w-full h-10 text-right rounded ring-1 ring-navy-100 focus:ring-2 focus:ring-gold-500 outline-none px-2 text-[14px]" /></label>
                </div>))}</div>
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-navy-50"><tr><Th>#</Th><Th>Description</Th><Th r>Billable Amount</Th><Th r>% complete</Th><Th r>Prev. billed</Th><Th r>Remaining Balance</Th></tr></thead>
                <tbody>{pa.lines.map((l, i) => (
                  <tr key={i} className="border-b border-navy-50">
                    <Td>{l.no}</Td><Td>{l.description}{l.cost_code && <span className="ml-1 text-[10px] text-slate-400">{l.cost_code}</span>}</Td>
                    <Td r><Fig value={l.scheduled} source="ScheduleOfValues.line_items[].scheduled_value" /></Td>
                    <Td r><input type="number" min={0} max={100} step="0.5" value={l.pct} onChange={(e) => setEdits((x) => ({ ...x, [sov.id]: { ...(x[sov.id] || {}), [i]: Math.max(0, Math.min(100, Number(e.target.value))) } }))} className="w-16 h-7 text-right rounded ring-1 ring-navy-100 focus:ring-2 focus:ring-gold-500 outline-none px-1" />%</Td>
                    <Td r><Fig value={l.previous} source="ScheduleOfValues.line_items[].billed_to_date" /></Td>
                    <Td r><Fig value={(l.scheduled == null || l.previous == null) ? null : roundCents(Number(l.scheduled) - Number(l.previous))} source="billable amount − billed to date" /></Td>
                  </tr>))}</tbody>
              </table>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 no-print">
                <Button size="sm" variant="outline" disabled={!dirty || saveSov.isPending} onClick={() => saveSov.mutate()} className="gap-1.5 w-full sm:w-auto"><Save className="h-4 w-4" />Save % complete</Button>
                <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 w-full sm:w-auto bg-navy-900 hover:bg-navy-700 text-white"><Eye className="h-4 w-4 text-gold-500" />Preview G702 / G703</Button>
                {pa.sovVsBudget !== null && Math.abs(pa.sovVsBudget) > 0.005 && <span className="basis-full text-[11px] text-amber-700">SOV total differs from Project.budget by {fmtMoney(pa.sovVsBudget)}</span>}
              </div>
            </div>
            <div className="hidden md:block rounded-lg ring-1 ring-navy-100 bg-slate-100 p-3 max-h-[560px] overflow-auto">
              <div className="text-[10px] font-bold uppercase tracking-wider text-navy-700 mb-2 no-print">Live preview</div>
              <div className="bg-white shadow p-5 origin-top scale-[0.92]"><G702 pa={pa} project={project} appNo={appNo} /><G703 pa={pa} /></div>
            </div>
          </div>)}
      </Card>
      {pa && (
        <DocumentPreview open={open} onOpenChange={setOpen} title={`Pay Application #${appNo}`} filename={`GSIS-PayApp-${(project?.name || 'job').replace(/\W+/g, '-')}-${appNo}.pdf`}
          email={{ to: project?.client_email || '', subject: `GSIS Pay Application #${appNo} · ${project?.name || ''}`, body: `Please find attached Application for Payment #${appNo} for ${project?.name || ''}.` }}
          footer={<span className="flex items-center gap-2">Preview only. <Button size="sm" variant="outline" disabled={saveDraft.isPending || pa.currentDue === null} onClick={() => saveDraft.mutate()} className="gap-1.5 h-7"><Save className="h-3.5 w-3.5" />Save as draft pay app</Button><span className="text-slate-500">(status stays draft; nothing is submitted)</span></span>}>
          <G702 pa={pa} project={project} appNo={appNo} /><div style={{ pageBreakBefore: 'always' }} /><G703 pa={pa} />
        </DocumentPreview>
      )}
    </div>
  );
}
function Row({ n, label, children }) {
  return <div className="flex justify-between border-b border-navy-50 py-1"><span><span className="inline-block w-5 text-navy-500">{n}.</span>{label}</span>{children}</div>;
}
function G702({ pa, project, appNo }) {
  return (
    <div className="mb-6">
      <GSISLetterhead docTitle="Application & Certificate for Payment" docNo={`${appNo} (G702-style)`} docDate={`Period to ${fmtDate(todayISO())}`} />
      <div className="grid grid-cols-2 gap-4 mb-3 text-[11px]">
        <div><b className="text-navy-900">To owner:</b> {project?.client_name || <Missing />}<br /><b className="text-navy-900">Project:</b> {project?.name || <Missing />}<br />{project?.address || <Missing why="Project.address" />}</div>
        <div><b className="text-navy-900">From contractor:</b> Golden State Integrated Systems<br /><b className="text-navy-900">Architect:</b> <Missing why="no architect field" /><br /><b className="text-navy-900">Contract date:</b> {fmtDate(project?.start_date) || <Missing why="no contract date; Project.start_date empty" />}</div>
      </div>
      <div className="text-[12px]">
        <Row n={1} label="Original contract sum"><Fig value={pa.originalSum} source="Σ ScheduleOfValues.line_items[].scheduled_value" /></Row>
        <Row n={2} label="Net change by change orders"><Fig value={pa.coNet} source="Σ ChangeOrder.cost_impact (approved|executed) for project" /></Row>
        <Row n={3} label="Contract sum to date"><Fig value={pa.contractSum} source="line 1 + line 2" /></Row>
        <Row n={4} label="Total completed & stored to date"><Fig value={pa.completed} source="Σ scheduled_value × percent_complete/100 (G703 col G)" /></Row>
        <Row n={5} label={`Retainage (${pa.retPct === null ? 'MISSING' : pa.retPct + '%'} of completed work)`}><Fig value={pa.retainage} missing={pa.retainage === null} source="line 4 × ScheduleOfValues.retention_percent" /></Row>
        <Row n={6} label="Total earned less retainage"><Fig value={pa.earnedLessRet} missing={pa.earnedLessRet === null} source="line 4 − line 5" /></Row>
        <Row n={7} label="Less previous certificates for payment"><Fig value={pa.previousCerts} source="Σ PayApplication.net_amount_due (non-draft, this project)" /></Row>
        <div className="flex justify-between bg-navy-900 text-white font-bold px-2 py-1.5 mt-1 rounded"><span>8. Current payment due</span><Fig value={pa.currentDue} missing={pa.currentDue === null} source="line 6 − line 7" /></div>
        <Row n={9} label="Balance to finish, including retainage"><Fig value={pa.balanceToFinish} source="line 3 − line 4" /></Row>
      </div>
      {pa.coNet !== 0 && <p className="text-[10px] text-amber-700 mt-1">Change orders are not lines on the SOV; G703 column C excludes them.</p>}
      <div className="grid grid-cols-2 gap-6 mt-6 text-[11px]">
        <div>Contractor: Golden State Integrated Systems<br /><div className="border-b border-slate-400 h-6 mt-3" />Kemar McKenzie · Date ________</div>
        <div>Notary / Architect certification<br /><div className="border-b border-slate-400 h-6 mt-3" /><Missing why="not tracked" /></div>
      </div>
    </div>
  );
}
function G703({ pa }) {
  return (
    <div>
      <div className="text-[13px] font-bold text-navy-900 mb-1">Continuation Sheet (G703-style)</div>
      <table className="w-full text-[10px]">
        <thead className="bg-navy-900 text-white"><tr>{['A Item', 'B Description', 'C Scheduled', 'D Previous', 'E This period', 'F Stored', 'G Completed', '% (G/C)', 'H Balance', 'I Retainage'].map((h, i) => <th key={h} className={`px-1.5 py-1 ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
        <tbody>{pa.lines.map((l) => (
          <tr key={l.no} className="border-b border-navy-50">
            <Td>{l.no}</Td><Td>{l.description}</Td><Td r>{fmtMoney(l.scheduled)}</Td><Td r>{fmtMoney(l.previous)}</Td>
            <Td r className={l.thisPeriod < 0 ? 'text-red-700' : ''}>{l.thisPeriod < 0 ? `(${fmtMoney(-l.thisPeriod)})` : fmtMoney(l.thisPeriod)}</Td>
            <Td r><Missing why="no materials-stored field" /></Td><Td r>{fmtMoney(l.completed)}</Td><Td r>{l.pct}%</Td><Td r>{fmtMoney(l.balance)}</Td>
            <Td r>{l.retainage === null ? <Missing /> : fmtMoney(l.retainage)}</Td>
          </tr>))}</tbody>
        <tfoot><tr className="bg-navy-50 font-bold text-navy-900"><Td /><Td>Totals</Td><Td r>{fmtMoney(pa.originalSum)}</Td><Td r>{fmtMoney(pa.previousTotal)}</Td><Td r>{fmtMoney(pa.thisPeriodTotal)}</Td><Td /><Td r>{fmtMoney(pa.completed)}</Td><Td r>{pa.originalSum ? ((pa.completed / pa.originalSum) * 100).toFixed(1) + '%' : ''}</Td><Td r>{fmtMoney(roundCents(pa.originalSum - pa.completed))}</Td><Td r>{pa.retainage === null ? '' : fmtMoney(pa.retainage)}</Td></tr></tfoot>
      </table>
      <p className="mt-2 text-[9px] text-slate-500">Sources: ScheduleOfValues.line_items[] (scheduled_value, percent_complete, billed_to_date), ScheduleOfValues.retention_percent. Column D uses billed_to_date. Negative E means % complete fell below what was already billed.</p>
    </div>
  );
}

// ---- Legacy page (original src/pages/AIABilling.jsx, unchanged except Card alias) ----

/** AIA Billing – G702/G703 Pay Applications. */
function LegacyAIABilling() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedForms, setUploadedForms] = useState([
    { id: '1', name: 'G702-Template.pdf', uploadedDate: '2026-02-20', type: 'G702' },
    { id: '2', name: 'G703-Template.pdf', uploadedDate: '2026-02-19', type: 'G703' }
  ]);

  const payApps = [
    { id: '1', period: 'January 2025', contractSum: 500000, previousCert: 0, currentCert: 45000, retainage: 2250, status: 'approved' },
    { id: '2', period: 'February 2025', contractSum: 500000, previousCert: 45000, currentCert: 52000, retainage: 2600, status: 'pending' }
  ];

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadForm = () => {
    if (selectedFile) {
      const newForm = {
        id: Date.now().toString(),
        name: selectedFile.name,
        uploadedDate: new Date().toISOString().split('T')[0],
        type: selectedFile.name.includes('G702') ? 'G702' : 'G703'
      };
      setUploadedForms([...uploadedForms, newForm]);
      setSelectedFile(null);
      setShowUploadDialog(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 break-words">AIA Billing</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Generate and manage G702/G703 pay applications</p>
        </div>
        <Button size="lg" className="w-full sm:w-auto sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> New Pay App
        </Button>
      </div>

      {/* Upload Forms Section */}
      <UICard>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" /> AIA Form Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(!showUploadDialog)}
              className="w-full sm:w-auto sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" /> Upload Form Template
            </Button>
          </div>

          {/* Upload Dialog */}
          {showUploadDialog && (
            <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 bg-slate-50">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Upload G702 or G703 PDF Template</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4 file:rounded-md
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="text-xs sm:text-sm text-slate-600">Selected: {selectedFile.name}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleUploadForm}
                    disabled={!selectedFile}
                  >
                    Upload
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Forms List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Your Templates</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-2">
              {uploadedForms.map((form) => (
                <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{form.name}</p>
                      <p className="text-xs text-slate-500">{form.type} • {form.uploadedDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </UICard>

      {/* Pay Applications Card */}
      <UICard>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Pay Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile View - Cards */}
          <div className="block sm:hidden space-y-3">
            {payApps.map((row) => (
              <div key={row.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{row.period}</p>
                    <Badge variant={row.status === 'approved' ? 'default' : 'secondary'} className="text-xs mt-1">
                      {row.status}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm text-slate-900 text-right">
                    ${row.currentCert.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Contract</p>
                    <p className="font-medium">${(row.contractSum / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Prev. Cert</p>
                    <p className="font-medium">${(row.previousCert / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Retainage</p>
                    <p className="font-medium">${(row.retainage / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full sm:w-auto text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Period</th>
                  <th className="text-right p-3 font-medium text-slate-700">Contract Sum</th>
                  <th className="text-right p-3 font-medium text-slate-700">Previous Cert.</th>
                  <th className="text-right p-3 font-medium text-slate-700">Current Cert.</th>
                  <th className="text-right p-3 font-medium text-slate-700">Retainage</th>
                  <th className="text-center p-3 font-medium text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {payApps.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 text-slate-900 font-medium">{row.period}</td>
                    <td className="p-3 text-right text-slate-900">${row.contractSum.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-900">${row.previousCert.toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold text-slate-900">${row.currentCert.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-900">${row.retainage.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <Badge variant={row.status === 'approved' ? 'default' : 'secondary'}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500">
            <strong>G702:</strong> Application and Certificate for Payment • <strong>G703:</strong> Continuation Sheet
          </p>
        </CardContent>
      </UICard>
    </div>
  );
}

// ---- Role gate: same admin check as Layout/LayoutMobile (useAuth user?.role === 'admin') ----
export default function AIABilling() {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth || !user) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  return user.role === 'admin' ? <FinancialsHub /> : <LegacyAIABilling />;
}
