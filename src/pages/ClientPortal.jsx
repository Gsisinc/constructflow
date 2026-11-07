import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { fmtDate } from '@/lib/dates';
import { buildSlaTag, sortTicketsByUrgency } from '@/lib/serviceDesk';
import { toast } from 'sonner';

const asList = r => Array.isArray(r) ? r : Array.isArray(r?.items) ? r.items : [];
const norm = x => String(x || '').trim().toLowerCase();
const INTERNAL = new Set(['internal', 'staff', 'admin', 'private', 'staff_only', 'staff-only']);
const MILESTONES = new Set(['milestone', 'progress', 'schedule', 'phase', 'phase_update']);
const NAV = [['overview', 'Overview'], ['projects', 'Projects'], ['invoices', 'Invoices'], ['change-orders', 'Change Orders'], ['documents', 'Documents'], ['service-requests', 'Service Requests'], ['messages', 'Messages']];
const TABS = [['overview', 'Overview'], ['photos', 'Photos'], ['documents', 'Documents'], ['change-orders', 'Change orders'], ['invoices', 'Invoices'], ['messages', 'Messages']];
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(n));
const hasNumber = n => n !== null && n !== undefined && n !== '' && Number.isFinite(Number(n));
const pretty = s => String(s || 'Not set').replace(/[_-]/g, ' ').replace(/^./, c => c.toUpperCase());
const date = d => { if (!d || !Number.isFinite(new Date(d).getTime())) return ''; try { return fmtDate(d, 'MMM d, yyyy'); } catch { return ''; } };
const https = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
const urlFrom = (r, keys) => keys.map(k => https(r[k])).find(Boolean) || '';
const visible = r => !INTERNAL.has(norm(r.visibility)) && r.is_internal !== true && !['client_visible', 'published_to_client', 'is_client_visible'].some(k => r[k] === false);
const explicitlyPublished = r => visible(r) && (['client_visible', 'published_to_client', 'is_client_visible'].some(k => r[k] === true) || ['client', 'client_visible', 'published_to_client'].includes(norm(r.visibility)));
const awaiting = r => ['client_review', 'awaiting', 'awaiting_client', 'awaiting_approval', 'pending_client_approval', 'awaiting_client_approval', 'pending_client_review'].includes(norm(r.status));
const approved = r => ['approved', 'executed'].includes(norm(r.status));
const coNumber = r => r.change_order_number || r.co_number || 'Change order';
const invoiceOpen = r => !['paid', 'draft'].includes(norm(r.status));
const milestoneDate = u => u.milestone_date || u.scheduled_date || u.target_date || u.event_date;
const stamp = d => new Date(d || 0).getTime() || 0;
const unread = (u, email) => {
  // Never equate "exists" with unread. Only explicit per-client data is counted.
  if (Array.isArray(u.unread_by)) return u.unread_by.some(e => norm(e) === norm(email));
  if (typeof u.is_read === 'boolean') return !u.is_read;
  if (typeof u.read_by_client === 'boolean') return !u.read_by_client;
  if (typeof u.is_unread === 'boolean') return u.is_unread;
  return false;
};
const photoFile = r => /\.(jpe?g|png|gif|webp|avif|heic)(\?|$)/i.test(r.file_name || r.file_url || '') || /^image\//i.test(r.file_type || r.mime_type || '');
const documentFile = r => visible(r) && !!https(r.file_url) && !/^\s*\[Folder\]/i.test(r.file_name || '') && !photoFile(r) && !/^folder:\/\//i.test(r.file_url || '');
const readTickets = async id => {
  try { return await base44.entities.ServiceTicket.filter({ project_id: id }, '-created_date'); }
  catch { return base44.entities.Issue.filter({ project_id: id }, '-created_date'); }
};
const RESOURCES = [
  { key: 'clientUpdates', entity: 'ClientUpdate', sort: '-created_date' },
  { key: 'clientChangeOrders', entity: 'PhaseChangeOrder' },
  { key: 'clientCalendarEvents', entity: 'CalendarEvent' },
  { key: 'clientServiceTickets', tickets: true },
  { key: 'clientSalesInvoices', entity: 'SalesInvoice' },
  { key: 'clientAdditionalChangeOrders', entity: 'ChangeOrder' },
  { key: 'clientPhaseFiles', entity: 'PhaseFile' },
];
const loadResource = async (resource, id) => asList(await (resource.tickets ? readTickets(id) : resource.sort ? base44.entities[resource.entity].filter({ project_id: id }, resource.sort) : base44.entities[resource.entity].filter({ project_id: id })));
function Empty({ children }) { return <p className="cp-empty">{children}</p>; }
function Panel({ title, children }) { return <section className="cp-card"><h2>{title}</h2>{children}</section>; }
function OutLink({ href, children, download }) { return href ? <a className="cp-btn" href={href} target="_blank" rel="noopener noreferrer" download={download || undefined}>{children}</a> : null; }
function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => { const d = ref.current; d?.showModal(); return () => d?.close(); }, []);
  return <dialog ref={ref} className="cp-modal" onCancel={onClose} aria-label={title}><div className="cp-modal-head"><h2>{title}</h2><button type="button" className="cp-btn" onClick={onClose} aria-label="Close dialog">✕</button></div>{children}</dialog>;
}

