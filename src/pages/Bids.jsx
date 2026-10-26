import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyStandards, computeFloorCheck } from '@/lib/companyStandards';
import { BidListSkeleton } from '@/components/skeleton/SkeletonComponents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, TrendingUp, DollarSign, Search, ArrowRight, Calendar, Sparkles, ChevronRight, Upload, Loader2, CheckCircle, AlertTriangle, Trophy, Activity, CircleDollarSign, CalendarClock, Building2, MapPin, Layers, RefreshCw, Briefcase, Filter, LayoutGrid, List as ListIcon, Send, Inbox, PencilRuler, GripVertical, Flame, Scale, Timer, TrendingDown, Target, SlidersHorizontal, MousePointer2 } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { fmtDate } from '@/lib/dates';
import { fmtDollars } from '@/lib/money';
import { normalizeBidAnalysis } from '@/lib/bidAnalysis';
import { getPhaseTemplate } from '../components/projects/projectTemplates';
import { convertBidToProject } from '@/lib/bidConversion';
import BidStatusSelect from '@/components/bids/BidStatusSelect';

// Owner's bid status list (replaces the spec's): Review, Intake, Off Pricing,
// No Bid, User Analyzing, Estimated — plus Submitted, Won, Lost, Closed so the
// pipeline still ends somewhere.
const statusColors = {
  review: 'bg-primary/15 text-primary',
  intake: 'bg-muted text-foreground',
  off_pricing: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300',
  user_analyzing: 'bg-accent text-accent-foreground',
  estimated: 'bg-muted text-foreground',
  submitted: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300',
  won: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  lost: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300',
  no_bid: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-foreground'
};

const bidStatuses = ['All', 'review', 'intake', 'off_pricing', 'user_analyzing', 'estimated', 'submitted', 'won', 'lost', 'no_bid', 'closed'];
const bidStatusLabels = {
  All: 'All',
  review: 'Review',
  intake: 'Intake',
  off_pricing: 'Off Pricing',
  user_analyzing: 'User Analyzing',
  estimated: 'Estimated',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost',
  no_bid: 'No Bid',
  closed: 'Closed',
};

// ---- Pipeline (matches mockups/Chief/Premium/bids.html) ----
// Maps the owner's status enum (bidStatuses above) onto the 4 mockup stages.
// lost / no_bid / closed (and any unknown/empty status) do NOT map to a stage;
// they are counted in the "Not in pipeline" note and lost feeds the win rate.
const PIPELINE_STAGES = [
  { key: 'new', defaultStatus: 'review', label: 'New', icon: Inbox, statuses: ['review', 'intake'] },
  { key: 'bidding', defaultStatus: 'off_pricing', label: 'Bidding', icon: PencilRuler, statuses: ['off_pricing', 'user_analyzing', 'estimated'] },
  { key: 'submitted', defaultStatus: 'submitted', label: 'Submitted', icon: Send, statuses: ['submitted'] },
  { key: 'won', defaultStatus: 'won', label: 'Won', icon: Trophy, statuses: ['won'] },
];
const STATUS_TO_STAGE = PIPELINE_STAGES.reduce((m, s) => { s.statuses.forEach((st) => { m[st] = s.key; }); return m; }, {});
const UNMAPPED_STATUSES = bidStatuses.filter((s) => s !== 'All' && !STATUS_TO_STAGE[s]); // ['lost','no_bid','closed']

// Real-data marker: titles/names that start with "TEST" get a TEST pill (mockup .test chip); the prefix is shown as the pill, not repeated.
const TEST_RE = /^\s*TEST\b[\s\-–—:·_]*/i;
const isTestBid = (b) => TEST_RE.test(b.title || '') || TEST_RE.test(b.project_name || '');
const displayTitle = (b) => {
  const t = b.title || b.project_name || '';
  if (!t) return '—';
  const stripped = t.replace(TEST_RE, '');
  return stripped || t;
};
const hasNum = (v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
// Valid bid date: yyyy-MM-dd..., year >= 1990, parses. Rejects '0000-00-00' and other junk.
const isValidDateStr = (v) => {
  if (!v) return false;
  const s = String(v);
  if (!/^\d{4}-\d{2}-\d{2}/.test(s) || Number(s.slice(0, 4)) < 1990) return false;
  return !Number.isNaN(new Date(s.length <= 10 ? `${s}T00:00:00` : s).getTime());
};
// Clean numeric/date fields before create/update: blank or NaN never goes to the API (fixes 422).
// Only touches keys already present. Create: drop the key. Update: send null to clear.
const BID_NUM_FIELDS = ['estimated_value', 'win_probability'];
const cleanBidPayload = (data, forUpdate = false) => {
  const out = { ...data };
  BID_NUM_FIELDS.forEach((k) => {
    if (!(k in out)) return;
    if (hasNum(out[k])) out[k] = Number(out[k]);
    else if (forUpdate) out[k] = null;
    else delete out[k];
  });
  if ('due_date' in out && !isValidDateStr(out.due_date)) {
    if (forUpdate) out.due_date = null; else delete out.due_date;
  }
  return out;
};

const fmtCompact = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + Math.round(n).toLocaleString();
};