export default function ClientPortal() {
  const auth = useAuth();
  const { data: me, isLoading: meLoading, error: meError } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  // Role comes ONLY from AuthContext; SDK me.role is not the app role.
  const role = auth?.user?.role;
  const user = { ...me, ...auth?.user };
  const email = auth?.user?.email || me?.email;
  const organizationId = auth?.user?.organization_id || me?.organization_id;
  const isAdminPreview = role === 'admin';
  const isAdmin = isAdminPreview;
  const [params, setParams] = useSearchParams();
  const requestedView = params.get('view') || 'overview';
  const view = [...NAV.map(([v]) => v), 'project'].includes(requestedView) ? requestedView : 'overview';
  const id = params.get('id');
  const tab = TABS.some(([t]) => t === params.get('tab')) ? params.get('tab') : 'overview';
  const go = (nextView, projectId, nextTab) => { const p = new URLSearchParams(); if (nextView !== 'overview') p.set('view', nextView); if (projectId) p.set('id', projectId); if (nextTab && nextTab !== 'overview') p.set('tab', nextTab); setParams(p); };
  const href = (v, projectId, t) => { const p = new URLSearchParams({ view: v }); if (projectId) p.set('id', projectId); if (t) p.set('tab', t); return `?${p}`; };
  const navLink = (v, label, projectId, t, className = 'cp-btn') => <a className={className} href={href(v, projectId, t)} onClick={e => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); go(v, projectId, t); } }}>{label}</a>;
  const projectsQuery = useQuery({
    queryKey: ['clientProjects', email, organizationId, isAdmin],
    queryFn: async () => asList(await (isAdmin
      ? base44.entities.Project.filter({ organization_id: organizationId }, '-created_date')
      : base44.entities.Project.filter({ client_email: email }))),
    enabled: !!email && !!role && (!isAdmin || !!organizationId),
  });
  // Keep the organization query for preview, but NEVER display all organization projects.
  // No fuzzy company-name matching: only the explicit email ownership link is trusted here.
  const projects = asList(projectsQuery.data).filter(p => !!email && norm(p.client_email) === norm(email));
  const allowedIds = new Set(projects.map(p => p.id));
  const project = view === 'project' ? projects.find(p => String(p.id) === id) : null;
  const projectId = project?.id;
  // Preserve the original selected-project request paths and exact query keys.
  const selectedUpdates = useQuery({ queryKey: ['clientUpdates', projectId], queryFn: () => loadResource(RESOURCES[0], projectId), enabled: !!projectId });
  const selectedCOs = useQuery({ queryKey: ['clientChangeOrders', projectId], queryFn: () => loadResource(RESOURCES[1], projectId), enabled: !!projectId });
  const selectedCalendar = useQuery({ queryKey: ['clientCalendarEvents', projectId], queryFn: () => loadResource(RESOURCES[2], projectId), enabled: !!projectId });
  const selectedTickets = useQuery({ queryKey: ['clientServiceTickets', projectId], queryFn: () => loadResource(RESOURCES[3], projectId), enabled: !!projectId });
  // Every allowed project loads on home/dedicated pages. Shared keys deduplicate the
  // selected observers above; unauthorized URL ids never enable any request.
  const descriptors = projects.flatMap(p => RESOURCES.map(resource => ({ resource, id: p.id })));
  const results = useQueries({ queries: descriptors.map(({ resource, id: pid }) => ({ queryKey: [resource.key, pid], queryFn: () => loadResource(resource, pid), enabled: !!pid && !!email })) });
  const all = key => descriptors.flatMap((d, index) => d.resource.key === key ? asList(results[index]?.data).filter(r => !r.project_id || String(r.project_id) === String(d.id)).map(r => ({ ...r, project_id: d.id, _entity: d.resource.entity || 'ServiceTicket' })) : []);
  const updates = all('clientUpdates').filter(visible).sort((a, b) => stamp(b.created_date) - stamp(a.created_date));
  const invoices = all('clientSalesInvoices').filter(r => visible(r) && norm(r.status) !== 'draft');
  const files = all('clientPhaseFiles');
  const tickets = all('clientServiceTickets').filter(visible);
  const coMap = new Map();
  [...all('clientChangeOrders'), ...all('clientAdditionalChangeOrders')].filter(r => visible(r) && norm(r.status) !== 'draft').forEach(r => {
    const key = r.id ? `${r.project_id}:${r.id}` : `${r.project_id}:${r._entity}:${coNumber(r)}`;
    const old = coMap.get(key);
    coMap.set(key, old ? { ...(coNumber(old) !== 'Change order' ? old : r), _sources: [...old._sources, { entity: r._entity, id: r.id }] } : { ...r, _sources: [{ entity: r._entity, id: r.id }] });
  });
  const cos = [...coMap.values()];
  const scope = rows => project ? rows.filter(r => r.project_id === project.id) : rows;
  const scopedUpdates = scope(updates);
  const scopedFiles = scope(files);
  const scopedInvoices = scope(invoices);
  const scopedCOs = scope(cos);
  const projectName = pid => projects.find(p => p.id === pid)?.name || 'Project';
  const clientName = user.company_name || user.full_name || email?.split('@')[0] || 'Client';
  const pending = cos.filter(awaiting);
  const openInvoices = invoices.filter(invoiceOpen);
  const unreadCount = updates.filter(u => unread(u, email)).length;
  const activeCount = projects.filter(p => !['complete', 'completed', 'closed', 'cancelled', 'canceled'].includes(norm(p.status)) && !(hasNumber(p.progress) && Number(p.progress) >= 100)).length;
  const loading = meLoading || projectsQuery.isLoading;
  const dataLoading = results.some(r => r.isLoading);
  const dataErrors = descriptors.filter((_, i) => results[i]?.isError).map(d => `${projectName(d.id)}: ${d.resource.entity || 'ServiceTicket / Issue'}`);
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState('');
  const [messageProject, setMessageProject] = useState('');
  const [request, setRequest] = useState({ project_id: '', subject: '', description: '', priority: 'medium', category: 'service_call', target_date: '', reason: 'owner_request' });
  const [reviewNote, setReviewNote] = useState('');
  const [decisionSaved, setDecisionSaved] = useState(null);
  const [reviewReceipt, setReviewReceipt] = useState(null);
  const requireProject = pid => { if (!email || !allowedIds.has(pid)) throw new Error('Select one of your projects.'); return pid; };
  const invalidate = () => RESOURCES.forEach(r => queryClient.invalidateQueries({ queryKey: [r.key] }));
  const createCommentMutation = useMutation({
    mutationFn: data => { requireProject(data.project_id); return base44.entities.ClientUpdate.create(data); },
    onSuccess: () => { invalidate(); setMessage(''); toast.success('Message sent'); },
    onError: e => toast.error(`Message was not sent: ${e.message || ''}`),
  });
  const createChangeOrderMutation = useMutation({
    mutationFn: data => { requireProject(data.project_id); return base44.entities.PhaseChangeOrder.create(data); },
    onSuccess: () => { invalidate(); setModal(null); toast.success('Change request submitted'); },
    onError: e => toast.error(`Change request was not submitted: ${e.message || ''}`),
  });
  const createServiceTicketMutation = useMutation({
    mutationFn: async data => {
      requireProject(data.project_id);
      try { return await base44.entities.ServiceTicket.create(data); }
      catch { return base44.entities.Issue.create({ project_id: data.project_id, title: data.subject, description: data.description, severity: data.priority, status: 'open', due_date: data.target_date || null, reported_by: data.requested_by }); }
    },
    onSuccess: () => { invalidate(); setModal(null); toast.success('Service request submitted'); },
    onError: e => toast.error(`Service request was not submitted: ${e.message || ''}`),
  });
  const reviewMutation = useMutation({
    mutationFn: async ({ co, status, note, receiptOnly }) => {
      requireProject(co.project_id);
      if (!awaiting(co)) throw new Error('This change order is not awaiting your review.');
      if (status === 'pending_review' && !note.trim()) throw new Error('Add a short note for GSIS.');
      const at = receiptOnly?.at || new Date().toISOString();
      const receipt = receiptOnly || { at, status, note, coId: co.id, projectId: co.project_id };
      if (!receiptOnly) {
        // Persist status first, then an authored, timestamped audit comment. Never
        // mutate the project budget or SOV. No unverified schema fields are added.
        for (const source of co._sources) await base44.entities[source.entity].update(source.id, { status });
        setDecisionSaved(receipt);
      }
      await base44.entities.ClientUpdate.create({ project_id: co.project_id, update_type: 'comment', title: 'Client change order review', content: `${status === 'approved' ? 'Approved CO' : 'Requested changes to CO'} ${coNumber(co)}. Reviewed by ${email} at ${at}.${note ? ` Note: ${note}` : ''}`, posted_by: email, visibility: 'client' });
      return receipt;
    },
    onSuccess: receipt => { invalidate(); setReviewReceipt(receipt); setDecisionSaved(null); toast.success('Review recorded'); },
    onError: e => { invalidate(); toast.error(`Review not fully recorded: ${e.message || ''}. Check the status before retrying.`); },
  });
  const busy = m => m.isPending || m.isLoading;
  const commentPayload = (pid, text) => ({ project_id: pid, update_type: 'daily_log', title: 'Client Comment', content: text.trim(), posted_by: email, visibility: 'client' });
  const openRequest = (kind = 'service') => { setRequest({ project_id: project?.id || projects[0]?.id || '', subject: '', description: '', priority: 'medium', category: 'service_call', target_date: '', reason: 'owner_request' }); setModal({ kind }); };
  const progress = p => hasNumber(p.progress) ? Math.min(100, Math.max(0, Number(p.progress))) : null;
  const nextMilestone = p => {
    const items = updates.filter(u => u.project_id === p.id && MILESTONES.has(norm(u.update_type)));
    const upcoming = items.filter(u => stamp(milestoneDate(u)) >= Date.now()).sort((a, b) => stamp(milestoneDate(a)) - stamp(milestoneDate(b)))[0];
    const chosen = upcoming || items[0];
    return chosen ? `${upcoming ? 'Next' : 'Latest milestone'}: ${chosen.milestone_name || chosen.title || pretty(chosen.update_type)}${date(milestoneDate(chosen) || chosen.created_date) ? ` · ${date(milestoneDate(chosen) || chosen.created_date)}` : ''}` : 'No milestones published yet';
  };
  const projectCards = <div className="cp-grid cp-projects">{projects.map(p => <section className="cp-card" key={p.id}><div className="cp-row cp-no-border"><b>{p.name}</b>{updates.some(u => u.project_id === p.id && unread(u, email)) && <span className="cp-pill cp-amber">{updates.filter(u => u.project_id === p.id && unread(u, email)).length} new</span>}</div><div className="cp-muted">{p.project_type || p.description || p.current_phase || ''}</div><div className="cp-progress-label"><span className="cp-muted">Progress</span><b>{progress(p) === null ? 'Not reported' : `${progress(p)}%`}</b></div>{progress(p) !== null && <div className="cp-bar" role="progressbar" aria-label={`${p.name} progress`} aria-valuenow={progress(p)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress(p)}%`, background: progress(p) >= 100 ? '#16335C' : '#C9A227' }} /></div>}<p className="cp-muted">{nextMilestone(p)}</p>{navLink('project', 'Open project →', p.id)}</section>)}</div>;
  const invoiceLinks = inv => { const pdf = urlFrom(inv, ['pdf_url', 'file_url', 'invoice_pdf', 'invoice_pdf_url', 'document_url']); return <div className="cp-actions"><OutLink href={pdf}>View PDF</OutLink><OutLink href={pdf} download>Download PDF</OutLink></div>; };
  const pay = inv => { const payment = urlFrom(inv, ['payment_url', 'hosted_invoice_url']); if (payment) window.open(payment, '_blank', 'noopener,noreferrer'); setModal({ kind: 'invoice', record: inv }); };
  const invoiceList = rows => <>{!rows.length && <Empty>No invoices available.</Empty>}{rows.map(inv => <article className="cp-row" key={`${inv.project_id}:${inv.id}`}><div><b>{inv.invoice_number || 'Invoice'}</b><div>{hasNumber(inv.total_amount) ? money(inv.total_amount) : 'Amount not available'}{date(inv.due_date) ? ` · due ${date(inv.due_date)}` : ''}</div><div className="cp-muted">{projectName(inv.project_id)} · {pretty(inv.status)}</div>{invoiceLinks(inv)}</div><button className="cp-btn" onClick={() => pay(inv)}>{invoiceOpen(inv) ? 'Pay' : 'View'}</button></article>)}</>;
  const openReview = co => { setReviewNote(''); setDecisionSaved(null); setReviewReceipt(null); setModal({ kind: 'review', record: co }); };
  const coList = rows => <>{!rows.length && <Empty>No change orders available.</Empty>}{rows.map(co => <article className="cp-row" key={`${co.project_id}:${co.id}`}><div><b>{coNumber(co)}</b>{co.title && <div>{co.title}</div>}{co.description && <p>{co.description}</p>}{hasNumber(co.cost_impact) && <div>{money(co.cost_impact)}</div>}<span className="cp-muted">{projectName(co.project_id)}</span></div><div className="cp-stack"><span className={`cp-pill ${awaiting(co) ? 'cp-amber' : approved(co) ? 'cp-green' : ''}`}>{awaiting(co) ? 'Awaiting you' : approved(co) ? 'Approved' : pretty(co.status)}</span>{awaiting(co) && <button className="cp-btn cp-primary" onClick={() => openReview(co)}>Review</button>}</div></article>)}</>;
  const docs = rows => { const records = rows.filter(documentFile); return <>{!records.length && <Empty>No project documents published yet.</Empty>}{records.map(f => <div className="cp-row" key={`${f.project_id}:${f.id}`}><div>📄 {f.file_name || f.name || 'Project document'}<div className="cp-muted">{projectName(f.project_id)}</div></div><OutLink href={https(f.file_url)}>View</OutLink></div>)}</>; };
  const photos = () => {
    const media = scopedUpdates.flatMap(u => asList(u.media_urls).map(url => ({ url: https(typeof url === 'string' ? url : url?.url), title: u.title || 'Published project photo', date: u.created_date })));
    const publishedFiles = scopedFiles.filter(f => explicitlyPublished(f) && photoFile(f)).map(f => ({ url: https(f.file_url), title: f.file_name || 'Published project photo', date: f.created_date }));
    const unique = [...new Map([...media, ...publishedFiles].filter(p => p.url).map(p => [p.url, p])).values()];
    return unique.length ? <div className="cp-grid cp-photos">{unique.map(p => <figure key={p.url}><a href={p.url} target="_blank" rel="noopener noreferrer"><img loading="lazy" src={p.url} alt={p.title} /></a><figcaption className="cp-muted">{p.title}{date(p.date) && ` · ${date(p.date)}`}</figcaption></figure>)}</div> : <Empty>No client-published photos yet.</Empty>;
  };
  const timeline = scopedUpdates.filter(u => MILESTONES.has(norm(u.update_type))).sort((a, b) => stamp(milestoneDate(a) || a.created_date) - stamp(milestoneDate(b) || b.created_date));
  const updateList = (rows, limit) => <>{!rows.length && <Empty>No client updates yet.</Empty>}{rows.slice(0, limit || rows.length).map(u => <article className="cp-row" key={`${u.project_id}:${u.id}`}><div><b>{projectName(u.project_id)}</b> — {u.title || u.milestone_name || pretty(u.update_type)}{(u.content || u.message) && <p className="cp-pre">{u.content || u.message}</p>}</div><time className="cp-muted">{date(u.created_date)}</time></article>)}</>;
  const messageComposer = () => {
    const pid = project?.id || messageProject || projects[0]?.id || '';
    return <form onSubmit={e => { e.preventDefault(); if (message.trim()) createCommentMutation.mutate(commentPayload(pid, message)); }}><h2>Message GSIS</h2>{!project && <label>Project<select required value={pid} onChange={e => setMessageProject(e.target.value)}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}<label className="cp-sr" htmlFor="cp-message">Message</label><textarea id="cp-message" placeholder="Ask your project team…" value={message} onChange={e => setMessage(e.target.value)} required maxLength={10000} /><div className="cp-actions"><button type="submit" className="cp-btn cp-primary" disabled={!allowedIds.has(pid) || !message.trim() || busy(createCommentMutation)}>{busy(createCommentMutation) ? 'Sending…' : 'Send'}</button><button type="button" className="cp-btn" onClick={() => openRequest()}>Request service</button></div><p className="cp-muted">Sends a real message to your project team.</p></form>;
  };
  const ticketsList = () => <>{!tickets.length && <Empty>No service requests submitted.</Empty>}{sortTicketsByUrgency([...tickets]).map(t => { const sla = buildSlaTag({ priority: t.priority || t.severity || 'medium', dueAt: t.sla_due_at || t.due_date }); return <article className="cp-row" key={`${t.project_id}:${t.id}`}><div><b>{t.subject || t.title || 'Service request'}</b><p className="cp-pre">{t.description}</p><div className="cp-muted">{projectName(t.project_id)}{date(t.target_date || t.due_date) && ` · Target ${date(t.target_date || t.due_date)}`}</div><div className="cp-actions"><span className="cp-pill">{pretty(t.status)}</span><span className="cp-pill">{pretty(t.priority || t.severity)}</span><span className={`cp-pill ${sla.badgeClass || ''}`}>{sla.label}</span></div></div></article>; })}</>;
  const selectedError = [selectedUpdates, selectedCOs, selectedCalendar, selectedTickets].some(q => q.isError);
  return <div className="cp-root fixed inset-0 z-40">
    <style>{CSS}</style>
    <aside className="cp-sidebar"><div className="cp-logo">MY<b>GSIS</b> <small>Client</small></div><nav aria-label="Client navigation">{NAV.map(([v, label]) => <React.Fragment key={v}>{navLink(v, label, null, null, `cp-nav-item ${view === v || (view === 'project' && v === 'projects') ? 'cp-on' : ''}`)}</React.Fragment>)}</nav></aside>
    <div className="cp-body"><header className="cp-phone-head"><div className="cp-logo">MY<b>GSIS</b> <small>Client</small></div><b>{clientName}</b><div className="cp-actions"><span className="cp-pill cp-amber">{pending.length} CO{pending.length === 1 ? '' : 's'} to approve</span><span className="cp-pill">{unreadCount} unread updates</span></div><label className="cp-sr" htmlFor="cp-mobile-section">Portal section</label><select id="cp-mobile-section" aria-label="Portal section" value={view === 'project' ? 'projects' : view} onChange={e => go(e.target.value)}>{NAV.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></header>
    <main className="cp-main">
      {isAdminPreview && <p className="cp-muted">Admin preview — viewing as client</p>}
      {view !== 'project' && <div className="cp-top"><div><h1>{view === 'overview' ? `Welcome, ${clientName}` : NAV.find(([v]) => v === view)?.[1]}</h1>{view === 'overview' && projects.length > 0 && <div className="cp-muted">{projects.length} projects with Golden State Integrated Systems</div>}</div><button className="cp-btn cp-gold cp-desktop-service" onClick={() => openRequest()}>+ New service request</button></div>}
      {(meError || projectsQuery.isError || (isAdmin && !organizationId)) && <div role="alert" className="cp-alert">Unable to load your project access. No project records are displayed without an ownership match.</div>}
      {(dataErrors.length > 0 || selectedError) && <div role="alert" className="cp-alert">Some records could not be loaded. Totals may be incomplete. {dataErrors.join('; ')} <button className="cp-btn" onClick={invalidate}>Retry</button></div>}
      {loading ? <Empty>Loading your portal…</Empty> : <>
        {dataLoading && <p role="status" className="cp-muted">Loading project records — totals may be incomplete…</p>}
        {view === 'overview' && <div className="cp-grid cp-kpis">{[['Active projects', activeCount], ['Unread updates', unreadCount], ['Open invoices', money(openInvoices.reduce((sum, i) => sum + (hasNumber(i.total_amount) ? Number(i.total_amount) : 0), 0))], ['COs awaiting you', pending.length]].map(([label, value]) => <section className="cp-card cp-kpi" key={label}><span className="cp-muted">{label}</span><b>{value}</b></section>)}</div>}
        {projects.length === 0 && <Panel title="No Projects Found"><Empty>You don't have any active projects yet. Contact GSIS if you expected to see a project.</Empty></Panel>}
        {(view === 'overview' || view === 'projects') && projectCards}
        {view === 'overview' && <><button className="cp-btn cp-gold cp-phone-service" onClick={() => openRequest()}>+ Service request</button><div className="cp-grid cp-columns"><Panel title="Latest updates">{updateList(updates, 6)}</Panel><Panel title="Needs your action">{!pending.length && !openInvoices.length && <Empty>Nothing needs your action right now.</Empty>}{coList(pending)}{invoiceList(openInvoices)}</Panel></div></>}
        {view === 'invoices' && <Panel title="Your invoices">{invoiceList(scopedInvoices)}</Panel>}
        {view === 'change-orders' && <Panel title="Your change orders"><button className="cp-btn" disabled={!projects.length} onClick={() => openRequest('change')}>Request change</button>{coList(scopedCOs)}</Panel>}
        {view === 'documents' && <Panel title="Your documents">{docs(scopedFiles)}</Panel>}
        {view === 'service-requests' && <Panel title="Service & maintenance"><button className="cp-btn cp-gold" onClick={() => openRequest()}>+ New service request</button>{ticketsList()}</Panel>}
        {view === 'messages' && <div className="cp-grid cp-columns"><Panel title="Project communications">{updateList(scopedUpdates)}</Panel><section className="cp-card">{messageComposer()}</section></div>}
        {view === 'project' && (!project ? <Panel title="Project unavailable"><Empty>This project is not linked to your client account.</Empty>{navLink('projects', 'Your projects')}</Panel> : <>
          <div className="cp-hero"><div className="cp-hero-kicker">PROJECT{project.project_type ? ` · ${project.project_type}` : ''}</div><h1>{project.name}</h1><div className="cp-hero-meta">{progress(project) !== null && <span>{progress(project)}% complete</span>}{project.end_date && <span>Target completion {date(project.end_date)}</span>}{project.project_manager && <span>GSIS PM: {typeof project.project_manager === 'string' ? project.project_manager : project.project_manager.full_name || project.project_manager.name || 'Not listed'}</span>}</div></div>
          <nav className="cp-tabs" aria-label="Project tabs">{TABS.map(([t, label]) => <React.Fragment key={t}>{navLink('project', label, project.id, t, tab === t ? 'cp-tab cp-selected' : 'cp-tab')}</React.Fragment>)}</nav>
          {tab === 'overview' && <div className="cp-grid cp-columns"><div className="cp-stack"><Panel title="Timeline">{!timeline.length && <Empty>No milestones published yet.</Empty>}<ol className="cp-timeline">{timeline.map(u => <li key={u.id} className={stamp(milestoneDate(u)) > Date.now() ? 'cp-next' : ''}><b>{u.milestone_name || u.phase_name || u.title || pretty(u.update_type)}</b> <span className="cp-muted">{date(milestoneDate(u) || u.created_date)}{stamp(milestoneDate(u)) > Date.now() ? ' · upcoming' : !milestoneDate(u) ? ' · published update' : ''}</span>{(u.content || u.message) && <p className="cp-pre">{u.content || u.message}</p>}</li>)}</ol></Panel><Panel title="Photo feed">{photos()}</Panel></div><div className="cp-stack"><Panel title="Documents">{docs(scopedFiles)}</Panel><Panel title="Change orders">{coList(scopedCOs)}<button className="cp-btn" onClick={() => openRequest('change')}>Request change</button></Panel><section className="cp-card">{messageComposer()}</section></div></div>}
          {tab === 'photos' && <Panel title="Photo feed">{photos()}</Panel>}
          {tab === 'documents' && <Panel title="Documents">{docs(scopedFiles)}</Panel>}
          {tab === 'change-orders' && <Panel title="Change orders">{coList(scopedCOs)}<button className="cp-btn" onClick={() => openRequest('change')}>Request change</button></Panel>}
          {tab === 'invoices' && <Panel title="Invoices">{invoiceList(scopedInvoices)}</Panel>}
          {tab === 'messages' && <div className="cp-grid cp-columns"><Panel title="Project communications">{updateList(scopedUpdates)}</Panel><section className="cp-card">{messageComposer()}</section></div>}
        </>)}
      </>}
      <footer className="cp-footer">Golden State Integrated Systems · Client Portal</footer>
    </main></div>
    <nav className="cp-bottom" aria-label="Client mobile navigation">{[['overview', '⌂', 'Home'], ['projects', '▣', 'Projects'], ['invoices', '$', 'Invoices'], ['messages', '☏', 'Messages']].map(([v, icon, label]) => <a key={v} href={href(v)} aria-current={view === v || view === 'project' && v === 'projects' ? 'page' : undefined} onClick={e => { e.preventDefault(); go(v); }}><span aria-hidden="true">{icon}</span>{label}</a>)}</nav>
    {modal?.kind === 'invoice' && <Modal title={modal.record.invoice_number || 'Invoice detail'} onClose={() => setModal(null)}><p>{projectName(modal.record.project_id)}</p><p><b>{hasNumber(modal.record.total_amount) ? money(modal.record.total_amount) : 'Amount not available'}</b> · {pretty(modal.record.status)}</p>{modal.record.invoice_date && <p>Invoice date: {date(modal.record.invoice_date)}</p>}{modal.record.due_date && <p>Due: {date(modal.record.due_date)}</p>}{modal.record.payment_terms && <p>Terms: {modal.record.payment_terms}</p>}{invoiceLinks(modal.record)}{!urlFrom(modal.record, ['pdf_url', 'file_url', 'invoice_pdf', 'invoice_pdf_url', 'document_url']) && <Empty>No PDF is attached to this invoice.</Empty>}{urlFrom(modal.record, ['payment_url', 'hosted_invoice_url']) ? <OutLink href={urlFrom(modal.record, ['payment_url', 'hosted_invoice_url'])}>Open existing payment link</OutLink> : <p className="cp-muted">No online payment link is attached. Contact GSIS to arrange payment. No payment has been processed by this portal.</p>}</Modal>}
    {modal?.kind === 'review' && <Modal title={`Review ${coNumber(modal.record)}`} onClose={() => !busy(reviewMutation) && setModal(null)}><p>{modal.record.title || modal.record.description}</p>{hasNumber(modal.record.cost_impact) && <p>{money(modal.record.cost_impact)}</p>}{modal.record.schedule_impact_days != null && <p>Schedule impact: {modal.record.schedule_impact_days} days</p>}{reviewReceipt ? <div role="status"><b>Review recorded</b><p>{pretty(reviewReceipt.status)} · {email} · {date(reviewReceipt.at)}</p></div> : decisionSaved ? <div role="alert"><p>The decision was saved, but the audit comment is not confirmed. Retry only the audit comment; do not repeat the decision.</p><button className="cp-btn cp-primary" disabled={busy(reviewMutation)} onClick={() => reviewMutation.mutate({ co: modal.record, status: decisionSaved.status, note: decisionSaved.note, receiptOnly: decisionSaved })}>Retry audit comment</button></div> : <><label>Note for GSIS (required for request changes)<textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} maxLength={10000} /></label><p className="cp-muted">Your decision will be recorded with your email and timestamp. No project budget is changed here.</p><div className="cp-actions"><button className="cp-btn cp-gold" disabled={busy(reviewMutation)} onClick={() => reviewMutation.mutate({ co: modal.record, status: 'approved', note: reviewNote })}>Approve</button><button className="cp-btn" disabled={busy(reviewMutation) || !reviewNote.trim()} onClick={() => reviewMutation.mutate({ co: modal.record, status: 'pending_review', note: reviewNote })}>Request changes</button></div></>}</Modal>}
    {['service', 'change'].includes(modal?.kind) && <Modal title={modal.kind === 'service' ? 'New service request' : 'Request change'} onClose={() => setModal(null)}>{!projects.length ? <Empty>A service or change request needs a project linked to your account. Please contact GSIS.</Empty> : <form onSubmit={e => {
      e.preventDefault();
      const p = projects.find(p => p.id === request.project_id);
      if (!p) return toast.error('Select one of your projects.');
      if (modal.kind === 'service') createServiceTicketMutation.mutate({ project_id: p.id, subject: request.subject.trim(), description: request.description.trim(), priority: request.priority, category: request.category, target_date: request.target_date || null, status: 'new', requested_by: email, sla_due_at: buildSlaTag({ priority: request.priority }).due_at });
      else createChangeOrderMutation.mutate({ project_id: p.id, phase_name: p.current_phase, co_number: `CO-${Date.now()}`, description: request.description.trim(), reason: request.reason, cost_impact: 0, status: 'proposed' });
    }}><label>Project<select required value={request.project_id} onChange={e => setRequest({ ...request, project_id: e.target.value })}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{modal.kind === 'service' && <label>Subject<input required maxLength={200} value={request.subject} onChange={e => setRequest({ ...request, subject: e.target.value })} /></label>}<label>Description<textarea required maxLength={10000} value={request.description} onChange={e => setRequest({ ...request, description: e.target.value })} /></label>{modal.kind === 'service' ? <><label>Priority<select value={request.priority} onChange={e => setRequest({ ...request, priority: e.target.value })}>{['low', 'medium', 'high', 'critical'].map(v => <option key={v} value={v}>{pretty(v)}</option>)}</select></label><label>Category<select value={request.category} onChange={e => setRequest({ ...request, category: e.target.value })}>{['service_call', 'preventive_maintenance', 'warranty'].map(v => <option key={v} value={v}>{pretty(v)}</option>)}</select></label><label>Requested date (optional)<input type="date" value={request.target_date} onChange={e => setRequest({ ...request, target_date: e.target.value })} /></label></> : <><label>Reason<select value={request.reason} onChange={e => setRequest({ ...request, reason: e.target.value })}>{['owner_request', 'design_change', 'value_engineering'].map(v => <option key={v} value={v}>{pretty(v)}</option>)}</select></label><p className="cp-muted">GSIS will review scope and pricing. This request does not set a final price.</p></>}<p className="cp-muted">Submitting creates a real project record.</p><button type="submit" className="cp-btn cp-gold" disabled={!request.description.trim() || (modal.kind === 'service' && !request.subject.trim()) || busy(createServiceTicketMutation) || busy(createChangeOrderMutation)}>Submit request</button></form>}</Modal>}
  </div>;
}

const CSS = `
.cp-root{position:fixed;inset:0;z-index:40;display:flex;background:#F5F7FA;color:#111827;font:14px/1.5 Inter,system-ui,Segoe UI,sans-serif;isolation:isolate;color-scheme:light}
.cp-root *{box-sizing:border-box}.cp-root h1,.cp-root h2,.cp-root h3,.cp-root h4,.cp-root h5,.cp-root h6{color:#0B1F3A!important}.cp-root h1{font-size:22px;line-height:1.3;margin:0 0 3px;font-weight:750;color:#0B1F3A!important}.cp-root h2{font-size:15px;margin:0 0 12px;font-weight:700;color:#0B1F3A!important}.cp-root p{margin:10px 0}.cp-root button,.cp-root a,.cp-root select{touch-action:manipulation}.cp-root button:disabled{opacity:.55;cursor:not-allowed}.cp-root a{color:inherit}.cp-root :focus-visible{outline:3px solid #C9A227;outline-offset:3px}.cp-sidebar{display:none}.cp-logo{color:#fff;font-size:18px;font-weight:800}.cp-logo b{color:#C9A227}.cp-logo small{color:#CBD5E1;font-size:12px}.cp-body{flex:1;min-width:0;overflow-y:auto;overscroll-behavior:contain}.cp-phone-head{background:#0B1F3A;color:#fff;padding:18px 16px}.cp-phone-head>b{display:block;font-size:18px;margin:8px 0}.cp-phone-head select{margin-top:12px;background:#16335C;color:white;border-color:#395375}.cp-main{padding:16px 14px 104px;max-width:1700px;margin:auto}.cp-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.cp-muted{color:#6B7280;font-size:13px}.cp-grid{display:grid;gap:16px}.cp-kpis,.cp-projects{grid-template-columns:minmax(0,1fr);margin-bottom:16px}.cp-kpi b{font-size:24px;display:block}.cp-kpi:last-child b{color:#B77900}.cp-card{min-width:0;border:1px solid #E5E7EB;background:#fff;border-radius:12px;padding:16px;overflow-wrap:anywhere}.cp-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #F1F3F6;padding:12px 0}.cp-row>div:first-child{min-width:0;flex:1}.cp-row:last-child,.cp-no-border{border:0}.cp-no-border{padding:0}.cp-row time{flex-shrink:0;align-self:flex-start}.cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:9px 15px;border-radius:8px;border:1px solid #E5E7EB;background:#fff;color:#111827;font:600 13px/1.4 Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;flex-shrink:0;text-align:center}.cp-root .cp-primary{background:#0B1F3A;border-color:#0B1F3A;color:white}.cp-root .cp-gold{background:#C9A227;border-color:#C9A227;color:#0B1F3A}.cp-desktop-service{display:none}.cp-phone-service{width:100%;margin-bottom:16px}.cp-pill{display:inline-block;font-size:11px;font-weight:600;background:#E0E7F1;color:#16335C;border-radius:99px;padding:3px 9px;white-space:normal}.cp-root .cp-amber{background:#FEF3C7;color:#92400E}.cp-root .cp-green{background:#DCFCE7;color:#166534}.cp-progress-label{display:flex;justify-content:space-between;gap:12px;margin:14px 0 6px}.cp-bar{height:8px;border-radius:9px;background:#E5E7EB;overflow:hidden}.cp-bar i{display:block;height:100%;background:#C9A227}.cp-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cp-stack{display:flex;flex-direction:column;gap:16px}.cp-hero{background:#0B1F3A;color:#fff;border-radius:12px;padding:20px;border-bottom:3px solid #C9A227}.cp-hero h1,.cp-hero h2,.cp-hero h3,.cp-hero-meta,.cp-hero-meta span{color:#fff!important}.cp-hero-kicker{color:#C9A227!important;font-size:12px;text-transform:uppercase}.cp-hero-meta{display:flex;flex-wrap:wrap;gap:12px 30px;margin-top:12px}.cp-tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid #E5E7EB;margin:16px 0}.cp-tab{white-space:nowrap;text-decoration:none;padding:12px;min-height:44px;font-weight:600;color:#6B7280!important;border-bottom:2px solid transparent}.cp-root .cp-selected{color:#0B1F3A!important;border-bottom-color:#C9A227}.cp-timeline{list-style:none;padding:0 0 0 14px;border-left:2px solid #E5E7EB;margin:0 0 0 6px}.cp-timeline li{position:relative;padding:0 0 16px}.cp-timeline li:before{content:'';position:absolute;left:-20px;top:6px;width:10px;height:10px;border-radius:99px;background:#16335C}.cp-timeline .cp-next:before{background:#C9A227}.cp-photos{grid-template-columns:repeat(2,minmax(0,1fr))}.cp-photos figure{margin:0;min-width:0}.cp-photos img{width:100%;height:120px;border-radius:8px;object-fit:cover}.cp-pre{white-space:pre-wrap}.cp-empty{color:#6B7280;padding:18px 0}.cp-alert{padding:14px;background:#FEF3C7;color:#78350F;border-radius:8px;margin-bottom:16px}.cp-bottom{position:absolute;bottom:0;left:0;right:0;background:white;border-top:1px solid #E5E7EB;display:flex;justify-content:space-around;padding:7px 0 calc(7px + env(safe-area-inset-bottom));z-index:2}.cp-bottom a{min-height:44px;min-width:65px;text-align:center;display:flex;flex-direction:column;justify-content:center;font-size:11px;color:#6B7280;text-decoration:none}.cp-bottom a span{font-size:18px}.cp-bottom a[aria-current=page]{color:#0B1F3A;font-weight:700}.cp-footer{padding-top:28px;color:#6B7280;font-size:12px}.cp-modal{position:fixed;inset:0;margin:auto;width:min(560px,calc(100vw - 28px));max-height:85dvh;overflow:auto;border:1px solid #E5E7EB;border-radius:14px;padding:20px;background:white;color:#111827}.cp-modal::backdrop{background:rgba(11,31,58,.6)}.cp-modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.cp-root label{display:block;font-size:13px;font-weight:600;margin:12px 0}.cp-root input,.cp-root textarea,.cp-root select{display:block;width:100%;min-height:44px;border:1px solid #D1D5DB;border-radius:8px;padding:10px;font:inherit;margin-top:5px}.cp-root textarea{min-height:88px;resize:vertical}.cp-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
@media(min-width:768px){.cp-sidebar{display:block;width:232px;flex-shrink:0;background:#0B1F3A;color:#CBD5E1;padding:20px 14px;overflow:auto}.cp-sidebar .cp-logo{margin-bottom:24px}.cp-nav-item{display:flex;align-items:center;min-height:44px;padding:9px 12px;border-radius:8px;color:#CBD5E1!important;text-decoration:none;margin:2px 0;border-left:3px solid transparent}.cp-root .cp-on{background:#16335C;color:white!important;border-left-color:#C9A227}.cp-phone-head,.cp-bottom,.cp-phone-service{display:none}.cp-desktop-service{display:inline-flex}.cp-main{padding:24px 32px 40px}.cp-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.cp-projects{grid-template-columns:repeat(2,minmax(0,1fr))}.cp-card{padding:18px}}
@media(min-width:1100px){.cp-projects{grid-template-columns:repeat(3,minmax(0,1fr))}.cp-columns{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}.cp-photos{grid-template-columns:repeat(4,minmax(0,1fr))}.cp-photos img{height:90px}}
`;