// Stage colors (mockup premium.css palette; Bidding is orange per spec). Light / dark via the .dark class.
const PIPELINE_CSS = `
.gsis-pipe{--st-new:#2B6FCF;--st-bidding:#E0730E;--st-submitted:#6F52D6;--st-won:#119A5B;--pipe-gold:hsl(var(--brand-gold,43 67% 47%));--pipe-navy:hsl(var(--brand-navy,214 68% 14%));--pipe-col:hsl(var(--muted)/.55);--pipe-card:hsl(var(--card));}
.dark .gsis-pipe{--st-new:#5EA8FF;--st-bidding:#FF9F43;--st-submitted:#A78BFA;--st-won:#3DD68C;--pipe-col:rgba(10,26,50,.45);--pipe-card:linear-gradient(180deg,rgba(26,52,92,.75),rgba(14,32,60,.8));}
.gsis-pipe .seg-glow{box-shadow:0 0 14px -2px var(--c)}
.gsis-pipe .dot-glow{box-shadow:0 0 10px var(--c)}
.gsis-pipe .pcol{background:var(--pipe-col)}
.gsis-pipe .pcard{background:var(--pipe-card);transition:transform .2s,box-shadow .2s,border-color .2s}
.gsis-pipe .pcard:hover{transform:translateY(-2px);border-color:var(--pipe-gold);box-shadow:0 14px 30px -16px rgba(0,0,0,.45),0 0 30px -14px var(--pipe-gold)}
.gsis-pipe .pcard[data-stage="won"]{box-shadow:0 0 0 1px color-mix(in srgb,var(--st-won) 45%,transparent),0 0 28px -12px var(--st-won)}
.gsis-pipe .pcol.over{border-color:color-mix(in srgb,var(--pipe-gold) 55%,transparent);background:color-mix(in srgb,var(--pipe-gold) 6%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--pipe-gold) 20%,transparent) inset,0 0 40px -14px var(--pipe-gold)}
.gsis-pipe .pcard.dragging{opacity:.35;transform:scale(.98)}
.gsis-pipe .pcard.won-flash{animation:gsisWonGlow 1.4s cubic-bezier(.2,.8,.2,1)}
@keyframes gsisWonGlow{0%{box-shadow:0 0 0 1px rgba(61,214,140,.9),0 0 40px rgba(61,214,140,.6)}100%{box-shadow:none}}
.gsis-pipe .add-c:hover{color:var(--pipe-gold);border-color:color-mix(in srgb,var(--pipe-gold) 55%,transparent)}
.gsis-pipe.kpi-wrap{}
.gsis-pipe .kpi{background:var(--pipe-card)}
.gsis-pipe .kpi.attn{border-color:color-mix(in srgb,var(--pipe-gold) 45%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--pipe-gold) 15%,transparent),0 18px 40px -24px var(--pipe-gold)}
/* Light mode: mockup's highlighted KPI is a navy card with light text (re-scoped theme vars) */
html:not(.dark) .gsis-pipe .kpi.attn{background:linear-gradient(180deg,hsl(var(--brand-navy,214 68% 14%)/.92),hsl(var(--brand-navy,214 68% 14%)));--foreground:0 0% 98%;--muted-foreground:215 25% 78%;--muted:215 45% 26%;--border:215 30% 28%;color:hsl(var(--foreground))}
.gsis-pipe .pboard{scroll-snap-type:x mandatory}
.gsis-pipe .pboard>*{scroll-snap-align:start}
.gsis-test{display:inline-flex;align-items:center;margin-right:6px;padding:1px 6px;border-radius:5px;font-size:9.5px;font-weight:800;letter-spacing:.08em;vertical-align:2px;color:#8F6A12;background:rgba(212,165,55,.16);border:1px solid rgba(212,165,55,.45)}
.dark .gsis-test{color:#E8C25A;background:rgba(212,165,55,.12);border-color:rgba(212,165,55,.4)}
.gsis-chips{scrollbar-width:none}.gsis-chips::-webkit-scrollbar{display:none}
`;

export function BidPipeline({ bids = [], allBids = bids, belowFloorByBid = {}, onOpen, onStatusChange, onAdd, renderActions }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const stages = useMemo(() => PIPELINE_STAGES.map((s) => {
    const items = bids.filter((b) => STATUS_TO_STAGE[b.status] === s.key);
    return { ...s, items, count: items.length, total: items.reduce((a, b) => a + (Number(b.estimated_value) || 0), 0) };
  }), [bids]);
  const unmapped = useMemo(() => bids.filter((b) => !STATUS_TO_STAGE[b.status]), [bids]);
  const unmappedBreakdown = useMemo(() => unmapped.reduce((m, b) => { const k = b.status || '(none)'; m[k] = (m[k] || 0) + 1; return m; }, {}), [unmapped]);
  const wonCount = allBids.filter((b) => b.status === 'won').length;
  const lostCount = allBids.filter((b) => b.status === 'lost').length;
  const decided = wonCount + lostCount;
  const winRate = decided ? Math.round((wonCount / decided) * 100) : null;
  const pipelineTotal = stages.reduce((a, s) => a + s.total, 0);
  const pipelineCount = stages.reduce((a, s) => a + s.count, 0);

  // Native HTML5 drag & drop (desktop). Mobile keeps the status dropdown on each card.
  const handleDrop = (e, stage) => {
    e.preventDefault();
    setOverCol(null);
    const id = e.dataTransfer.getData('text/plain') || dragId;
    setDragId(null);
    const bid = bids.find((b) => String(b.id) === String(id));
    if (!bid || STATUS_TO_STAGE[bid.status] === stage.key) return;
    if (stage.key === 'won') { setFlashId(bid.id); setTimeout(() => setFlashId(null), 1500); }
    onStatusChange?.(bid, stage.defaultStatus);
  };

  return (
    <section className="gsis-pipe space-y-4" data-testid="bid-pipeline">
      <style>{PIPELINE_CSS}</style>
      {/* Segmented pipeline bar + legend + win rate */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pipeline</div>
            <div className="text-2xl font-bold tabular-nums text-foreground">{fmtCompact(pipelineTotal)}<span className="ml-2 text-sm font-medium text-muted-foreground">{pipelineCount} bids</span></div>
          </div>
          <div className="text-right" data-testid="win-rate">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 justify-end"><Trophy className="h-3.5 w-3.5 text-[hsl(var(--brand-gold,43_67%_47%))]" />Win rate</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--st-won)' }}>{winRate === null ? '—' : `${winRate}%`}</div>
            <div className="text-xs text-muted-foreground">{wonCount} won of {decided} decided</div>
          </div>
        </div>
        <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-muted" role="img" aria-label="Pipeline by stage">
          {stages.map((s) => (s.count > 0 ? (
            <div key={s.key} className="seg-glow h-full rounded-full transition-all" title={`${s.label}: ${s.count} · ${fmtCompact(s.total)}`}
              style={{ '--c': `var(--st-${s.key})`, background: `var(--st-${s.key})`, flexGrow: pipelineTotal > 0 ? Math.max(s.total, pipelineTotal * 0.03) : s.count, flexBasis: 0 }} />
          ) : null))}
        </div>
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm" data-testid="pipeline-legend">
          {stages.map((s) => (
            <li key={s.key} className="flex items-center gap-2 min-w-0">
              <span className="dot-glow h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ '--c': `var(--st-${s.key})`, background: `var(--st-${s.key})` }} />
              <span className="font-medium text-foreground">{s.label}</span>
              <span className="text-muted-foreground tabular-nums">{s.count}</span>
              <span className="ml-auto font-semibold tabular-nums text-foreground">{fmtCompact(s.total)}</span>
            </li>
          ))}
        </ul>
        {unmapped.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Not in pipeline: {Object.entries(unmappedBreakdown).map(([k, n]) => `${bidStatusLabels[k] || k} ${n}`).join(' · ')}
          </p>
        )}
      </div>

      {/* Board: 4-up at xl, scroll-snap columns (82vw on phones) below */}
      <div className="pboard -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3.5 overflow-x-auto pb-2.5 xl:grid xl:grid-cols-4 xl:overflow-visible items-start">
        {stages.map((s) => (
          <div key={s.key} data-stage-col={s.key}
            onDragOver={(e) => { if (!dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (overCol !== s.key) setOverCol(s.key); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol((c) => (c === s.key ? null : c)); }}
            onDrop={(e) => handleDrop(e, s)}
            className={`pcol ${overCol === s.key ? 'over' : ''} w-[82vw] max-w-[340px] sm:w-[260px] xl:w-auto xl:max-w-none flex-shrink-0 rounded-2xl border border-border p-3 min-h-[200px] xl:min-h-[420px]`}>
            <div className="flex items-center gap-2 px-1 pb-2.5">
              <span className="dot-glow h-2.5 w-2.5 rounded-full" style={{ '--c': `var(--st-${s.key})`, background: `var(--st-${s.key})` }} />
              <b className="text-[13px] text-foreground">{s.label}</b>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">{s.count}</span>
              <span className="ml-auto text-[12.5px] font-bold tabular-nums text-muted-foreground">{fmtCompact(s.total)}</span>
            </div>
            <div className="mx-1 mb-3 h-[3px] rounded opacity-90" style={{ background: `linear-gradient(90deg, var(--st-${s.key}), transparent)` }} />
            <div className="flex flex-col gap-[9px] min-h-[60px]">
              {s.items.map((bid) => {
                const hasProb = s.key === 'won' || hasNum(bid.win_probability);
                const prob = s.key === 'won' ? 100 : hasProb ? Math.max(0, Math.min(100, Number(bid.win_probability))) : 0;
                const probColor = s.key === 'won' ? 'var(--st-won)' : prob >= 50 ? 'var(--pipe-gold)' : 'var(--st-new)';
                const daysOut = isValidDateStr(bid.due_date) ? Math.ceil((new Date(bid.due_date) - new Date()) / 86400000) : null;
                const dueSoon = (s.key === 'new' || s.key === 'bidding') && daysOut !== null && daysOut >= 0 && daysOut <= 7;
                const division = DIVISIONS.find((d) => d.value === bid.division);
                const FootIcon = s.key === 'won' ? Trophy : s.key === 'submitted' ? Send : Calendar;
                return (
                  <div key={bid.id} data-status={bid.status} data-stage={s.key} role="button" tabIndex={0} draggable
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(bid.id)); setDragId(bid.id); }}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onClick={() => onOpen?.(bid)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(bid); }}
                    className={`pcard group relative cursor-grab active:cursor-grabbing select-none rounded-[13px] border border-border p-3 text-left ${dragId === bid.id ? 'dragging' : ''} ${flashId === bid.id ? 'won-flash' : ''}`}>
                    <GripVertical className="absolute right-2.5 top-3 h-3.5 w-3.5 text-muted-foreground/60" />
                    <div className="pr-5 text-[13.5px] font-semibold leading-snug text-foreground line-clamp-2">{isTestBid(bid) && <span className="gsis-test">TEST</span>}{displayTitle(bid)}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground truncate">{bid.client_name || bid.agency || '—'}</div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {bid.division && <TradeChip division={bid.division} label={division?.label || bid.division} />}
                      {dueSoon && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: 'var(--st-bidding)', background: 'color-mix(in srgb, var(--st-bidding) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--st-bidding) 35%, transparent)' }}><Flame className="h-3 w-3" />Due soon</span>}
                      {belowFloorByBid[bid.id] && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-800 dark:text-amber-300"><AlertTriangle className="h-3 w-3" />Below floor</span>
                      )}
                    </div>
                    <div className="mt-2.5 text-[17px] font-extrabold tracking-tight tabular-nums text-foreground">{bid.estimated_value ? fmtDollars(bid.estimated_value) : '—'}</div>
                    <div className="mt-2 h-1 overflow-hidden rounded bg-muted">
                      <i className="block h-full rounded" style={{ width: `${prob}%`, background: probColor }} />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5 text-[11.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><FootIcon className="h-3.5 w-3.5" />{isValidDateStr(bid.due_date) ? `${s.key === 'won' ? 'Won ' : s.key === 'submitted' ? 'Due ' : ''}${fmtDate(bid.due_date)}` : '—'}</span>
                      <span>· {hasProb ? `${prob}%` : '—'}</span>
                      {bid.owner_name && <Initials name={bid.owner_name} />}
                    </div>
                    {/* No per-card status dropdown (not in mockup). Desktop: drag between columns.
                        Touch / <1280px: tap the card -> BidDetail, whose Status card has BidStatusSelect (Won there also auto-creates the project). */}
                    {renderActions && renderActions(bid) && (
                      <div className="mt-2.5 flex items-center justify-end gap-2" draggable={false} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        {renderActions(bid)}
                      </div>
                    )}
                  </div>
                );
              })}
              {dragId && overCol === s.key && <div className="h-[86px] rounded-[13px] border-[1.5px] border-dashed" style={{ borderColor: 'color-mix(in srgb, var(--pipe-gold) 50%, transparent)', background: 'color-mix(in srgb, var(--pipe-gold) 6%, transparent)' }} />}
            </div>
            {onAdd && (
              <button type="button" onClick={() => onAdd(s.defaultStatus)}
                className="add-c mt-[9px] flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border p-[9px] text-[12.5px] text-muted-foreground transition-colors">
                <Plus className="h-3.5 w-3.5" />Add bid
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const TRADE_STYLE = { fire_alarm: '#E5484D', low_voltage: 'var(--st-new)', drone: 'var(--st-submitted)', software: 'var(--st-won)', other: 'hsl(var(--muted-foreground))' };
function TradeChip({ division, label }) {
  const c = TRADE_STYLE[division] || TRADE_STYLE.other;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: c, background: `color-mix(in srgb, ${c} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 32%, transparent)` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{label}
    </span>
  );
}

const AV_COLORS = ['#E5484D', '#6F52D6', '#2B6FCF', '#119A5B', '#C8961F', '#D9690B'];
function Initials({ name }) {
  const parts = String(name).trim().split(/\s+/);
  const ini = ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  const c = AV_COLORS[[...String(name)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AV_COLORS.length];
  return <span title={name} className="ml-auto inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9.5px] font-bold text-white" style={{ background: c }}>{ini}</span>;
}

// ---- KPI cards (computed from created_date / updated_date / estimated_value / win_probability) ----
const OPEN_STAGES = ['new', 'bidding', 'submitted'];
const monthEnds = (n = 9) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (n - 1 - i) + 1, 0, 23, 59, 59));
};
const ts = (d) => (isValidDateStr(d) ? new Date(d).getTime() : NaN);
// Decision date for won/lost: no award-date field exists on BidOpportunity in this file, so use updated_date (fallback created_date).
const decidedAt = (b) => ts(b.awarded_date || b.updated_date || b.created_date);

function computeKpis(bids) {
  const ends = monthEnds(9);
  const openAt = (end) => bids.filter((b) => OPEN_STAGES.includes(STATUS_TO_STAGE[b.status]) && ts(b.created_date) <= end.getTime());
  const openVal = (end) => openAt(end).reduce((a, b) => a + (Number(b.estimated_value) || 0), 0);
  const weightedVal = (end) => openAt(end).reduce((a, b) => a + (Number(b.estimated_value) || 0) * ((Number(b.win_probability) || 0) / 100), 0);
  const winWindow = (end) => {
    const from = end.getTime() - 90 * 86400000;
    const d = bids.filter((b) => ['won', 'lost'].includes(b.status) && decidedAt(b) > from && decidedAt(b) <= end.getTime());
    const w = d.filter((b) => b.status === 'won').length;
    return { w, n: d.length, pct: d.length ? Math.round((w / d.length) * 100) : 0 };
  };
  const daysToAward = (end) => {
    const from = end.getTime() - 90 * 86400000;
    const won = bids.filter((b) => b.status === 'won' && b.created_date && decidedAt(b) > from && decidedAt(b) <= end.getTime());
    return won.length ? Math.round(won.reduce((a, b) => a + (decidedAt(b) - ts(b.created_date)) / 86400000, 0) / won.length) : null;
  };
  const now = new Date();
  const open = { series: ends.map(openVal), value: openAt(now).reduce((a, b) => a + (Number(b.estimated_value) || 0), 0) };
  const weighted = { series: ends.map(weightedVal), value: weightedVal(now) };
  const win = { series: ends.map((e) => winWindow(e).pct), ...winWindow(now) };
  const days = { series: ends.map((e) => daysToAward(e) ?? 0), value: daysToAward(now) };
  const prev = ends[ends.length - 2];
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
  return {
    open: { ...open, delta: pct(open.value, openVal(prev)), prevLabel: format(prev, 'MMM') },
    weighted,
    win: { ...win, delta: win.n ? win.pct - winWindow(prev).pct : null },
    days: { ...days, delta: days.value !== null && daysToAward(prev) !== null ? days.value - daysToAward(prev) : null },
  };
}

function Sparkline({ data = [], color }) {
  const w = 160, h = 40;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const pts = data.map((v, i) => [(i / Math.max(data.length - 1, 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 8)]);
  const line = pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const id = 'sg' + color.replace(/[^a-z]/gi, '');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-2.5 h-10 w-full" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {pts.length > 1 && <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${id})`} />}
      {pts.length > 1 && <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

function Delta({ v, suffix = '%', invert = false }) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  const good = invert ? v <= 0 : v >= 0;
  const Icon = v >= 0 ? TrendingUp : TrendingDown;
  return <span className="inline-flex items-center gap-1 font-semibold" style={{ color: good ? 'var(--st-won)' : '#E5484D' }}><Icon className="h-3.5 w-3.5" />{Math.abs(v)}{suffix}</span>;
}

export function BidKpis({ bids = [] }) {
  const k = useMemo(() => computeKpis(bids), [bids]);
  const cards = [
    { key: 'open', label: 'Open Pipeline', icon: Layers, value: fmtCompact(k.open.value), meta: <><Delta v={k.open.delta} /><span>vs {k.open.prevLabel}</span></>, series: k.open.series, color: 'var(--pipe-gold)', attn: true },
    { key: 'weighted', label: 'Weighted Value', icon: Scale, value: fmtCompact(k.weighted.value), meta: <span>Probability-adjusted</span>, series: k.weighted.series, color: 'var(--st-new)' },
    { key: 'win', label: 'Win Rate · 90d', icon: Trophy, value: k.win.n ? `${k.win.pct}%` : '—', meta: <><Delta v={k.win.delta} suffix=" pts" /><span>{k.win.w} of {k.win.n} bids</span></>, series: k.win.series, color: 'var(--st-won)' },
    { key: 'days', label: 'Avg Days to Award', icon: Timer, value: k.days.value ?? '—', meta: k.days.delta !== null ? <><Delta v={k.days.delta} suffix=" days" invert /><span>{k.days.delta <= 0 ? 'faster' : 'slower'}</span></> : <span>Won bids · 90d</span>, series: k.days.series, color: 'var(--st-submitted)' },
  ];
  return (
    <section className="gsis-pipe grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4" data-testid="bid-kpis">
      <style>{PIPELINE_CSS}</style>
      {cards.map((c) => (
        <div key={c.key} className={`kpi rounded-2xl border bg-card p-3.5 sm:p-4 shadow-sm min-w-0 ${c.attn ? 'attn' : 'border-border'}`}>
          <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground min-w-0">
            <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60"><c.icon className="h-3.5 w-3.5 text-foreground/80" /></span>
            <span className="truncate">{c.label}</span>
          </div>
          <div className="mt-3 text-2xl sm:text-[28px] font-bold tracking-tight tabular-nums text-foreground">{c.value}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{c.meta}</div>
          <Sparkline data={c.series} color={c.color} />
        </div>
      ))}
    </section>
  );
}

const DIVISIONS = [
  { value: 'fire_alarm', label: 'Fire Alarm' },
  { value: 'low_voltage', label: 'Low Voltage' },
  { value: 'drone', label: 'Drone' },
  { value: 'software', label: 'Software' },
  { value: 'other', label: 'Other' },
];
const LV_DOMAINS = [
  { value: 'cameras', label: 'Cameras' },
  { value: 'access_control', label: 'Access Control' },
  { value: 'structured_cabling', label: 'Structured Cabling' },
  { value: 'networking', label: 'Networking' },
  { value: 'av', label: 'AV' },
  { value: 'monitoring', label: 'Monitoring' },
];

// Map a bid division to a Project project_type
const divisionToProjectType = (d) => ({
  fire_alarm: 'fire_alarm_new_construction',
  low_voltage: 'low_voltage_structured_cabling',
  drone: 'other',
  software: 'other',
  other: 'other',
}[d] || 'other');

export default function Bids() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const [view, setView] = useState('pipeline'); // 'pipeline' | 'list'
  const [tradeFilter, setTradeFilter] = useState('All');
  const [newBidStatus, setNewBidStatus] = useState(null); // preset status from a column's Add button
  const [showFilters, setShowFilters] = useState(false);
  // Date sort + date-range filter (applies to pipeline columns and list view). Default: soonest due date first.
  const [sortBy, setSortBy] = useState('due_asc'); // due_asc | due_desc | added_desc | added_asc
  const [dateField, setDateField] = useState('due_date'); // field the range filter applies to: due_date | created_date
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Layout's <main> is the scroll container (overflow-y-auto) and is never reset on route change,
  // so arriving on Bids from a scrolled page landed mid-page on phones (header/KPIs/trade chips above the fold).
  useEffect(() => {
    const scroller = document.querySelector('main');
    if (scroller && typeof scroller.scrollTo === 'function') scroller.scrollTo({ top: 0 });
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  }, []);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ['bids-all', user?.organization_id],
    queryFn: async () => {
      // Load every bid visible to this org, including legacy records that have no
      // organization_id set (the 26 imported bids). An $or keeps org-matched records
      // and unassigned records, so nothing is hidden by the filter.
      const orgId = user?.organization_id;
      const query = orgId
        ? { $or: [{ organization_id: orgId }, { organization_id: { $in: [null, ''] } }, { organization_id: { $exists: false } }] }
        : {};
      const page = await base44.entities.BidOpportunity.filter(query, { sort: '-created_date', limit: 500 });
      return (page?.items || page || []).filter(b =>
        !b.title?.includes('Downtown Plaza') &&
        !b.title?.includes('Highway 101') &&
        !b.title?.includes('Springfield') &&
        !b.project_name?.includes('Downtown Plaza') &&
        !b.project_name?.includes('Highway 101') &&
        !b.project_name?.includes('Springfield')
      );
    },
    enabled: !!user
  });

  const createBidMutation = useMutation({
    // Entered by: Sales
    mutationFn: (data) => base44.entities.BidOpportunity.create({ 
      ...cleanBidPayload(data), 
      organization_id: user.organization_id 
    }),
    onSuccess: async (bid, data) => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      setShowDialog(false);
      setEditingBid(null);
      toast.success('Bid saved');
      // Auto-create a linked project if a bid is created directly as Won
      if (data.status === 'won' && bid && !bid.linked_project_id) {
        try {
          const res = await convertBidToProject({ base44Client: base44, bid, organizationId: user.organization_id });
          queryClient.invalidateQueries({ queryKey: ['bids-all'] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          if (!res.already_exists) toast.success('Awarded — project auto-created');
        } catch (e) { toast.error('Auto-create project failed: ' + (e.message || '')); }
      }
    },
    onError: (e) => toast.error('Save failed: ' + (e.message || ''))
  });

  const updateBidMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BidOpportunity.update(id, cleanBidPayload(data, true)),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      setShowDialog(false);
      setEditingBid(null);
      toast.success('Bid updated');
      // Auto-create a linked project when an edit changes status to Won
      if (variables.data.status === 'won') {
        const fresh = (await base44.entities.BidOpportunity.filter({ id: variables.id }))?.[0];
        if (fresh && !fresh.linked_project_id) {
          try {
            const res = await convertBidToProject({ base44Client: base44, bid: fresh, organizationId: user.organization_id });
            queryClient.invalidateQueries({ queryKey: ['bids-all'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            if (!res.already_exists) toast.success('Awarded — project auto-created');
          } catch (e) { toast.error('Auto-create project failed: ' + (e.message || '')); }
        }
      }
    },
    onError: (e) => toast.error('Update failed: ' + (e.message || ''))
  });

  const deleteBidMutation = useMutation({
    mutationFn: (id) => base44.entities.BidOpportunity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      toast.success('Bid deleted');
    },
    onError: (e) => toast.error('Delete failed: ' + (e.message || ''))
  });

  const { data: scraperStatus } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: async () => {
      const res = await base44.entities.ScraperStatus.filter({ name: 'bid_scraper' }, { limit: 5 });
      return (res?.items || res || [])[0] || null;
    },
  });

  const { standards } = useCompanyStandards();

  const { data: bidEstimates = [] } = useQuery({
    queryKey: ['bid-estimates-all', user?.organization_id],
    queryFn: async () => {
      const orgId = user?.organization_id;
      const query = orgId ? { organization_id: orgId } : {};
      const page = await base44.entities.BidEstimate.filter(query, { limit: 500 });
      return page?.items || page || [];
    },
    enabled: !!user,
  });

  // Map bid_id -> belowFloor (latest estimate version per bid).
  const belowFloorByBid = useMemo(() => {
    const latest = {};
    (bidEstimates || []).forEach((est) => {
      const bidId = est.bid_opportunity_id;
      if (!bidId) return;
      if (!latest[bidId] || (est.version || 0) > (latest[bidId].version || 0)) {
        latest[bidId] = est;
      }
    });
    const result = {};
    Object.entries(latest).forEach(([bidId, est]) => {
      result[bidId] = computeFloorCheck(est, standards).belowFloor;
    });
    return result;
  }, [bidEstimates, standards]);

  const runScraperMutation = useMutation({
    mutationFn: () => base44.functions.invoke('runScheduledBidScrape', { workType: 'fire_alarm', state: 'California', organization_id: user?.organization_id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['scraper-status'] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      const added = res?.added ?? 0;
      const failedSources = (res?.sources || []).filter((s) => s.error);
      if (failedSources.length) {
        const names = failedSources.map((s) => s.name).join(', ');
        toast.warning(`Scrape partial — ${added} new bid(s) added. Failed source: ${names}`);
      } else if (added === 0) {
        toast.info('Scrape complete — no new bids found');
      } else {
        toast.success(`Scrape complete — ${added} new bid(s) added`);
      }
    },
    onError: (e) => toast.error('Scrape failed: ' + (e.message || '')),
  });

  const tagBidMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.BidOpportunity.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      toast.success('Bid status updated');
    },
    onError: (e) => toast.error('Status update failed: ' + (e.message || ''))
  });

  // Manual "Convert to Project" shortcut (optional — Awarded auto-creates too).
  // Uses the shared helper so it's idempotent and never duplicates a project.
  const convertToProjectMutation = useMutation({
    mutationFn: (bid) => convertBidToProject({ base44Client: base44, bid, organizationId: user.organization_id }),
    onSuccess: (res, bid) => {
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(res.already_exists ? 'Project already exists' : 'Converted to project');
      navigate(createPageUrl('ProjectDetail') + `?id=${res.id}`);
    },
    onError: (e) => toast.error('Convert failed: ' + (e.message || '')),
  });

  // Auto-create a linked Project whenever a bid is marked Won (owner rule).
  const handleMarkWon = async (bid) => {
    try {
      await base44.entities.BidOpportunity.update(bid.id, { status: 'won' });
      if (!bid.linked_project_id) {
        const res = await convertBidToProject({ base44Client: base44, bid: { ...bid, status: 'won' }, organizationId: user.organization_id });
        queryClient.invalidateQueries({ queryKey: ['bids-all'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        toast.success(res.already_exists ? 'Project already exists' : 'Awarded — project auto-created');
        navigate(createPageUrl('ProjectDetail') + `?id=${res.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['bids-all'] });
        toast.success('Marked Awarded');
      }
    } catch (e) {
      toast.error('Failed to mark won: ' + (e.message || ''));
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
    }
  };

  const filteredBids = bids.filter((bid) => {
    const matchesStatus = statusFilter === 'All' || bid.status === statusFilter;
    const matchesSearch = 
      bid.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.agency?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrade = tradeFilter === 'All' || bid.division === tradeFilter;
    // Date range: bids with no date on the chosen field are hidden only while a range is set.
    const dayOf = (v) => (isValidDateStr(v) ? String(v).slice(0, 10) : '');
    const d = dayOf(bid[dateField]);
    const matchesDate = (!dateFrom && !dateTo) || (d && (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo));
    return matchesStatus && matchesSearch && matchesTrade && matchesDate;
  }).sort((a, b) => {
    // Sort by due date (default, soonest first) or date added. Bids with no date always go last.
    const key = sortBy.startsWith('due') ? 'due_date' : 'created_date';
    const asc = sortBy.endsWith('_asc');
    const ta = isValidDateStr(a[key]) ? new Date(String(a[key]).length <= 10 ? `${a[key]}T00:00:00` : a[key]).getTime() : NaN;
    const tb = isValidDateStr(b[key]) ? new Date(String(b[key]).length <= 10 ? `${b[key]}T00:00:00` : b[key]).getTime() : NaN;
    const aNo = Number.isNaN(ta), bNo = Number.isNaN(tb);
    if (aNo && bNo) return 0;
    if (aNo) return 1;
    if (bNo) return -1;
    return asc ? ta - tb : tb - ta;
  });

  const stats = {
    total: bids.length,
    won: bids.filter(b => b.status === 'won').length,
    active: bids.filter(b => ['review', 'intake', 'off_pricing', 'user_analyzing', 'estimated', 'submitted'].includes(b.status)).length,
    value: bids.reduce((sum, b) => sum + (b.estimated_value || 0), 0)
  };

  if (isLoading || !user) {
    return <BidListSkeleton />;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 animate-slide-up">
      {/* Header (mockup .ph): SALES eyebrow, "Bid Pipeline", subtitle; actions = search (desktop), Filters, New Bid */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[hsl(var(--brand-gold,43_67%_47%))] font-bold text-xs mb-2 uppercase tracking-[.14em]">
            <Target className="h-4 w-4" />
            Sales
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-foreground tracking-tight">
            Bid <span className="text-[hsl(var(--brand-gold,43_67%_47%))]">Pipeline</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Drag cards between stages — totals update live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative hidden md:block w-56 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filter bids…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 bg-card border-border rounded-xl" aria-label="Search bids" />
          </div>
          <Button type="button" variant="outline" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}
            className="relative h-10 px-3.5 gap-2 rounded-xl border border-border bg-card text-foreground font-semibold">
            <SlidersHorizontal className="h-4 w-4" />Filters
            {(statusFilter !== 'All' || searchQuery || dateFrom || dateTo) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--brand-gold,43_67%_47%))]" />}
          </Button>
          <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) setNewBidStatus(null); }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { setEditingBid(null); setNewBidStatus(null); }}
                className="h-10 px-4 gap-2 rounded-xl bg-[hsl(var(--brand-navy,214_68%_14%))] text-[hsl(var(--brand-gold,43_67%_47%))] dark:bg-[hsl(var(--brand-gold,43_67%_47%))] dark:text-[hsl(var(--brand-navy,214_68%_14%))] shadow-[0_8px_24px_-10px_hsl(var(--brand-gold,43_67%_47%))] hover:opacity-90 font-semibold"
              >
                <Plus className="h-5 w-5" />
                New Bid
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
 <BidForm 
                key={editingBid?.id || `new-${newBidStatus || 'review'}`}
                bid={editingBid} 
                initialStatus={newBidStatus}
                onSubmit={(data) => {
                  if (editingBid) {
                    updateBidMutation.mutate({ id: editingBid.id, data });
                  } else {
                    createBidMutation.mutate(data);
                  }
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI cards (mockup) — computed from all queried bids */}
      <BidKpis bids={bids} />

      {/* Trade chips (division) + drag hint — mockup .seg row. Replaces the status/trade dropdowns. */}
      <div className="flex items-center gap-2">
        <div className="gsis-chips inline-flex max-w-full overflow-x-auto rounded-xl border border-border bg-card p-1" role="tablist" aria-label="Trade">
          {[{ value: 'All', label: 'All trades' }, ...DIVISIONS.filter((d) => d.value !== 'other' || bids.some((b) => b.division === 'other'))].map((d) => (
            <button key={d.value} type="button" role="tab" aria-selected={tradeFilter === d.value} onClick={() => setTradeFilter(d.value)}
              className={`inline-flex flex-shrink-0 h-8 items-center whitespace-nowrap px-3 rounded-lg text-[12.5px] font-medium transition-colors ${tradeFilter === d.value ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {d.value === 'fire_alarm' ? 'Fire alarm' : d.value === 'low_voltage' ? 'Low-voltage' : d.label}
            </button>
          ))}
        </div>
        <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-muted-foreground ml-auto whitespace-nowrap">
          <MousePointer2 className="h-3.5 w-3.5" />Drag to move · drop in <b style={{ color: 'var(--st-won, #119A5B)' }}>Won</b> to convert
        </span>
      </div>

      {/* Filters panel (header "Filters" button): search on phones, status chips, view toggle, scraper. Same state as before. */}
      {showFilters && (
        <div className="rounded-2xl border border-border bg-card p-3 space-y-3" data-testid="bid-filters">
          <div className="relative md:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filter bids…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 bg-card border-border rounded-xl" aria-label="Search bids" />
          </div>
          <div className="gsis-chips flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Status">
            {bidStatuses.map((status) => (
              <button key={status} type="button" role="tab" aria-selected={statusFilter === status} onClick={() => setStatusFilter(status)}
                className={`flex-shrink-0 h-8 px-3 rounded-lg border text-[12.5px] font-medium whitespace-nowrap transition-colors ${statusFilter === status ? 'border-transparent bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                {bidStatusLabels[status] || status}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="bid-date-controls">
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">Sort
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort bids"
                className="h-8 rounded-lg border border-border bg-card px-2 text-[12.5px] text-foreground">
                <option value="due_asc">Due date: soonest first</option>
                <option value="due_desc">Due date: latest first</option>
                <option value="added_desc">Date added: newest first</option>
                <option value="added_asc">Date added: oldest first</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">Date
              <select value={dateField} onChange={(e) => setDateField(e.target.value)} aria-label="Date to filter by"
                className="h-8 rounded-lg border border-border bg-card px-2 text-[12.5px] text-foreground">
                <option value="due_date">Due date</option>
                <option value="created_date">Date added</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">From
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date"
                className="h-8 rounded-lg border border-border bg-card px-2 text-[12.5px] text-foreground" />
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">To
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date"
                className="h-8 rounded-lg border border-border bg-card px-2 text-[12.5px] text-foreground" />
            </label>
            {(dateFrom || dateTo) && (
              <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }} className="h-8 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">Clear dates</button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">{filteredBids.length} shown</span>
            <div className="inline-flex rounded-lg border border-border bg-card p-1" role="group" aria-label="View">
              {[{ v: 'pipeline', icon: LayoutGrid, label: 'Pipeline' }, { v: 'list', icon: ListIcon, label: 'List' }].map((o) => (
                <button key={o.v} type="button" onClick={() => setView(o.v)} title={o.label} aria-pressed={view === o.v}
                  className={`h-8 px-2.5 rounded-md text-sm inline-flex items-center gap-1 ${view === o.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  <o.icon className="h-4 w-4" /><span>{o.label}</span>
                </button>
              ))}
            </div>
            <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {scraperStatus?.last_run
                ? `Scraper ${fmtDate(scraperStatus.last_run, 'MMM d, h:mm a')} · ${scraperStatus.records_added ?? 0} added`
                : 'Scraper never run · daily 6 AM PT'}
              <Button size="sm" variant="ghost" className="h-7 px-2" disabled={runScraperMutation.isPending} onClick={() => runScraperMutation.mutate()} title="Run scraper now">
                {runScraperMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === 'pipeline' && filteredBids.length > 0 && (
        <BidPipeline
          bids={filteredBids}
          allBids={bids}
          belowFloorByBid={belowFloorByBid}
          onAdd={(status) => { setEditingBid(null); setNewBidStatus(status); setShowDialog(true); }}
          onOpen={(bid) => navigate(createPageUrl('BidDetail') + `?id=${bid.id}`)}
          onStatusChange={(bid, v) => { if (v === 'won') handleMarkWon(bid); else tagBidMutation.mutate({ id: bid.id, status: v }); }}
          renderActions={(bid) => (bid.linked_project_id ? (
            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-emerald-700 dark:text-emerald-300 gap-1"
              onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${bid.linked_project_id}`)}>
              <Briefcase className="h-3.5 w-3.5" /> Project
            </Button>
          ) : bid.status === 'won' ? (
            <Button size="sm" className="h-8 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
              disabled={convertToProjectMutation.isPending} onClick={() => convertToProjectMutation.mutate(bid)}>
              <ArrowRight className="h-3.5 w-3.5" /> Convert
            </Button>
          ) : null)}
        />
      )}

      {/* Bids List */}
      {(view === 'list' || filteredBids.length === 0) && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredBids.length === 0 ? (
          <div className="py-20 md:col-span-2 xl:col-span-3">
            <EmptyState
              icon={FileText}
              title="No bids found"
              description={statusFilter === 'All' ? 'Create your first bid to get started' : `No ${statusFilter} bids found matching your criteria.`}
              actionLabel="Create Bid"
              onAction={() => {
                setEditingBid(null);
                setShowDialog(true);
              }}
            />
          </div>
        ) : (
          filteredBids.map((bid) => (
            <Card
              key={bid.id}
              data-status={bid.status}
              className="group cursor-pointer rounded-xl border border-border border-l-4 border-l-[hsl(var(--brand-gold,43_67%_47%))] bg-card shadow-sm transition-shadow hover:shadow-md"
              onClick={() => navigate(createPageUrl('BidDetail') + `?id=${bid.id}`)}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-primary leading-snug line-clamp-2 group-hover:underline">
                      {bid.title || bid.project_name || 'Untitled bid'}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                      {bid.client_name || bid.agency || 'No customer'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge className={`${statusColors[bid.status] || 'bg-muted text-foreground'} rounded-full px-2.5 py-0.5 text-[11px] font-semibold`}>
                      {bidStatusLabels[bid.status] || (bid.status || 'new').replace('_', ' ')}
                    </Badge>
                    {belowFloorByBid[bid.id] && (
                      <Badge className="bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Below floor
                      </Badge>
                    )}
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <CircleDollarSign className="h-4 w-4 text-[hsl(var(--brand-gold,43_67%_47%))] flex-shrink-0" />
                    <div className="min-w-0"><dt className="text-xs text-muted-foreground">Value</dt><dd className="font-semibold tabular-nums text-primary">{bid.estimated_value ? fmtDollars(bid.estimated_value) : '—'}</dd></div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarClock className="h-4 w-4 text-[hsl(var(--brand-gold,43_67%_47%))] flex-shrink-0" />
                    <div className="min-w-0"><dt className="text-xs text-muted-foreground">Due</dt><dd className="font-semibold text-primary">{isValidDateStr(bid.due_date) ? fmtDate(bid.due_date) : '—'}</dd></div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-[hsl(var(--brand-gold,43_67%_47%))] flex-shrink-0" />
                    <div className="min-w-0"><dt className="text-xs text-muted-foreground">Location</dt><dd className="font-medium text-foreground truncate">{bid.location || '—'}</dd></div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="h-4 w-4 text-[hsl(var(--brand-gold,43_67%_47%))] flex-shrink-0" />
                    <div className="min-w-0"><dt className="text-xs text-muted-foreground">Division</dt><dd className="font-medium text-foreground truncate">{(DIVISIONS.find((d) => d.value === bid.division) || {}).label || '—'}</dd></div>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <BidStatusSelect
                    value={bid.status}
                    onChange={(v) => { if (v === 'won') handleMarkWon(bid); else tagBidMutation.mutate({ id: bid.id, status: v }); }}
                    className="h-8 w-[150px]"
                  />
                  <div className="flex items-center gap-2">
                    {bid.status === 'won' && !bid.linked_project_id && (
                      <Button size="sm"
                        className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                        disabled={convertToProjectMutation.isPending}
                        onClick={() => convertToProjectMutation.mutate(bid)}>
                        {convertToProjectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                        Convert to Project
                      </Button>
                    )}
                    {bid.linked_project_id && (
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-emerald-700 dark:text-emerald-300 gap-1"
                        onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${bid.linked_project_id}`)}>
                        <Briefcase className="h-3.5 w-3.5" /> View Project
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-primary" onClick={() => navigate(createPageUrl('BidDetail') + `?id=${bid.id}`)} title="Open bid">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      )}
    </div>
  );
}

function BidForm({ bid, onSubmit, initialStatus }) {
  const [formData, setFormData] = useState(bid || {
    title: '',
    project_name: '',
    client_name: '',
    agency: '',
    division: '',
    lv_domain: '',
    owner_name: '',
    status: initialStatus || 'review',
    estimated_value: '',
    due_date: '',
    description: '',
    scope_of_work: '',
    location: '',
    url: '',
    win_probability: 50
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [activeTab, setActiveTab] = useState(bid ? 'manual' : 'upload');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setAiPreview(null);
    try {
      const uploadedList = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedList.push({ name: file.name, url: file_url, type: file.type, size: file.size });
      }
      setUploadedFiles((prev) => [...prev, ...uploadedList]);
      toast.info('AI analyzing document...');
      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this bid/RFP document and extract: project title, agency/client name, location, estimated contract value (number), bid due date (YYYY-MM-DD), scope of work description, and project type (commercial/residential/industrial/government/infrastructure). Return JSON only.`,
        file_urls: uploadedList.map((f) => f.url),
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            project_name: { type: 'string' },
            agency: { type: 'string' },
            client_name: { type: 'string' },
            location: { type: 'string' },
            estimated_value: { type: 'number' },
            due_date: { type: 'string' },
            description: { type: 'string' },
            scope_of_work: { type: 'string' },
            project_type: { type: 'string' }
          }
        }
      });
      let parsed = llmResponse;
      if (typeof llmResponse === 'string') { try { parsed = JSON.parse(llmResponse); } catch { parsed = {}; } }
      else if (llmResponse?.output) { parsed = typeof llmResponse.output === 'string' ? JSON.parse(llmResponse.output) : llmResponse.output; }
      else if (llmResponse?.result) { parsed = typeof llmResponse.result === 'string' ? JSON.parse(llmResponse.result) : llmResponse.result; }
      setAiPreview(parsed);
      const merged = { ...formData, ...parsed, title: parsed.title || parsed.project_name || formData.title, source_files: uploadedList };
      delete merged.project_type;
      if (merged.title) onSubmit(merged);
      toast.success('AI extraction ready. Click Apply to fill form.');
    } catch (err) {
      toast.error('AI analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleApplyAi = () => {
    if (!aiPreview) return;
    setFormData((prev) => ({
      ...prev,
      title: aiPreview.title || aiPreview.project_name || prev.title,
      project_name: aiPreview.project_name || aiPreview.title || prev.project_name,
      agency: aiPreview.agency || prev.agency,
      client_name: aiPreview.client_name || aiPreview.agency || prev.client_name,
      location: aiPreview.location || prev.location,
      estimated_value: hasNum(aiPreview.estimated_value) && Number(aiPreview.estimated_value) > 0 ? Number(aiPreview.estimated_value) : prev.estimated_value,
      due_date: isValidDateStr(aiPreview.due_date) ? String(aiPreview.due_date).slice(0, 10) : prev.due_date,
      description: aiPreview.description || prev.description,
      scope_of_work: aiPreview.scope_of_work || aiPreview.description || prev.scope_of_work
    }));
    setAiPreview(null);
    setActiveTab('manual');
    toast.success('Form filled from AI extraction!');
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{bid ? 'Edit Bid' : 'Create New Bid'}</DialogTitle>
      </DialogHeader>
      {!bid && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 w-full">
            <TabsTrigger value="upload" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Upload &amp; AI Fill
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Manual Entry
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-3 mt-3">
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-amber-300 dark:border-amber-500/40 rounded-xl p-6 hover:border-amber-500 hover:bg-amber-50 transition-all text-center">
                {uploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 mx-auto text-amber-600 dark:text-amber-300 animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading &amp; analyzing...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                    <p className="font-semibold text-foreground">Drop bid document here</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel &middot; AI auto-fills all fields</p>
                  </>
                )}
                <input type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" />
              </div>
            </label>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                    <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />{f.name}
                  </div>
                ))}
              </div>
            )}
            {aiPreview && (
              <div className="bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/40 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
                    <Sparkles className="h-4 w-4" /> AI Extracted
                  </div>
                  <Button size="sm" onClick={handleApplyAi} className="bg-primary hover:bg-primary/90 text-primary-foreground h-7 text-xs gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Apply
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
                  {aiPreview.title && <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{aiPreview.title}</span></div>}
                  {aiPreview.agency && <div><span className="text-muted-foreground">Agency:</span> <span className="font-medium">{aiPreview.agency}</span></div>}
                  {aiPreview.estimated_value > 0 && <div><span className="text-muted-foreground">Value:</span> <span className="font-medium">{fmtDollars(aiPreview.estimated_value)}</span></div>}
                  {isValidDateStr(aiPreview.due_date) && <div><span className="text-muted-foreground">Due:</span> <span className="font-medium">{aiPreview.due_date}</span></div>}
                  {aiPreview.location && <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{aiPreview.location}</span></div>}
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="manual" className="mt-0">
            {/* manual fields rendered below */}
          </TabsContent>
        </Tabs>
      )}
      {/* Manual fields always shown when editing, or when on manual tab */}
      {(bid || activeTab === 'manual') && (
      <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold">Bid Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief title for this opportunity"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Project Name</label>
        <Input
          value={formData.project_name}
          onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
          placeholder="Official project name"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Client Name</label>
          <Input
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            placeholder="Client"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Agency</label>
          <Input
            value={formData.agency}
            onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
            placeholder="Issuing agency"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description..."
          className="h-20"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Scope of Work</label>
        <Textarea
          value={formData.scope_of_work}
          onChange={(e) => setFormData({ ...formData, scope_of_work: e.target.value })}
          placeholder="Detailed scope..."
          className="h-24"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full sm:w-auto border rounded p-2"
          >
            {bidStatuses.filter(s => s !== 'All').map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">Estimated Value</label>
          <Input
            type="number"
            value={formData.estimated_value}
            onChange={(e) => setFormData({ ...formData, estimated_value: hasNum(e.target.value) ? parseFloat(e.target.value) : '' })}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Due Date</label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Win Probability (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.win_probability}
            onChange={(e) => setFormData({ ...formData, win_probability: hasNum(e.target.value) ? parseInt(e.target.value, 10) : '' })}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Division</label>
          <select
            value={formData.division || ''}
            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option value="">— Select —</option>
            {DIVISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">LV Domain</label>
          <select
            value={formData.lv_domain || ''}
            onChange={(e) => setFormData({ ...formData, lv_domain: e.target.value })}
            className="w-full border rounded p-2"
            disabled={formData.division !== 'low_voltage'}
          >
            <option value="">— Select —</option>
            {LV_DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Owner</label>
        <Input
          value={formData.owner_name || ''}
          onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
          placeholder="Who is responsible for this bid"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Location</label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Project location"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Source URL</label>
        <Input
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Notes</label>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Internal notes..."
          className="h-20"
        />
      </div>
      </div>
      )}
      <Button onClick={() => onSubmit({ ...formData, source_files: uploadedFiles })} className="w-full sm:w-auto bg-primary hover:bg-primary/90 mt-4">
        {bid ? 'Update Bid' : 'Create Bid'}
      </Button>
    </div>
  );
}