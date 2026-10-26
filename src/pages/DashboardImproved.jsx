import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useProjectBilling } from '@/hooks/useProjectData';
import { fmtDollars } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HardHat,
  FileText,
  Wallet,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  CalendarClock,
  Briefcase,
  Receipt,
  ChevronRight,
  Plus,
  Flag,
  Inbox,
  Sparkles,
  Download,
  Target,
  Layers,
  FileSignature,
  Hourglass,
  Percent,
  TrendingDown,
  Kanban,
  ArrowRight,
  PieChart,
  FolderKanban,
  Activity,
  Trophy,
  Send,
  PackageCheck,
  Users,
  CalendarDays,
  ListChecks,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isWithinInterval, addDays, startOfDay, isPast, isToday, formatDistanceToNow, subDays } from 'date-fns';

const NAVY = '#0F1B2D';
const GOLD = '#E8B547';

const PROJECT_TYPE_LABELS = {
  residential: 'Residential', commercial: 'Commercial', industrial: 'Industrial',
  infrastructure: 'Infrastructure', renovation: 'Renovation',
  fire_alarm_new_construction: 'Fire Alarm — New', fire_alarm_tenant_improvement: 'Fire Alarm — TI',
  fire_alarm_retrofit: 'Fire Alarm — Retrofit', fire_alarm_service_inspection: 'Fire Alarm — Service',
  fire_alarm_special_hazard: 'Fire Alarm — Special Hazard',
  low_voltage_structured_cabling: 'Structured Cabling', low_voltage_access_control: 'Access Control',
  low_voltage_cctv: 'CCTV', low_voltage_av: 'AV Systems', low_voltage_nurse_call: 'Nurse Call',
  isp_fiber_backbone: 'Fiber Backbone', isp_fiber_installation: 'Fiber Installation',
  isp_dark_fiber: 'Dark Fiber', isp_wireless: 'Wireless', isp_underground: 'Underground',
};
const PHASE_LABELS = {
  preconstruction: 'Preconstruction', foundation: 'Foundation', superstructure: 'Superstructure',
  enclosure: 'Enclosure', mep_rough: 'MEP Rough-in', interior_finishes: 'Interior Finishes',
  commissioning: 'Commissioning', closeout: 'Closeout',
};
const PO_STATUS_STYLE = {
  draft: 'bg-slate-100 text-slate-600', sent: 'bg-blue-100 text-blue-700',
  acknowledged: 'bg-indigo-100 text-indigo-700', partially_received: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};
const PRIORITY_STYLE = {
  critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700', low: 'bg-slate-100 text-slate-600',
};
const ACTIVE_STATUSES = ['awarded', 'in_progress'];
const PIPELINE_STATUSES = ['review', 'intake', 'off_pricing', 'user_analyzing', 'estimated', 'submitted'];
const OPEN_PO_STATUSES = ['draft', 'sent', 'acknowledged', 'partially_received'];

const fmtMoney = (n) => {
  const v = Number.isFinite(n) ? Number(n) : 0;
  const cents = Math.round(v * 100) / 100;
  return '$' + cents.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtCompact = (n) => {
  if (!n) return '$0';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + Math.round(n).toLocaleString('en-US');
};
const safe = (n) => (Number.isFinite(n) ? n : 0);


// ===================== Premium mockup layer (ported 1:1 from GSIS/mockups/Chief/Premium: premium.css + dashboard.src.html) =====================
// Scoped under .gsp. Dark = mockup default; light = mockup [data-theme=light], keyed off the app's html.dark class.
const GSP_CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');.gsp *,.gsp *::before,.gsp *::after{box-sizing:border-box;margin:0;padding:0}.gsp a{color:inherit;text-decoration:none}.gsp button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}.gsp table{border-collapse:collapse;width:100%} .gsp{--bg0:#050E1C; --bg1:#081426; --bg2:#0B1F3A; --bg3:#112A4D; --glass:rgba(16,36,66,.52); --glass-2:rgba(22,46,82,.62); --glass-hi:rgba(30,58,100,.55); --line:rgba(148,178,226,.10); --line-2:rgba(148,178,226,.16); --line-gold:rgba(212,165,55,.38); --gold:#D4A537; --gold-2:#F0C75E; --gold-3:#FFE3A1; --gold-dim:rgba(212,165,55,.14); --text:#E9EFF9; --text-2:#B7C4DA; --muted:#8193B0; --dim:#56698A; --green:#3DD68C; --green-dim:rgba(61,214,140,.13); --amber:#F5B544; --amber-dim:rgba(245,181,68,.14); --red:#FF6B6B; --red-dim:rgba(255,107,107,.14); --blue:#5EA8FF; --blue-dim:rgba(94,168,255,.14); --violet:#A78BFA; --violet-dim:rgba(167,139,250,.14); --teal:#2DD4BF; --r-sm:8px; --r:14px; --r-lg:18px; --r-xl:22px; --sb:252px; --shadow:0 1px 0 rgba(255,255,255,.04) inset, 0 10px 30px -12px rgba(0,0,0,.55), 0 2px 6px -2px rgba(0,0,0,.35); --ease:cubic-bezier(.22,1,.36,1); font-synthesis:none;} .gsp{font-family:'Inter',system-ui,-apple-system,Segoe UI,sans-serif; font-feature-settings:'cv11','ss01','ss03','tnum' 0; color:var(--text);font-size:14px;line-height:1.45;min-height:100vh; -webkit-font-smoothing:antialiased; background: radial-gradient(1100px 600px at 85% -10%, rgba(212,165,55,.13), transparent 60%), radial-gradient(900px 700px at -10% 20%, rgba(52,110,210,.16), transparent 60%), radial-gradient(800px 600px at 60% 120%, rgba(30,80,160,.18), transparent 60%), linear-gradient(180deg,var(--bg1),var(--bg0) 70%); background-attachment:scroll;} .gsp::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.5; background-image:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px); background-size:44px 44px; mask-image:radial-gradient(ellipse at 50% 0%,#000 20%,transparent 75%);} .gsp .num{font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1} .gsp .nav-a .badge{margin-left:auto} .gsp .content{position:relative;padding:26px 28px 48px;max-width:1480px;width:100%;margin:0 auto} .gsp .content{animation:pageIn .55s var(--ease) both} @keyframes pageIn{from{opacity:0;transform:translateY(10px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}} @keyframes pageOut{to{opacity:0;transform:translateY(-6px);filter:blur(3px)}} @keyframes vtOut{to{opacity:0}} @keyframes vtIn{from{opacity:0}} .gsp .ph{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap} .gsp .ph h1{font-size:26px;font-weight:700;letter-spacing:-.025em;line-height:1.15} .gsp .ph h1 .g{background:linear-gradient(90deg,var(--gold-3),var(--gold) 60%);-webkit-background-clip:text;background-clip:text;color:transparent} .gsp .ph p{color:var(--muted);margin-top:6px;font-size:13.5px} .gsp .ph-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap} .gsp .eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-2);margin-bottom:8px} .gsp .btn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:10px;font-weight:600;font-size:13px;border:1px solid var(--line-2);background:rgba(255,255,255,.04);color:var(--text);transition:.2s var(--ease);white-space:nowrap} .gsp .btn:hover{background:rgba(255,255,255,.08);border-color:rgba(148,178,226,.26);transform:translateY(-1px)} .gsp .btn-gold{color:#1A1203;border-color:transparent;background:linear-gradient(180deg,#F3CF6D,#D4A537);box-shadow:0 0 0 1px rgba(255,227,161,.35) inset,0 8px 24px -8px rgba(212,165,55,.65)} .gsp .btn-gold:hover{background:linear-gradient(180deg,#F7D97F,#DDAF41);box-shadow:0 0 0 1px rgba(255,227,161,.5) inset,0 10px 30px -8px rgba(212,165,55,.85)} .gsp .chip{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:600;white-space:nowrap;border:1px solid transparent} .gsp .chip::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor} .gsp .chip.nodot::before{display:none} .gsp .c-gold{color:var(--gold-2);background:var(--gold-dim);border-color:rgba(212,165,55,.22)} .gsp .c-green{color:var(--green);background:var(--green-dim);border-color:rgba(61,214,140,.2)} .gsp .c-amber{color:var(--amber);background:var(--amber-dim);border-color:rgba(245,181,68,.2)} .gsp .c-red{color:var(--red);background:var(--red-dim);border-color:rgba(255,107,107,.22)} .gsp .c-blue{color:var(--blue);background:var(--blue-dim);border-color:rgba(94,168,255,.2)} .gsp .c-violet{color:var(--violet);background:var(--violet-dim);border-color:rgba(167,139,250,.2)} .gsp .badge{display:inline-grid;place-items:center;min-width:20px;height:18px;padding:0 6px;border-radius:999px;font-size:10.5px;font-weight:700;background:rgba(255,255,255,.08);color:var(--text-2)} .gsp .badge.gold{background:var(--gold);color:#1a1203} .gsp .test{display:inline-flex;align-items:center;height:17px;padding:0 5px;border-radius:5px;font-size:9.5px;font-weight:800;letter-spacing:.08em;color:var(--gold-2);background:rgba(212,165,55,.12);border:1px solid rgba(212,165,55,.3);vertical-align:1px;margin-right:6px} .gsp .card{position:relative;border-radius:var(--r-lg);padding:18px; background:linear-gradient(180deg,rgba(24,48,86,.55),rgba(12,28,54,.50)); border:1px solid var(--line);box-shadow:var(--shadow); backdrop-filter:blur(16px) saturate(130%);-webkit-backdrop-filter:blur(16px) saturate(130%); transition:border-color .3s var(--ease),transform .3s var(--ease),box-shadow .3s var(--ease); isolation:isolate;} .gsp .card::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1; background:linear-gradient(180deg,rgba(255,255,255,.045),transparent 40%);} .gsp .card.hover:hover,.gsp .card.lift:hover{border-color:var(--line-2);transform:translateY(-2px);box-shadow:var(--shadow),0 18px 40px -20px rgba(0,0,0,.6),0 0 0 1px rgba(212,165,55,.10),0 0 40px -16px rgba(212,165,55,.30)} .gsp .card.glow{border-color:var(--line-gold);box-shadow:var(--shadow),0 0 0 1px rgba(212,165,55,.15),0 0 50px -18px rgba(212,165,55,.55)} .gsp .card-h{display:flex;align-items:center;gap:10px;margin-bottom:14px} .gsp .card-h h3{font-size:14px;font-weight:600;letter-spacing:-.01em} .gsp .card-h .sub{color:var(--muted);font-size:12px} .gsp .card-h .r{margin-left:auto;display:flex;gap:6px;align-items:center} .gsp .card-h .ico{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:rgba(212,165,55,.10);color:var(--gold-2);border:1px solid rgba(212,165,55,.18)} .gsp .card-h .ico svg{width:15px;height:15px} .gsp .link{color:var(--gold-2);font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:4px} .gsp .link:hover{color:var(--gold-3)} .gsp .link svg{width:14px;height:14px;transition:transform .2s} .gsp .link:hover svg{transform:translateX(2px)} .gsp .grid{display:grid;gap:16px} .gsp .g3{grid-template-columns:repeat(3,minmax(0,1fr))} .gsp .g6{grid-template-columns:repeat(6,minmax(0,1fr))} .gsp .span2{grid-column:span 2} .gsp .row{display:flex;align-items:center;gap:10px} .gsp .mt12{margin-top:12px} .gsp .mt16{margin-top:16px} .gsp .muted{color:var(--muted)} .gsp .dim{color:var(--dim)} .gsp .gold{color:var(--gold-2)} .gsp .green{color:var(--green)} .gsp .red{color:var(--red)} .gsp .amber{color:var(--amber)} .gsp .blue{color:var(--blue)} .gsp .small{font-size:12px} .gsp .xs{font-size:11px} .gsp .b{font-weight:600} .gsp .bb{font-weight:700} .gsp .hr{height:1px;background:var(--line);margin:14px 0} .gsp .kpi{padding:16px 16px 12px;overflow:hidden} .gsp .kpi-top{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12.5px;font-weight:500} .gsp .kpi-top .ki{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--text-2)} .gsp .kpi-top .ki svg{width:14px;height:14px} .gsp .kpi-val{font-size:30px;font-weight:750;font-weight:800;letter-spacing:-.035em;margin-top:12px;line-height:1;font-variant-numeric:tabular-nums} .gsp .kpi-val small{font-size:.55em;font-weight:700;color:var(--text-2);letter-spacing:-.01em;margin-left:1px} .gsp .kpi-meta{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px;color:var(--muted)} .gsp .delta{display:inline-flex;align-items:center;gap:3px;font-weight:600;font-size:12px} .gsp .delta svg{width:13px;height:13px} .gsp .delta.up{color:var(--green)} .gsp .delta.down{color:var(--red)} .gsp .spark{display:block;width:100%;height:38px;margin-top:10px;overflow:visible} .gsp .spark path.ln{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round} .gsp .spark .dot{filter:drop-shadow(0 0 6px currentColor)} .gsp .kpi.gold-kpi{border-color:rgba(212,165,55,.30)} .gsp .kpi::after{content:"";position:absolute;right:-40px;top:-40px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,var(--kglow,rgba(94,168,255,.14)),transparent 70%);pointer-events:none} .gsp .gs-ring{position:relative;display:inline-grid;place-items:center;flex:none} .gsp .gs-ring svg{transform:rotate(-90deg);overflow:visible} .gsp .gs-ring .trk{fill:none;stroke:rgba(148,178,226,.10)} .gsp .gs-ring .arc{fill:none;stroke-linecap:round;transition:stroke-dashoffset 1.6s var(--ease);filter:drop-shadow(0 0 6px rgba(212,165,55,.55))} .gsp .gs-ring .lbl{position:absolute;inset:0;display:grid;place-items:center;text-align:center} .gsp .gs-ring .lbl b{display:block;font-size:22px;font-weight:800;letter-spacing:-.03em;line-height:1} .gsp .gs-ring .lbl small{display:block;font-size:10.5px;color:var(--muted);margin-top:3px;letter-spacing:.06em;text-transform:uppercase} .gsp .bar{position:relative;height:7px;border-radius:999px;background:rgba(148,178,226,.10);overflow:hidden} .gsp .bar > i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:inherit;background:linear-gradient(90deg,#B98A22,var(--gold-2));box-shadow:0 0 12px rgba(212,165,55,.45);transition:width 1.4s var(--ease)} .gsp .bar.green > i{background:linear-gradient(90deg,#1F9E63,var(--green));box-shadow:0 0 12px rgba(61,214,140,.4)} .gsp .bar.amber > i{background:linear-gradient(90deg,#C9861B,var(--amber));box-shadow:0 0 12px rgba(245,181,68,.45)} .gsp .bar.red > i{background:linear-gradient(90deg,#C83E3E,var(--red));box-shadow:0 0 14px rgba(255,107,107,.55)} .gsp .bar.blue > i{background:linear-gradient(90deg,#2F6FD0,var(--blue));box-shadow:0 0 12px rgba(94,168,255,.4)} .gsp .bar.thin{height:5px} .gsp .bar.thick{height:10px} .gsp .bar .mark{position:absolute;top:-3px;bottom:-3px;width:2px;background:rgba(255,255,255,.55);border-radius:2px;z-index:2} .gsp .phases{display:flex;gap:4px} .gsp .phases span{flex:1;height:6px;border-radius:4px;background:rgba(148,178,226,.10);position:relative;overflow:hidden} .gsp .phases span i{position:absolute;inset:0;width:0;background:linear-gradient(90deg,#B98A22,var(--gold-2));transition:width 1s var(--ease);border-radius:inherit} .gsp .phases span.done i{background:linear-gradient(90deg,#1F9E63,var(--green))} .gsp .av{--s:30px;position:relative;display:inline-grid;place-items:center;width:var(--s);height:var(--s);border-radius:50%;font-size:calc(var(--s)*.38);font-weight:700;color:#fff;flex:none;letter-spacing:.01em; background:var(--avbg,linear-gradient(135deg,#3A6FD8,#1C3D7A));box-shadow:0 0 0 2px rgba(8,20,38,.9),0 0 0 3px rgba(255,255,255,.07);text-shadow:0 1px 2px rgba(0,0,0,.3)} .gsp .av.lg{--s:44px} .gsp .av.xl{--s:64px} .gsp .av.sm{--s:24px} .gsp .av.xs{--s:20px} .gsp .av .st{position:absolute;right:-1px;bottom:-1px;width:30%;height:30%;min-width:8px;min-height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 2px var(--bg1)} .gsp .av .st.away{background:var(--amber)} .gsp .av .st.off{background:var(--dim)} .gsp .av.bot{border-radius:30%;background:linear-gradient(135deg,#F3CF6D,#B4851C);color:#1a1203} .gsp .av.bot svg{width:55%;height:55%} .gsp .avs .av{margin-left:-7px} .gsp .avs .av:first-child{margin-left:0} .gsp .tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13px} .gsp .tbl th{text-align:left;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);padding:0 10px 10px;border-bottom:1px solid var(--line);white-space:nowrap} .gsp .tbl td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:middle} .gsp .tbl tr:last-child td{border-bottom:0} .gsp .tbl tbody tr{transition:background .15s} .gsp .tbl tbody tr:hover{background:rgba(255,255,255,.03)} .gsp .tbl .r{text-align:right} .gsp .tbl-wrap{overflow-x:auto;margin:0 -18px;padding:0 18px} .gsp .cell-t b{display:block;font-weight:600} .gsp .cell-t small{display:block;color:var(--muted);font-size:11.5px;margin-top:1px} .gsp .seg{display:inline-flex;padding:3px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--line)} .gsp .seg button{padding:5px 11px;border-radius:7px;font-size:12px;font-weight:600;color:var(--muted);transition:.2s} .gsp .seg button.on{background:rgba(255,255,255,.09);color:var(--text);box-shadow:0 1px 0 rgba(255,255,255,.06) inset} .gsp .tabs .on{color:var(--text)} .gsp .tabs .on::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;background:var(--gold);box-shadow:0 0 10px var(--gold);border-radius:2px} .gsp .feed{display:flex;flex-direction:column} .gsp .feed-i{position:relative;display:flex;gap:12px;padding:10px 0 12px} .gsp .feed-i:not(:last-child)::after{content:"";position:absolute;left:15px;top:42px;bottom:-2px;width:1px;background:linear-gradient(var(--line-2),transparent)} .gsp .feed-ic{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;flex:none;border:1px solid var(--line)} .gsp .feed-ic svg{width:15px;height:15px} .gsp .feed-b{font-size:13px;color:var(--text-2)} .gsp .feed-b b{color:var(--text);font-weight:600} .gsp .feed-t{font-size:11.5px;color:var(--dim);margin-top:2px} .gsp .is-loading .card > *{opacity:0} .gsp .is-loading .card::after{content:"";position:absolute;inset:18px;border-radius:8px;z-index:3; background:linear-gradient(100deg,rgba(148,178,226,.07) 30%,rgba(148,178,226,.17) 50%,rgba(148,178,226,.07) 70%); background-size:300% 100%;animation:shimmer 1.3s linear infinite; -webkit-mask:linear-gradient(#000 0 0) 0 0/38% 12px no-repeat,linear-gradient(#000 0 0) 0 26px/72% 22px no-repeat,repeating-linear-gradient(#000 0 9px,transparent 9px 22px) 0 66px/100% calc(100% - 66px) no-repeat; mask:linear-gradient(#000 0 0) 0 0/38% 12px no-repeat,linear-gradient(#000 0 0) 0 26px/72% 22px no-repeat,repeating-linear-gradient(#000 0 9px,transparent 9px 22px) 0 66px/100% calc(100% - 66px) no-repeat;} .gsp .card > *{transition:opacity .5s var(--ease)} .gsp .loaded .card{animation:cardIn .6s var(--ease) both;animation-delay:calc(var(--i,0) * 45ms)} @keyframes cardIn{from{opacity:.0;transform:translateY(8px) scale(.995)}to{opacity:1;transform:none}} @keyframes shimmer{from{background-position:100% 0}to{background-position:-50% 0}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}} @keyframes glowPulse{0%,100%{box-shadow:0 0 0 1px rgba(255,107,107,.55),0 0 18px rgba(255,107,107,.45)}50%{box-shadow:0 0 0 1px rgba(255,107,107,.9),0 0 30px rgba(255,107,107,.75)}} @keyframes fadeIn{from{opacity:0}} @keyframes popIn{from{opacity:0;transform:translateY(-8px) scale(.98)}} .gsp .stat-mini{display:flex;flex-direction:column;gap:3px} .gsp .stat-mini small{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600} .gsp .stat-mini b{font-size:18px;font-weight:700;letter-spacing:-.02em} .gsp .dotc{width:8px;height:8px;border-radius:50%;flex:none} @media (max-width:1180px){.gsp .g6{grid-template-columns:repeat(3,minmax(0,1fr))}} @media (max-width:920px){.gsp .g3{grid-template-columns:minmax(0,1fr)} .gsp .span2{grid-column:auto}} @media (max-width:640px){.gsp .content{padding:18px 14px 40px} .gsp .ph h1{font-size:22px} .gsp .g6{grid-template-columns:repeat(2,minmax(0,1fr))} .gsp .kpi-val{font-size:24px} .gsp .kpi-meta{white-space:nowrap;overflow:hidden} .gsp .card{padding:15px;border-radius:16px} .gsp .ph-actions .btn:not(.btn-gold){display:none} .gsp .hide-m{display:none !important} .gsp .card-h .sub{display:none} .gsp .card-h{flex-wrap:wrap} .gsp .tbl-wrap{margin:0 -15px;padding:0 15px}} html:not(.dark) .gsp{--bg0:#E9EEF6; --bg1:#F3F6FB; --bg2:#FFFFFF; --bg3:#E3E9F3; --line:rgba(11,31,58,.09); --line-2:rgba(11,31,58,.15); --line-gold:rgba(184,137,31,.45); --gold:#C8961F; --gold-2:#A67812; --gold-3:#86600C; --gold-dim:rgba(200,150,31,.13); --text:#0B1F3A; --text-2:#2D4260; --muted:#5A6B84; --dim:#8A97AB; --green:#119A5B; --green-dim:rgba(17,154,91,.11); --amber:#C27A0B; --amber-dim:rgba(194,122,11,.12); --red:#D64545; --red-dim:rgba(214,69,69,.10); --blue:#2B6FCF; --blue-dim:rgba(43,111,207,.10); --violet:#6F52D6; --violet-dim:rgba(111,82,214,.10); --teal:#0E9C8A; --shadow:0 1px 0 rgba(255,255,255,.9) inset,0 10px 30px -14px rgba(11,31,58,.22),0 2px 6px -2px rgba(11,31,58,.08); color-scheme:light;} html:not(.dark) .gsp{background: radial-gradient(1100px 600px at 85% -10%, rgba(212,165,55,.16), transparent 60%), radial-gradient(900px 700px at -10% 20%, rgba(52,110,210,.10), transparent 60%), linear-gradient(180deg,#F5F7FB,#E9EEF6 70%);background-attachment:scroll} html:not(.dark) .gsp::before{background-image:linear-gradient(rgba(11,31,58,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(11,31,58,.035) 1px,transparent 1px)} html:not(.dark) .gsp .btn,html:not(.dark) .gsp .seg{background:rgba(255,255,255,.8)} html:not(.dark) .gsp .btn-gold{background:linear-gradient(180deg,#F3CF6D,#D4A537);color:#1A1203} html:not(.dark) .gsp .seg button.on{background:#fff;box-shadow:0 1px 3px rgba(11,31,58,.12)} html:not(.dark) .gsp .card{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.78))} html:not(.dark) .gsp .card::before{background:linear-gradient(180deg,rgba(255,255,255,.7),transparent 40%)} html:not(.dark) .gsp .card.glow{box-shadow:var(--shadow),0 0 0 1px rgba(200,150,31,.25),0 0 50px -20px rgba(200,150,31,.55)} html:not(.dark) .gsp .ph h1 .g{background:linear-gradient(90deg,#B8861A,#8A6410);-webkit-background-clip:text;background-clip:text} html:not(.dark) .gsp .gs-ring .trk,html:not(.dark) .gsp .bar,html:not(.dark) .gsp .phases span,html:not(.dark) .gsp .po-steps i:not(.on):not(.ok){background:rgba(11,31,58,.08);stroke:rgba(11,31,58,.08)} html:not(.dark) .gsp .bar{background:rgba(11,31,58,.08)} html:not(.dark) .gsp .av{box-shadow:0 0 0 2px #fff,0 0 0 3px rgba(11,31,58,.08)} html:not(.dark) .gsp .av .st{box-shadow:0 0 0 2px #fff} html:not(.dark) .gsp .test{color:#8A6410;background:rgba(200,150,31,.14);border-color:rgba(200,150,31,.4)} html:not(.dark) .gsp .kpi-top .ki,html:not(.dark) .gsp .feed-ic{background:rgba(11,31,58,.04)} html:not(.dark) .gsp .pcol{background:rgba(11,31,58,.03)} html:not(.dark) .gsp .pcard,html:not(.dark) .gsp .crew-c,html:not(.dark) .gsp .up-d,html:not(.dark) .gsp .hero .st{background:#fff} html:not(.dark) .gsp .tbl tbody tr:hover{background:rgba(11,31,58,.03)} html:not(.dark) .gsp{background: radial-gradient(900px 500px at 90% -5%, rgba(212,165,55,.07), transparent 60%), radial-gradient(800px 600px at -5% 30%, rgba(52,110,210,.05), transparent 60%), #FFFFFF;background-attachment:scroll} html:not(.dark) .gsp::before{opacity:.35} html:not(.dark) .gsp .card{background:linear-gradient(180deg,rgba(243,246,250,.88),rgba(228,233,241,.74)); border:1px solid rgba(255,255,255,.95); box-shadow:inset 0 1px 0 #fff,0 0 0 1px rgba(11,31,58,.07),0 14px 34px -16px rgba(11,31,58,.30),0 3px 8px -3px rgba(11,31,58,.10); backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%)} html:not(.dark) .gsp .card::before{background:linear-gradient(180deg,rgba(255,255,255,.75),transparent 45%)} html:not(.dark) .gsp .card.hover:hover,html:not(.dark) .gsp .card.lift:hover{box-shadow:inset 0 1px 0 #fff,0 0 0 1px rgba(11,31,58,.09),0 22px 44px -18px rgba(11,31,58,.38),0 0 0 1px rgba(212,165,55,.12)} html:not(.dark) .gsp .btn-gold{color:#F3CF6D;background:linear-gradient(180deg,#17375F,#0B1F3A);border-color:rgba(212,165,55,.45); box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 10px 24px -10px rgba(11,31,58,.7),0 0 22px -6px rgba(212,165,55,.55)} html:not(.dark) .gsp .btn-gold:hover{background:linear-gradient(180deg,#1C4170,#0E2546);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 12px 28px -10px rgba(11,31,58,.8),0 0 28px -4px rgba(212,165,55,.7)} html:not(.dark) .gsp :is(.tb,.card.glow,.kpi.gold-kpi,.card.attn,.warn,.q.best){--text:#E9EFF9;--text-2:#B7C4DA;--muted:#8FA1BD;--dim:#6A7D9C; --line:rgba(148,178,226,.13);--line-2:rgba(148,178,226,.22);--line-gold:rgba(212,165,55,.42); --gold:#D4A537;--gold-2:#F0C75E;--gold-3:#FFE3A1;--gold-dim:rgba(212,165,55,.15); --green:#3DD68C;--green-dim:rgba(61,214,140,.14);--amber:#F5B544;--amber-dim:rgba(245,181,68,.15); --red:#FF6B6B;--red-dim:rgba(255,107,107,.15);--blue:#5EA8FF;--blue-dim:rgba(94,168,255,.15);--violet:#A78BFA;--violet-dim:rgba(167,139,250,.15); color:var(--text)} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.q.best){background:radial-gradient(120% 90% at 100% 0%,rgba(212,165,55,.14),transparent 55%),linear-gradient(160deg,#16365F 0%,#0B1F3A 58%,#081830 100%); border:1px solid rgba(212,165,55,.38); box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 18px 40px -18px rgba(11,31,58,.75),0 0 0 4px rgba(212,165,55,.06),0 0 36px -6px rgba(212,165,55,.42)} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.q.best)::before{background:linear-gradient(180deg,rgba(255,255,255,.06),transparent 40%)} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.q.best).lift:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 24px 48px -18px rgba(11,31,58,.85),0 0 0 4px rgba(212,165,55,.08),0 0 46px -4px rgba(212,165,55,.55)} html:not(.dark) .gsp :is(.warn,.card.attn.alert){background:radial-gradient(100% 120% at 0% 0%,rgba(255,107,107,.22),transparent 55%),linear-gradient(160deg,#16365F,#0B1F3A 60%,#081830); border:1px solid rgba(255,107,107,.55); box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 18px 40px -18px rgba(11,31,58,.75),0 0 0 4px rgba(255,107,107,.07),0 0 36px -4px rgba(255,107,107,.5)} html:not(.dark) .gsp :is(.tb,.card.glow,.kpi.gold-kpi,.card.attn,.warn,.q.best) :is(.ic-btn,.tb-search,.btn:not(.btn-gold),.seg,.input,kbd){background:rgba(255,255,255,.05);border-color:var(--line-2);color:var(--text-2)} html:not(.dark) .gsp :is(.tb,.card.glow,.kpi.gold-kpi,.card.attn,.warn,.q.best) .btn-ok{color:var(--green);background:var(--green-dim);border-color:rgba(61,214,140,.35)} html:not(.dark) .gsp :is(.tb,.card.glow,.kpi.gold-kpi,.card.attn,.warn,.q.best) .ic-btn:hover{background:rgba(255,255,255,.1);color:#fff} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.warn,.q.best) .btn-gold{color:#1A1203;background:linear-gradient(180deg,#F3CF6D,#D4A537);border-color:transparent;box-shadow:0 0 0 1px rgba(255,227,161,.35) inset,0 8px 24px -8px rgba(212,165,55,.75)} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.q.best) :is(.gs-ring .trk){stroke:rgba(148,178,226,.14)} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.q.best) :is(.bar,.phases span,.prob){background:rgba(148,178,226,.14)} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.q.best) :is(.hero .st,.pj-nums div,.q-meta div,.bcard .mini div,.hcard,.doc,.kpi-top .ki,.feed-ic,.up-d,.pcard,.crew-c){background:rgba(255,255,255,.045)} html:not(.dark) .gsp :is(.tb,.card.glow,.kpi.gold-kpi,.card.attn,.q.best) .test{color:#F0C75E;background:rgba(212,165,55,.14);border-color:rgba(212,165,55,.35)} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.q.best) .av{box-shadow:0 0 0 2px #0B1F3A,0 0 0 3px rgba(255,255,255,.08)} html:not(.dark) .gsp :is(.card.glow,.kpi.gold-kpi,.card.attn,.q.best) .av .st{box-shadow:0 0 0 2px #0B1F3A} html:not(.dark) .gsp :is(.card.glow,.card.attn) :is(.sum-total b,.pay-due b){color:#FFE3A1} html:not(.dark) .gsp :is(.card.glow,.card.attn) .pay-due{background:linear-gradient(135deg,rgba(212,165,55,.2),rgba(212,165,55,.05))} html:not(.dark) .gsp :is(.card.glow,.card.attn) .seg button.on{background:rgba(255,255,255,.1);color:#fff;box-shadow:none} html:not(.dark) .gsp :is(.card.glow,.card.attn) .tbl tbody tr:hover{background:rgba(255,255,255,.04)} html:not(.dark) .gsp .card.glow .step .nd{background:#0B1F3A} html:not(.dark) .gsp .card.glow .step:not(.done):not(.cur) .nd{border-color:rgba(148,178,226,.25)} .gsp .av.xxl{--s:116px} .gsp .av.bot{box-shadow:0 0 0 1px rgba(255,255,255,.18) inset} .gsp .say.on{color:#1a1203;background:linear-gradient(180deg,#F3CF6D,#D4A537);border-color:transparent;box-shadow:0 0 16px -2px rgba(212,165,55,.7)} .gsp .say.on .eq{display:inline-flex} @keyframes eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}} @keyframes pttPulse{0%,100%{box-shadow:0 0 0 4px rgba(255,107,107,.18),0 0 18px rgba(255,107,107,.55)}50%{box-shadow:0 0 0 10px rgba(255,107,107,.06),0 0 30px rgba(255,107,107,.8)}} .gsp .bc.on{background:linear-gradient(135deg,rgba(212,165,55,.16),rgba(212,165,55,.04));border-color:rgba(212,165,55,.32);box-shadow:0 10px 30px -14px rgba(212,165,55,.55)} .gsp .bc .av{margin-top:1px} .gsp .ai-head .h-auto.on{color:var(--gold-2);border-color:var(--line-gold);background:var(--gold-dim)} .gsp .ctx-rec .cell-t b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .gsp .ctx-row .cell-t{min-width:0;flex:1} .gsp .ctx-row .cell-t b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .gsp .ctx-row .chip{color:var(--gold-2);background:var(--gold-dim);border-color:rgba(212,165,55,.25)} @keyframes ripple{0%{transform:scale(1);opacity:.85}100%{transform:scale(1.75);opacity:0}} .gsp .call-av .av{box-shadow:0 0 0 4px rgba(255,255,255,.06),0 0 60px -6px var(--bc,#D4A537)!important} @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}} .gsp .call-cap span.on{opacity:1} .gsp .cbtn.on svg{background:rgba(212,165,55,.18);border-color:rgba(212,165,55,.45);color:var(--gold-2)} .gsp .cbtn.c-mute.on svg{background:rgba(255,107,107,.18);border-color:rgba(255,107,107,.5);color:var(--red)} .gsp .orb.sm{width:32px;height:32px} @keyframes orbSpin{to{filter:hue-rotate(0deg)}} @keyframes fabIn{from{opacity:0;transform:translateY(16px) scale(.9)}} @media(max-width:640px){.gsp .ai-fab .lbl{display:none}} .gsp .pk .av{--s:34px;transition:.2s var(--ease);opacity:.8} .gsp .pk:hover .av{opacity:1;transform:translateY(-1px)} .gsp .pk.on{color:var(--text);background:rgba(212,165,55,.12);border-color:rgba(212,165,55,.3)} .gsp .pk.on .av{opacity:1;box-shadow:0 0 0 2px var(--bg1),0 0 0 3.5px var(--gold),0 0 18px rgba(212,165,55,.55)} .gsp .so-cur .muted{white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .gsp .vo-av .av{--s:88px;box-shadow:0 0 50px -6px var(--bc,#D4A537)!important} html:not(.dark) .gsp .bc.on{background:linear-gradient(135deg,rgba(212,165,55,.20),rgba(255,255,255,.7))} html:not(.dark) .gsp .ctx-row .chip{color:#86600C} html:not(.dark) .gsp .so-head .seg{background:rgba(255,255,255,.06);border-color:rgba(148,178,226,.22)} html:not(.dark) .gsp .so-head .seg button{color:#B7C4DA} html:not(.dark) .gsp .so-head .seg button.on{background:rgba(255,255,255,.12);color:#fff;box-shadow:none} html:not(.dark) .gsp .pk.on .av{box-shadow:0 0 0 2px #fff,0 0 0 3.5px var(--gold),0 0 16px rgba(212,165,55,.5)} html:not(.dark) .gsp .say.on{color:#1a1203} @keyframes bump{0%{transform:scale(1)}35%{transform:scale(1.45)}100%{transform:scale(1)}} @keyframes pulse{50%{opacity:.35}} .gsp .lt-act .btn{height:30px;font-size:12px;padding:0 11px} @keyframes ltbar{to{width:0}} .gsp .lr-typing.on{height:30px} @keyframes dt{0%,80%,100%{opacity:.25;transform:none}40%{opacity:1;transform:translateY(-3px)}} .gsp .av.xs{width:20px;height:20px;font-size:9px} .gsp .av.xs svg{width:11px;height:11px} @media(max-width:760px){.gsp .lt-act .btn{flex:1;justify-content:center}} .gsp .lr-set .seg button{font-size:11.5px;padding:4px 9px} @keyframes mfr{0%{transform:scale(.9);opacity:.9}100%{transform:scale(1.35);opacity:0}} /* page */ .gsp .kpi .ring-mini{position:absolute;right:14px;top:14px} .gsp .pipe{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px} .gsp .pcol{border-radius:12px;background:rgba(255,255,255,.025);border:1px solid var(--line);padding:10px;min-width:0} .gsp .pcol-h{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:4px} .gsp .pcol-h .dotc{box-shadow:0 0 8px currentColor} .gsp .pcol-v{font-size:16px;font-weight:700;letter-spacing:-.02em;margin-bottom:10px} .gsp .pcard{padding:9px 10px;border-radius:10px;background:rgba(14,32,60,.7);border:1px solid var(--line);margin-top:6px;transition:.2s var(--ease)} .gsp .pcard:hover{border-color:var(--line-gold);transform:translateY(-1px)} .gsp .pcard b{display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .gsp .pcard .row{margin-top:5px;font-size:11.5px;color:var(--muted);gap:6px;white-space:nowrap} .gsp .pcard .row .v{margin-left:auto;color:var(--text);font-weight:600} .gsp .bill-stats{display:flex;flex-direction:column;flex:1;min-width:0} .gsp .bill-stats .stat-mini{flex-direction:row;align-items:baseline;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--line)} .gsp .bill-stats .stat-mini:last-child{border:0} .gsp .bill-stats .stat-mini b{font-size:15px} .gsp .proj-row td:first-child{min-width:170px} .gsp .ph-lbl{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px} .gsp .crew{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px} .gsp .crew-c{display:flex;gap:11px;align-items:center;padding:11px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.025);transition:.2s var(--ease)} .gsp .crew-c:hover{border-color:var(--line-2);background:rgba(255,255,255,.045)} .gsp .crew-c .meta{min-width:0;flex:1} .gsp .crew-c b{font-size:13px;display:block} .gsp .crew-c small{display:block;font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .gsp .crew-c .bar{margin-top:7px} .gsp .up-i{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)} .gsp .up-i:last-child{border:0} .gsp .up-d{width:42px;flex:none;text-align:center;border-radius:10px;padding:5px 0;background:rgba(255,255,255,.04);border:1px solid var(--line)} .gsp .up-d b{display:block;font-size:16px;font-weight:700;line-height:1.1} .gsp .up-d small{font-size:9.5px;letter-spacing:.1em;color:var(--gold-2);font-weight:700} @media(max-width:1440px){.gsp .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}} @media(max-width:1180px) and (min-width:641px){.gsp .pipe .pcard b .test{display:none}} @media(max-width:920px){.gsp .crew{grid-template-columns:repeat(2,minmax(0,1fr))}} @media(max-width:640px){.gsp .kpis{grid-template-columns:repeat(2,minmax(0,1fr))} .gsp .pipe{grid-template-columns:repeat(2,minmax(0,1fr))} .gsp .crew{grid-template-columns:1fr} .gsp .bill-wrap{flex-direction:column;align-items:stretch!important} .gsp .bill-wrap .gs-ring{align-self:center} .gsp .bill-stats{width:100%} .gsp .kpi .ring-mini{display:none}}.gsp{position:relative;isolation:isolate;min-height:100%}.gsp::before{position:absolute}.gsp .kpi[role=button],.gsp .proj-row{cursor:pointer}.gsp .po-m{display:none;flex-direction:column;gap:8px}.gsp .po-c{display:flex;gap:11px;align-items:center;width:100%;text-align:left;padding:11px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.025);transition:.2s var(--ease)}.gsp .po-c:hover{border-color:var(--line-2);background:rgba(255,255,255,.045)}.gsp .po-c .meta{min-width:0;flex:1}.gsp .po-c b{font-size:13px;display:block}.gsp .po-c small{display:block;font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gsp .po-c small.red{color:var(--red)}.gsp .po-r{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:none}html:not(.dark) .gsp .po-c{background:#fff}@media(max-width:639px){.gsp .po-m{display:flex}.gsp .po-t{display:none}}
/* ===== v2 fixes (2026-10-17) ===== */
/* App globals (design-system.css / index.css / mobile-optimization.css) restyle bare elements; neutralise them inside .gsp so the mockup values win */
.gsp h1,.gsp h2,.gsp h3{color:inherit;line-height:1.45;letter-spacing:normal;font-family:inherit}
.gsp p{color:inherit;line-height:inherit}
.gsp button,.gsp [role=button]{min-height:0}
.gsp .tbl td{font-size:inherit}
/* Cancel the Layout wrapper gutters (Layout motion.div p-2/sm:p-3/md:p-4/lg:p-6 + mobile-optimization.css main{padding:0 1rem} at <=768px) so .content padding alone sets the gutter, as in the mockup (14px at 390) */
.gsp{margin:-8px -24px}
@media(min-width:640px){.gsp{margin:-12px -28px}}
@media(min-width:768px){.gsp{margin:-16px -32px}}
@media(min-width:769px){.gsp{margin:-16px}}
@media(min-width:1024px){.gsp{margin:-24px}}
/* premium.css base icon size (lucide-react renders 24px otherwise) */
:where(.gsp) .lucide{width:16px;height:16px;stroke-width:1.9;flex:none}
.gsp .link{white-space:nowrap}
/* KPI mini ring never covers the title */
.gsp .kpi.has-ring .kpi-top{padding-right:52px}
@media(max-width:640px){.gsp .kpi.has-ring .kpi-top{padding-right:0}}
/* Owner Action Items (premium card) */
.gsp .oai{container-type:inline-size}
.gsp .oai .card-h h3{white-space:nowrap}
@container (max-width:319px){.gsp .oai .link .lt{display:none}}
.gsp .oai-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.gsp .oai-s{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:9px 10px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.025);text-align:left;transition:.2s var(--ease)}
.gsp .oai-s:hover{border-color:var(--line-2);background:rgba(255,255,255,.045)}
.gsp .oai-s b{font-size:18px;font-weight:700;letter-spacing:-.02em;line-height:1}
html:not(.dark) .gsp .oai-s{background:#fff}
.gsp .oai-i{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer}
.gsp .oai-i:last-child{border:0;padding-bottom:2px}
.gsp .oai-i .cell-t{min-width:0;flex:1}
.gsp .oai-i .cell-t b,.gsp .oai-i .cell-t small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gsp .oai-i .chip{flex:none}
@media(max-width:640px){
 .gsp .content{padding-bottom:96px}
 .gsp .kpi-meta{white-space:normal;overflow:visible;flex-wrap:wrap;row-gap:2px;column-gap:6px}
 .gsp .kpi-meta .delta{white-space:nowrap}
}
`;
const GS_COLORS = { gold: ['#F0C75E', '#D4A537'], green: ['#3DD68C', '#1F9E63'], blue: ['#5EA8FF', '#2F6FD0'], red: ['#FF6B6B', '#C83E3E'], violet: ['#A78BFA', '#7C5CE0'], amber: ['#F5B544', '#C9861B'], teal: ['#2DD4BF', '#0F9C8A'] };
const GS_AVG = [['#5EA8FF', '#2440A0'], ['#F0C75E', '#B4851C'], ['#3DD68C', '#147A4C'], ['#A78BFA', '#5B3FC4'], ['#FF8A8A', '#B23A5A'], ['#2DD4BF', '#0E6E7A'], ['#F59E6B', '#B4542A'], ['#7DD3FC', '#2563EB']];
const PIPE_STAGES = [
  // Mockup labels/order/colours (dashboard.html). Status mapping is ours.
  { key: 'new', label: 'New', statuses: ['review', 'intake'], color: 'var(--blue)' },
  { key: 'bidding', label: 'Bidding', statuses: ['off_pricing', 'user_analyzing', 'estimated'], color: 'var(--gold)' },
  { key: 'submitted', label: 'Submitted', statuses: ['submitted'], color: 'var(--violet)' },
  { key: 'won', label: 'Won', statuses: ['won'], color: 'var(--green)' },
];
const DIVISION_SHORT = { fire_alarm: 'FA', low_voltage: 'LV', drone: 'Drone', software: 'Software', other: 'Other' };
const PHASE_ORDER = ['preconstruction', 'foundation', 'superstructure', 'enclosure', 'mep_rough', 'interior_finishes', 'commissioning', 'closeout'];
const PHASE_CHIP = ['c-gold', 'c-blue', 'c-violet', 'c-green'];
const nz = (n) => { const v = Number(n); return Number.isFinite(v) ? v : 0; };
const toDate = (s) => { if (!s) return null; const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d; };
// GS.fmt('mm') from premium.js; K values drop a trailing .0 the way the mockup cards read ($46.5K, $612K)
const gsMM = (v, dec) => {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  const n = Number(v); const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(dec ?? 2)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(dec ?? 1).replace(/\.0$/, '')}K`;
  return `$${n.toFixed(0)}`;
};
function Money({ v, dec, className }) {
  return <span className={className} title={v === null || v === undefined ? undefined : fmtMoney(Number(v))}>{gsMM(v, dec)}</span>;
}
function TestName({ name }) {
  const s = String(name || 'Untitled');
  const m = s.match(/^TEST\s+(.*)$/i);
  return m ? <><span className="test">TEST</span>{m[1]}</> : <>{s}</>;
}
const initials = (n) => String(n || '?').replace(/^TEST\s+/, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const avColor = (n) => { let h = 0; for (const c of String(n || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return GS_AVG[h % GS_AVG.length]; };
function Av({ name, size = '', st }) {
  const c = avColor(name);
  return (
    <span className={`av ${size}`} title={name} style={{ '--avbg': `linear-gradient(135deg,${c[0]},${c[1]})` }}>
      {initials(name)}{st !== undefined && <span className={`st ${st}`} />}
    </span>
  );
}
// GS.spark from premium.js (Catmull-Rom path + gradient fill)
function GsSpark({ data, color = 'gold' }) {
  const id = React.useId().replace(/:/g, '');
  if (!data || data.length < 2 || data.every((v) => v === data[0])) return null;
  const col = GS_COLORS[color] || GS_COLORS.gold;
  const W = 200; const H = 38; const pad = 3; const mn = Math.min(...data); const mx = Math.max(...data); const rg = (mx - mn) || 1;
  const pts = data.map((v, i) => [i * (W / (data.length - 1)), pad + (H - pad * 2) * (1 - (v - mn) / rg)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]; const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={`sg${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col[0]} stopOpacity=".32" /><stop offset="1" stopColor={col[0]} stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#sg${id})`} />
      <path className="ln" d={d} stroke={col[0]} />
    </svg>
  );
}
// GS.gs-ring from premium.js
function GsRing({ value, size = 120, stroke = 10, color = 'gold', label, dec = 0, mini, className = '' }) {
  const id = React.useId().replace(/:/g, '');
  const col = GS_COLORS[color] || GS_COLORS.gold;
  const r = (size - stroke) / 2; const C = 2 * Math.PI * r;
  const ok = value !== null && value !== undefined && Number.isFinite(value);
  const pctTxt = ok ? `${Number(value).toFixed(dec)}%` : '—';
  return (
    <div className={`gs-ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs><linearGradient id={`rg${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={col[0]} /><stop offset="1" stopColor={col[1]} /></linearGradient></defs>
        <circle className="trk" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        {ok && <circle className="arc" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke={`url(#rg${id})`} strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(Math.max(value, 0), 100) / 100)} style={{ filter: `drop-shadow(0 0 ${Math.max(4, stroke / 1.6)}px ${col[0]}88)` }} />}
      </svg>
      <div className="lbl">
        {mini ? <b className="xs bb">{ok ? `${Math.round(value)}%` : '—'}</b>
          : <div><b className="num" style={{ fontSize: Math.round(size * 0.2) }}>{pctTxt}</b>{label && <small>{label}</small>}</div>}
      </div>
    </div>
  );
}
function GsKpi({ icon: Icon, title, value, full, meta, spark, color, kglow, className = '', ring, ringColor, onClick, valueStyle }) {
  return (
    <div className={`card kpi lift ${ring !== undefined ? 'has-ring' : ''} ${className}`} style={{ '--kglow': kglow }} role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}>
      <div className="kpi-top"><span className="ki"><Icon /></span>{title}</div>
      <div className="kpi-val" title={full} style={valueStyle}>{value}</div>
      <div className="kpi-meta">{meta}</div>
      {ring !== undefined && <GsRing className="ring-mini" value={ring} size={46} stroke={5} color={ringColor || color} mini />}
      <GsSpark data={spark} color={color} />
    </div>
  );
}
function Delta({ n, fmt = (x) => String(x), goodUp = true, suffix }) {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  const up = n >= 0; const good = goodUp ? up : !up;
  return <span className={`delta ${good ? 'up' : 'down'}`}>{up ? <TrendingUp /> : <TrendingDown />}{up && n > 0 ? '+' : ''}{fmt(n)}{suffix}</span>;
}
function lastMonths(n = 6) {
  const out = []; const d = new Date();
  for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push({ y: x.getFullYear(), m: x.getMonth() }); }
  return out;
}
function monthlySeries(rows, dateField, valueFn, cumulative = false, n = 10) {
  const months = lastMonths(n); const vals = months.map(() => 0); let before = 0; let any = false;
  rows.forEach((r) => {
    const t = toDate(r?.[dateField]); if (!t) return;
    const v = valueFn(r); any = true;
    const idx = months.findIndex((mm) => mm.y === t.getFullYear() && mm.m === t.getMonth());
    if (idx >= 0) vals[idx] += v; else if (t < new Date(months[0].y, months[0].m, 1)) before += v;
  });
  if (!any) return null;
  if (!cumulative) return vals;
  let run = before; return vals.map((v) => (run += v));
}
// Owner Action Items in the premium card style. Same queryKey + queryFn as components/dashboard/OwnerActionItemsPanel,
// so the cache is shared and no extra read is made (the panel itself rendered unstyled inside .gsp: the mockup reset strips its Tailwind padding).
const OAI_STATUSES = ['Open', 'In Progress', 'Waiting', 'Done'];
const OAI_STATUS_CHIP = { Open: 'c-amber', 'In Progress': 'c-blue', Waiting: 'c-violet', Done: 'c-green' };
function OwnerActionItemsCard({ orgId, onOpen }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['owner-action-items', orgId],
    queryFn: async () => {
      const query = orgId ? { organization_id: orgId } : {};
      const page = await base44.entities.OwnerActionItem.filter(query, { sort: 'sort_order', limit: 500 });
      return page?.items || page || [];
    },
    enabled: !!orgId,
  });
  const counts = React.useMemo(() => {
    const c = { Open: 0, 'In Progress': 0, Waiting: 0, Done: 0 };
    items.forEach((i) => { if (c[i.status] !== undefined) c[i.status] += 1; });
    return c;
  }, [items]);
  const openItems = React.useMemo(() => items.filter((i) => i.status !== 'Done').slice(0, 5), [items]);
  return (
    <div className="card oai">
      <div className="card-h"><span className="ico"><ListChecks /></span><h3>Owner Action Items</h3>{counts.Open > 0 && <span className="chip c-gold nodot num">{counts.Open} open</span>}<div className="r"><button className="link" onClick={onOpen} title="View all" aria-label="View all action items"><span className="lt">View all</span><ArrowRight /></button></div></div>
      <div className="oai-stats">
        {OAI_STATUSES.map((s) => (
          <button type="button" key={s} className="oai-s" onClick={onOpen}><span className={`chip ${OAI_STATUS_CHIP[s]}`}>{s}</span><b className="num">{isLoading ? '…' : counts[s]}</b></button>
        ))}
      </div>
      <div className="hr" />
      {isLoading ? <Skeleton className="h-24 w-full" /> : openItems.length === 0 ? (
        <div className="small muted" style={{ padding: '14px 0', textAlign: 'center' }}><ListChecks style={{ width: 22, height: 22, margin: '0 auto 6px', display: 'block' }} />No open action items. Everything's handled.</div>
      ) : openItems.map((item) => (
        <div key={item.id} className="oai-i" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}>
          <div className="cell-t"><b title={item.title}>{item.title || 'Untitled'}</b>{(item.category || item.notes) && <small title={item.notes || undefined}>{[item.category, item.notes].filter(Boolean).join(' · ')}</small>}</div>
          <span className={`chip ${OAI_STATUS_CHIP[item.status] || 'c-gold'}`}>{item.status || '—'}</span>
        </div>
      ))}
    </div>
  );
}
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const { projects, totals: billingTotals, isLoading: loadingProjects, invoices = [], payApps = [] } = useProjectBilling(orgId); // DRAFT: also reads invoices + payApps (already returned by the hook)

  const { data: openPOs = [], isLoading: loadingPOs } = useQuery({
    queryKey: ['dash-open-pos', orgId],
    queryFn: async () => {
      const res = await base44.entities.PurchaseOrder.filter({ project_id: { $ne: '' } }, { sort: '-created_date', limit: 50 });
      const items = res?.items || [];
      return items.filter((po) => OPEN_PO_STATUSES.includes(po.status));
    },
    enabled: !!orgId,
  });

  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const { data: upcomingTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['dash-upcoming-tasks', orgId],
    queryFn: async () => {
      const res = await base44.entities.Task.filter(
        { due_date: { $gte: format(today, 'yyyy-MM-dd'), $lte: format(weekEnd, 'yyyy-MM-dd') } },
        { sort: 'due_date', limit: 50, fields: ['name', 'project_id', 'due_date', 'priority', 'status'] }
      );
      const items = res?.items || [];
      return items.filter((t) => t.status !== 'completed');
    },
    enabled: !!orgId,
  });

  const { data: bidList = [], isLoading: loadingBids } = useQuery({
    queryKey: ['dash-bids-list', orgId],
    queryFn: async () => {
      // Strict org isolation (Kemar): only this org's bids; blank-org bids are not counted.
      const query = { organization_id: orgId };
      const page = await base44.entities.BidOpportunity.filter(query, { sort: '-created_date', limit: 500, fields: ['id', 'status', 'estimated_value', 'title', 'project_name', 'client_name', 'division', 'due_date', 'created_date', 'updated_date'] }); // DRAFT: extra fields so the pipeline needs no second bid read
      return (page?.items || page || []);
    },
    enabled: !!orgId,
  });

  const { data: dualStages = [], isLoading: loadingDual } = useQuery({
    queryKey: ['dash-dualtrack', orgId],
    queryFn: async () => {
      const res = await base44.entities.DualTrackStage.filter({ organization_id: orgId }, { limit: 500, fields: ['project_id', 'budget', 'actual', 'committed', 'cost_to_complete', 'field_track_status', 'money_track_status'] });
      return res?.items || [];
    },
    enabled: !!orgId,
  });

  // ---- KPI computations (real data only) ----
  const activeJobs = projects.filter((p) => ACTIVE_STATUSES.includes(p.status));
  const sumBudgetActive = activeJobs.reduce((s, p) => s + (p.budget || 0), 0);
  const sumSpentActive = activeJobs.reduce((s, p) => s + (p.spent || 0), 0);
  // Bids in Pipeline — counts the actual bids list (same data as the Bids page)
  const pipelineBids = bidList.filter((b) => PIPELINE_STATUSES.includes(b.status));
  const pipelineCount = pipelineBids.length;
  const pipelineValue = pipelineBids.reduce((s, b) => s + (b.estimated_value || 0), 0);
  // Billing totals (contract / billed / outstanding / retention) come from the same
  // useProjectBilling hook as the Billing page, so the four figures match exactly.
  const costPct = sumBudgetActive ? (sumSpentActive / sumBudgetActive) * 100 : 0;

  // DualTrack red flags — a project is flagged if any of its stages has a fade or a blocked track
  const redFlagProjectIds = React.useMemo(() => {
    const set = new Set();
    dualStages.forEach((s) => {
      const remaining = safe(s.budget) - safe(s.actual) - safe(s.committed);
      const fade = safe(s.cost_to_complete) - remaining;
      if (fade > 0 || s.field_track_status === 'blocked' || s.money_track_status === 'blocked') set.add(s.project_id);
    });
    return set;
  }, [dualStages]);

  const projectMap = React.useMemo(() => {
    const m = {};
    projects.forEach((p) => { m[p.id] = p; });
    return m;
  }, [projects]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const fadeFlag = (p) => {
    if (redFlagProjectIds.has(p.id)) return { label: 'Red Flag', tone: 'red' };
    const forecast = p.projected_final_cost || p.spent || 0;
    if (!p.budget) return { label: '—', tone: 'muted' };
    return forecast > p.budget
      ? { label: 'Fade', tone: 'red' }
      : { label: 'On Track', tone: 'green' };
  };
  const flagStyle = { red: 'bg-red-100 text-red-700', green: 'bg-emerald-100 text-emerald-700', muted: 'bg-slate-100 text-slate-500' };


  // ===================== DRAFT additions (live KPI logic above is unchanged) =====================
  // Calendar events: same queryKey + queryFn as the Calendar page, so the cache is shared.
  const calProjectIds = projects.map((p) => p.id);
  const { data: calEvents = [] } = useQuery({
    queryKey: ['calendarEvents', calProjectIds.length],
    queryFn: async () => {
      const list = await base44.entities.CalendarEvent.list('-start_date').catch(() => []);
      if (!calProjectIds.length) return Array.isArray(list) ? list : [];
      return (Array.isArray(list) ? list : []).filter((e) => !e.project_id || calProjectIds.includes(e.project_id));
    },
    enabled: !!user,
  });
  // Avg Margin (Chief-approved): same queryKey + queryFn as the Bids page (bid-estimates-all), so the cache is shared.
  const { data: bidEstimates = [] } = useQuery({
    queryKey: ['bid-estimates-all', user?.organization_id],
    queryFn: async () => {
      const oid = user?.organization_id;
      const query = oid ? { organization_id: oid } : {};
      const page = await base44.entities.BidEstimate.filter(query, { limit: 500 });
      return page?.items || page || [];
    },
    enabled: !!user,
  });
  // Crew Snapshot: same queryKeys + queryFns as Team Management, so the cache is shared.
  const { data: workers = [] } = useQuery({
    queryKey: ['workers', user?.organization_id],
    queryFn: () => base44.entities.Worker.filter({ organization_id: user.organization_id }),
    enabled: !!user?.organization_id,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', user?.organization_id],
    queryFn: () => base44.entities.WorkerAssignment.filter({ organization_id: user.organization_id, status: 'active' }),
    enabled: !!user?.organization_id,
  });

  const x = React.useMemo(() => {
    const now = new Date();
    const asList = (r) => (Array.isArray(r) ? r : r?.items || []);
    const bids = bidList;
    const relevant = new Set(bids.filter((b) => [...PIPELINE_STATUSES, 'won'].includes(b.status)).map((b) => b.id));
    const marginRows = asList(bidEstimates).filter((e) => relevant.has(e.bid_opportunity_id) && e.profit_margin_percent != null && Number.isFinite(Number(e.profit_margin_percent)));
    const avgMargin = marginRows.length ? marginRows.reduce((s, e) => s + Number(e.profit_margin_percent), 0) / marginRows.length : null;
    const months = lastMonths(10); const msum = months.map(() => 0); const mcnt = months.map(() => 0);
    marginRows.forEach((e) => { const d = toDate(e.created_date); if (!d) return; const i = months.findIndex((mm) => mm.y === d.getFullYear() && mm.m === d.getMonth()); if (i >= 0) { msum[i] += Number(e.profit_margin_percent); mcnt[i] += 1; } });
    let lastM = null; const marginSeries = mcnt.some(Boolean) ? msum.map((s, i) => { if (mcnt[i]) lastM = s / mcnt[i]; return lastM ?? 0; }) : null;
    const marginDelta = marginSeries && mcnt[9] && mcnt.slice(0, 9).some(Boolean) ? marginSeries[9] - marginSeries[8] : null;

    const activeBids = bids.filter((b) => PIPELINE_STATUSES.includes(b.status));
    const sparkActive = monthlySeries(activeBids, 'created_date', () => 1);
    const sparkPipeline = monthlySeries(activeBids, 'created_date', (b) => nz(b.estimated_value), true);
    const sparkContract = monthlySeries(projects, 'created_date', (p) => nz(p.budget), true);
    const billedInv = invoices.filter((i) => i.project_id && i.status !== 'draft');
    const unpaidInv = billedInv.filter((i) => i.status !== 'paid');
    const sparkBilled = monthlySeries(billedInv, 'invoice_date', (i) => nz(i.total_amount), true);
    const sparkOutstanding = monthlySeries(unpaidInv, 'invoice_date', (i) => nz(i.total_amount));
    const over30 = unpaidInv.filter((i) => { const d = toDate(i.invoice_date); return d && d < subDays(now, 30); });

    const ninety = subDays(now, 90);
    const won90 = bids.filter((b) => b.status === 'won' && (toDate(b.updated_date) || toDate(b.created_date) || now) >= ninety).length;
    const lost90 = bids.filter((b) => b.status === 'lost' && (toDate(b.updated_date) || toDate(b.created_date) || now) >= ninety).length;
    const stages = PIPE_STAGES.map((s) => { const rows = bids.filter((b) => s.statuses.includes(b.status)); return { ...s, rows, total: rows.reduce((t, b) => t + nz(b.estimated_value), 0) }; });

    const payBilled = payApps.filter((p) => p.status && p.status !== 'draft').length;

    // Recent activity from real records
    const feed = [];
    bids.filter((b) => b.status === 'won').forEach((b) => feed.push({ k: `w${b.id}`, t: toDate(b.updated_date || b.created_date), ic: Trophy, tone: 'green', body: <><b>{b.title || b.project_name || 'Bid'}</b> marked <b className="green">Won</b>{b.estimated_value != null ? ` · ${fmtDollars(b.estimated_value)}` : ''}</> }));
    bids.filter((b) => b.status === 'submitted').forEach((b) => feed.push({ k: `s${b.id}`, t: toDate(b.updated_date || b.created_date), ic: Send, tone: 'violet', body: <>Bid sent: <b>{b.title || b.project_name || 'Bid'}</b></> }));
    billedInv.forEach((i, n) => feed.push({ k: `i${i.id || n}`, t: toDate(i.invoice_date), ic: Receipt, tone: 'gold', body: <>Invoice {i.invoice_number ? `#${i.invoice_number} ` : ''}issued for <b>{projectMap[i.project_id]?.name || 'project'}</b></> }));
    openPOs.filter((po) => po.status === 'partially_received').forEach((po) => feed.push({ k: `p${po.id}`, t: toDate(po.updated_date || po.created_date), ic: PackageCheck, tone: 'blue', body: <>{po.po_number || 'PO'} <b>{po.vendor || ''}</b> partially received</> }));
    projects.filter((p) => p.budget && nz(p.spent) / p.budget >= 0.9).forEach((p) => feed.push({ k: `c${p.id}`, t: toDate(p.updated_date || p.created_date), ic: AlertTriangle, tone: 'amber', body: <><b>{p.name}</b> at {Math.round((nz(p.spent) / p.budget) * 100)}% of budget</> }));
    const feedTop = feed.filter((f) => f.t).sort((a, b) => b.t - a.t).slice(0, 5);

    // Upcoming: milestones (tasks, 7d) + calendar events + bid due dates (14d)
    const end14 = addDays(today, 14);
    const up = [];
    upcomingTasks.forEach((t) => { const d = toDate(t.due_date); if (d) up.push({ k: `t${t.id}`, d, b: t.name, s: `${projectMap[t.project_id]?.name || 'Unassigned'}${t.priority ? ` · ${t.priority}` : ''}` }); });
    calEvents.forEach((e) => { const d = toDate(e.start_date); if (d && d >= today && d <= end14) up.push({ k: `e${e.id}`, d, b: e.title || 'Event', s: [projectMap[e.project_id]?.name || e.location, e.all_day ? 'All day' : e.start_time].filter(Boolean).join(' · ') }); });
    bids.filter((b) => PIPELINE_STATUSES.includes(b.status)).forEach((b) => { const d = toDate(b.due_date); if (d && d >= today && d <= end14) up.push({ k: `b${b.id}`, d, b: 'Bid due', s: b.title || b.project_name || '' }); });
    const upTop = up.sort((a, b) => a.d - b.d).slice(0, 4);

    // Crew
    const wl = asList(workers).filter((w) => w.status !== 'inactive');
    const al = asList(assignments);
    const byWorker = {}; al.forEach((a) => { (byWorker[a.worker_id] = byWorker[a.worker_id] || []).push(a); });
    const crew = wl.map((w) => {
      const mine = byWorker[w.id] || [];
      const pid = mine[0]?.project_id || w.current_project_id;
      return { w, mine, project: projectMap[pid]?.name, double: mine.length > 1 };
    }).sort((a, b) => (b.mine.length > 0) - (a.mine.length > 0)).slice(0, 6);
    const utilized = wl.length ? Math.round((wl.filter((w) => (byWorker[w.id] || []).length > 0 || w.status === 'assigned').length / wl.length) * 100) : null;

    return {
      avgMargin, marginSeries, marginDelta, marginCount: marginRows.length,
      sparkActive, sparkPipeline, sparkContract, sparkBilled, sparkOutstanding,
      activeDelta: sparkActive ? sparkActive[9] - sparkActive[8] : null,
      pipeDeltaPct: sparkPipeline && sparkPipeline[8] ? ((sparkPipeline[9] - sparkPipeline[8]) / sparkPipeline[8]) * 100 : null,
      contractNew: sparkContract ? sparkContract[9] - sparkContract[8] : null,
      outDelta: sparkOutstanding ? sparkOutstanding[9] - sparkOutstanding[8] : null,
      over30: over30.length,
      sparkJobs: monthlySeries(projects, 'created_date', () => 1, true),
      sparkPOs: monthlySeries(openPOs, 'created_date', () => 1),
      sparkTasks: [...Array(8)].map((_, i) => upcomingTasks.filter((t) => t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === format(addDays(today, i), 'yyyy-MM-dd')).length),
      stages, winRate: won90 + lost90 ? Math.round((won90 / (won90 + lost90)) * 100) : null,
      payBilled, payTotal: payApps.length,
      feedTop, upTop, crew, crewCount: wl.length, utilized,
      openPOTotal: openPOs.reduce((s, po) => s + nz(po.total), 0),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidList, bidEstimates, projects, invoices, payApps, openPOs, upcomingTasks, calEvents, workers, assignments, projectMap]);

  const t = billingTotals || {};
  const pct = (a, b) => (b ? (a / b) * 100 : null);
  const go = (page) => () => navigate(createPageUrl(page));
  const activeJobsIP = projects.filter((p) => p.status === 'in_progress').length;
  const marginColor = x.avgMargin == null ? undefined : x.avgMargin < 20 ? 'var(--red)' : x.avgMargin < 25 ? 'var(--amber)' : 'var(--green)';
  const firstName = (user?.full_name || '').split(' ')[0];
  const [range, setRange] = React.useState('30D'); // visual only, as in the mockup

  return (
    <div className="gsp">
      <style>{GSP_CSS}</style>
      <main className="content">
        <div className="ph">
          <div>
            <div className="eyebrow"><Sparkles />{format(new Date(), 'EEEE, MMM d')} · {getGreeting()}{firstName ? `, ${firstName}` : ''}</div>
            <h1>Company <span className="g">Overview</span></h1>
            <p>Bids, contracts, billing and crews across Golden State Integrated Systems.</p>
          </div>
          <div className="ph-actions">
            <div className="seg hide-m">{['7D', '30D', 'QTD', 'YTD'].map((r) => <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>)}</div>
            <button className="btn" onClick={() => window.print()}><Download />Export</button>
            <button className="btn btn-gold" onClick={() => navigate(createPageUrl('AddBid'))}><Plus />New Bid</button>
          </div>
        </div>

        {/* KPIs: the mockup's 6 */}
        <section className="grid g6 kpis">
          <GsKpi icon={Target} title="Active Bids" value={loadingBids ? '…' : pipelineCount} color="blue" kglow="rgba(94,168,255,.16)" spark={x.sparkActive} onClick={go('Bids')}
            meta={x.activeDelta != null ? <><Delta n={x.activeDelta} />vs last month</> : 'review → submitted'} />
          <GsKpi icon={Layers} title="Pipeline Value" className="attn" value={loadingBids ? '…' : gsMM(pipelineValue)} full={fmtMoney(pipelineValue)} color="gold" kglow="rgba(212,165,55,.18)" spark={x.sparkPipeline} onClick={go('Bids')}
            meta={x.pipeDeltaPct != null ? <><Delta n={x.pipeDeltaPct} fmt={(n) => `${Math.abs(n).toFixed(1)}%`} />vs last month</> : 'active bids'} />
          <GsKpi icon={FileSignature} title="Contract Value" value={loadingProjects ? '…' : gsMM(t.contract)} full={fmtMoney(t.contract)} color="violet" kglow="rgba(167,139,250,.16)" spark={x.sparkContract} onClick={go('Billing')}
            meta={x.contractNew ? <><Delta n={x.contractNew} fmt={(n) => gsMM(Math.abs(n))} />new this month</> : 'matches Billing'} />
          <GsKpi icon={Receipt} title="Billed to Date" className="gold-kpi" value={loadingProjects ? '…' : gsMM(t.billed, 0)} full={fmtMoney(t.billed)} color="gold" kglow="rgba(212,165,55,.22)" spark={x.sparkBilled} onClick={go('Billing')}
            ring={pct(t.billed, t.contract)} meta={<span className="gold b">{t.contract ? `${Math.round((t.billed / t.contract) * 100)}% of contract` : 'invoices issued'}</span>} />
          <GsKpi icon={Hourglass} title="Outstanding" value={loadingProjects ? '…' : gsMM(t.outstanding, 0)} full={fmtMoney(t.outstanding)} color="amber" kglow="rgba(245,181,68,.15)" spark={x.sparkOutstanding} onClick={go('Billing')}
            meta={<>{x.outDelta ? <Delta n={x.outDelta} fmt={(n) => gsMM(Math.abs(n), 0)} goodUp={false} /> : null}<span className={x.over30 ? 'red b' : ''}>{x.over30 ? `${x.over30} invoice${x.over30 === 1 ? '' : 's'} >30d` : 'billed − paid'}</span></>} />
          <GsKpi icon={Percent} title="Avg Margin" value={x.avgMargin == null ? '—' : `${x.avgMargin.toFixed(1)}%`} valueStyle={{ color: marginColor }} color={x.avgMargin == null ? 'green' : x.avgMargin < 20 ? 'red' : x.avgMargin < 25 ? 'amber' : 'green'} kglow="rgba(61,214,140,.15)" spark={x.marginSeries} onClick={go('Estimates')}
            meta={x.avgMargin == null ? 'no estimates' : <>{x.marginDelta != null && <Delta n={x.marginDelta} fmt={(n) => `${Math.abs(n).toFixed(1)} pts`} />}{x.avgMargin < 20 ? <span className="red b">below 20% floor</span> : `${x.marginCount} est. · target 25–30%`}</>} />
        </section>

        {/* Pipeline + Billing */}
        <section className="grid g3 mt16">
          <div className="card span2">
            <div className="card-h"><span className="ico"><Kanban /></span><h3>Bid Pipeline</h3><span className="sub">· {pipelineCount} active · {gsMM(pipelineValue, 2)}</span><div className="r"><button className="link" onClick={go('Bids')}>Open board<ArrowRight /></button></div></div>
            <div className="pipe">
              {x.stages.map((s) => (
                <div key={s.key} className="pcol" style={s.key === 'won' ? { borderColor: 'rgba(61,214,140,.22)', background: 'linear-gradient(180deg,rgba(61,214,140,.06),rgba(255,255,255,.02))' } : undefined}>
                  <div className="pcol-h" style={{ color: s.color }}><span className="dotc" style={{ background: s.color }} /><span style={{ color: 'var(--text-2)' }}>{s.label}</span><span className="badge" style={{ marginLeft: 'auto' }}>{s.rows.length}</span></div>
                  <div className={`pcol-v num ${s.key === 'won' ? 'green' : ''}`}>{s.rows.length ? <Money v={s.total} dec={s.total >= 1e6 ? 2 : 0} /> : '—'}</div>
                  {s.rows.slice(0, 2).map((b) => {
                    const due = toDate(b.due_date); const upd = toDate(b.updated_date);
                    const late = s.key === 'bidding' && due && isPast(due) && !isToday(due);
                    const rowTxt = s.key === 'new' ? (DIVISION_SHORT[b.division] || '—')
                      : s.key === 'bidding' ? (due ? `Due ${format(due, 'MMM d')}` : '—')
                        : s.key === 'submitted' ? (upd ? format(upd, 'MMM d') : '—')
                          : (upd ? `Won ${format(upd, 'MMM d')}` : 'Won');
                    return (
                      <div key={b.id} className="pcard" role="button" onClick={() => navigate(`${createPageUrl('BidDetail')}?id=${encodeURIComponent(b.id)}`)} style={s.key === 'won' ? { borderColor: 'rgba(61,214,140,.25)' } : undefined}>
                        <b><TestName name={b.title || b.project_name} /></b>
                        <div className="row"><span style={late ? { color: 'var(--red)', fontWeight: 600 } : undefined}>{rowTxt}</span><span className="v">{b.estimated_value == null ? '—' : s.key === 'won' ? <span title={fmtMoney(b.estimated_value)}>{fmtDollars(b.estimated_value)}</span> : <Money v={b.estimated_value} />}</span></div>
                      </div>
                    );
                  })}
                  {s.key === 'won' && <div className="pcard" style={{ opacity: 0.6, borderStyle: 'dashed', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Win rate <b style={{ display: 'inline', color: 'var(--green)' }}>{x.winRate == null ? '—' : `${x.winRate}%`}</b> · 90d</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="card glow">
            <div className="card-h"><span className="ico"><PieChart /></span><h3>Billing / SOV</h3><div className="r"><button className="link" onClick={go('Billing')}>Details<ArrowRight /></button></div></div>
            <div className="row bill-wrap" style={{ gap: 20, alignItems: 'center' }}>
              <GsRing value={pct(t.billed, t.contract)} size={124} stroke={11} label="Billed" dec={1} />
              <div className="bill-stats">
                <div className="stat-mini"><small>Contract</small><b className="num"><Money v={t.contract} dec={2} /></b></div>
                <div className="stat-mini"><small>Billed</small><b className="num gold"><Money v={t.billed} dec={0} /></b></div>
                <div className="stat-mini"><small>Retention</small><b className="num"><Money v={t.retention} dec={1} /></b></div>
                <div className="stat-mini"><small>Remaining</small><b className="num"><Money v={t.contract != null ? Math.max(0, nz(t.contract) - nz(t.billed)) : null} dec={0} /></b></div>
              </div>
            </div>
            <div className="hr" />
            <div className="ph-lbl"><span>Pay apps · {x.payBilled} of {x.payTotal} submitted</span><span className="gold b">{x.payTotal ? `${Math.round((x.payBilled / x.payTotal) * 100)}%` : '—'}</span></div>
            <div className="bar"><i style={{ width: `${x.payTotal ? (x.payBilled / x.payTotal) * 100 : 0}%` }} /></div>
            <div className="row mt12 small muted"><AlertTriangle style={{ color: t.outstanding > 0 ? 'var(--red)' : 'var(--gold-2)', width: 14, height: 14 }} />Outstanding <b style={{ color: t.outstanding > 0 ? 'var(--red)' : 'var(--text)' }}><Money v={t.outstanding} dec={0} /></b> · billed − paid</div>
          </div>
        </section>

        {/* Projects + Activity */}
        <section className="grid g3 mt16">
          <div className="card span2">
            <div className="card-h"><span className="ico"><FolderKanban /></span><h3>Active Projects</h3><span className="sub">· {activeJobsIP} in progress</span><div className="r"><button className="link" onClick={go('Projects')}>All projects<ArrowRight /></button></div></div>
            {loadingProjects ? <Skeleton className="h-24 w-full" /> : activeJobs.length === 0 ? (
              <div className="small muted" style={{ padding: '18px 0', textAlign: 'center' }}><Inbox style={{ width: 22, height: 22, margin: '0 auto 6px', display: 'block' }} />No active jobs yet. Create a project or convert a won bid.</div>
            ) : (
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Project</th><th>Phase</th><th style={{ minWidth: 150 }}>Progress</th><th className="hide-m">PM</th><th className="r">Contract</th></tr></thead>
                <tbody>
                  {activeJobs.map((p, idx) => {
                    const flag = fadeFlag(p);
                    const ph = PHASE_ORDER.indexOf(p.current_phase);
                    const prog = nz(p.progress);
                    return (
                      <tr key={p.id} className="proj-row" onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${p.id}`)}>
                        <td className="cell-t"><b><TestName name={p.name} /></b><small>{flag.tone === 'red' ? <span className="red b">{flag.label}</span> : (PROJECT_TYPE_LABELS[p.project_type] || p.project_type || '—')}{p.client_name ? ` · ${p.client_name}` : ''}</small></td>
                        <td>{ph >= 0 ? <span className={`chip ${PHASE_CHIP[idx % PHASE_CHIP.length]}`}>{PHASE_LABELS[p.current_phase]}</span> : <span className="muted">—</span>}</td>
                        <td>
                          <div className="ph-lbl"><span>{ph >= 0 ? `Phase ${ph + 1} of ${PHASE_ORDER.length}` : 'Phase —'}</span><span className="num">{prog}%</span></div>
                          <div className="phases">{PHASE_ORDER.map((k, i) => <span key={k} className={ph > i ? 'done' : ''}><i style={{ width: ph > i ? '100%' : ph === i ? `${Math.min(100, prog)}%` : 0 }} /></span>)}</div>
                        </td>
                        <td className="hide-m">{p.project_manager ? <Av name={p.project_manager} size="sm" /> : <span className="muted">—</span>}</td>
                        <td className="r num b" title={fmtMoney(nz(p.budget))}>{fmtDollars(p.budget)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </div>

          <div className="card">
            <div className="card-h"><span className="ico"><Activity /></span><h3>Recent Activity</h3><div className="r"><span className="chip c-green">Live</span></div></div>
            <div className="feed">
              {x.feedTop.length === 0 ? <div className="small muted">No recent activity.</div> : x.feedTop.map((f) => {
                const Ic = f.ic;
                const tone = { green: ['var(--green-dim)', 'var(--green)'], gold: ['var(--gold-dim)', 'var(--gold-2)'], blue: ['var(--blue-dim)', 'var(--blue)'], violet: ['var(--violet-dim)', 'var(--violet)'], amber: ['var(--amber-dim)', 'var(--amber)'] }[f.tone];
                return (
                  <div key={f.k} className="feed-i"><span className="feed-ic" style={{ background: tone[0], color: tone[1] }}><Ic /></span><div><div className="feed-b">{f.body}</div><div className="feed-t">{formatDistanceToNow(f.t, { addSuffix: true })}</div></div></div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Crew + upcoming */}
        <section className="grid g3 mt16">
          <div className="card span2">
            <div className="card-h"><span className="ico"><Users /></span><h3>Crew Snapshot</h3><span className="sub">· Today · {x.crewCount} techs · {x.utilized == null ? '—' : `${x.utilized}%`} utilized</span><div className="r"><button className="link" onClick={go('TeamManagement')}>Resource board<ArrowRight /></button></div></div>
            {x.crew.length === 0 ? <div className="small muted">No crew records yet.</div> : (
              <div className="crew">
                {x.crew.map(({ w, mine, project, double }) => {
                  const score = w.productivity_score != null ? nz(w.productivity_score) : null;
                  const barCls = double ? 'red' : score != null && score < 70 ? 'amber' : 'green';
                  return (
                    <div key={w.id} className="crew-c" style={double ? { borderColor: 'rgba(255,107,107,.3)' } : undefined}>
                      <Av name={w.name || 'Tech'} size="lg" st={w.status === 'on_leave' ? 'away' : w.status === 'inactive' ? 'off' : ''} />
                      <div className="meta"><b>{w.name || 'Tech'}</b>
                        {double ? <small className="red">Double-booked · {mine.length} active jobs</small> : <small>{w.role ? w.role[0].toUpperCase() + w.role.slice(1) : 'Tech'}{project ? ` · ${project}` : ''}</small>}
                        {(score != null || double) && <div className={`bar thin ${barCls}`}><i style={{ width: `${Math.min(100, double ? 100 : score)}%` }} /></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-h"><span className="ico"><CalendarDays /></span><h3>Upcoming</h3></div>
            {x.upTop.length === 0 ? <div className="small muted">Nothing due in the next 14 days.</div> : x.upTop.map((u) => (
              <div key={u.k} className="up-i"><div className="up-d"><small>{format(u.d, 'MMM').toUpperCase()}</small><b>{format(u.d, 'd')}</b></div><div className="cell-t"><b>{u.b}</b><small>{u.s}</small></div></div>
            ))}
          </div>
        </section>

        {/* Live-only: Operations tiles (after the mockup's sections end; same KPI card style, 2-up at 390px) */}
        <div className="card-h mt16" style={{ marginBottom: 12 }}><span className="ico"><HardHat /></span><h3>Operations</h3><span className="sub">· live job, billing & field metrics</span></div>
        <section className="grid g6 kpis">
          <GsKpi icon={HardHat} title="All Jobs" value={loadingProjects ? '…' : projects.length} color="blue" kglow="rgba(94,168,255,.16)" spark={x.sparkJobs} onClick={go('Projects')}
            meta={`${activeJobs.length} active`} />
          <GsKpi icon={Wallet} title="Retention Held" value={loadingProjects ? '…' : gsMM(t.retention)} full={fmtMoney(t.retention)} color="teal" kglow="rgba(45,212,191,.15)" onClick={go('Billing')}
            meta={t.billed ? `${Math.round((nz(t.retention) / t.billed) * 100)}% of billed · pay apps` : 'from pay apps'} />
          <GsKpi icon={TrendingUp} title="Cost vs Budget" value={loadingProjects ? '…' : gsMM(sumSpentActive)} full={fmtDollars(sumSpentActive)} color={costPct > 100 ? 'red' : 'amber'} kglow={costPct > 100 ? 'rgba(255,107,107,.16)' : 'rgba(245,181,68,.15)'} onClick={go('Projects')}
            meta={<span className={costPct > 100 ? 'red b' : ''}>{sumBudgetActive ? `${Math.round(costPct)}% of ` : 'of '}<Money v={sumBudgetActive} /> budget</span>} />
          <GsKpi icon={Flag} title="DualTrack Red Flags" value={loadingDual ? '…' : redFlagProjectIds.size} valueStyle={redFlagProjectIds.size ? { color: 'var(--red)' } : undefined} color="red" kglow="rgba(255,107,107,.16)" onClick={go('Projects')}
            meta={<span className={redFlagProjectIds.size ? 'red b' : ''}>projects off track</span>} />
          <GsKpi icon={ShoppingCart} title="Open POs" value={loadingPOs ? '…' : openPOs.length} color="violet" kglow="rgba(167,139,250,.16)" spark={x.sparkPOs} onClick={go('PurchaseOrders')}
            meta={openPOs.length ? <><Money v={x.openPOTotal} /> awaiting fulfillment</> : 'awaiting fulfillment'} />
          <GsKpi icon={CalendarClock} title="Upcoming Milestones" value={loadingTasks ? '…' : upcomingTasks.length} color="blue" kglow="rgba(94,168,255,.16)" spark={upcomingTasks.length ? x.sparkTasks : null} onClick={go('Calendar')} meta="next 7 days" />
        </section>

        {/* Live-only: Open POs + Owner Action Items (no mockup equivalent; mockup card style) */}
        <section className="grid g3 mt16">
          <div className="card span2">
            <div className="card-h"><span className="ico"><ShoppingCart /></span><h3>Open Purchase Orders</h3><span className="sub">· {openPOs.length} open · {gsMM(x.openPOTotal)}</span><div className="r"><button className="link" onClick={go('PurchaseOrders')}>All POs<ArrowRight /></button></div></div>
            {openPOs.length === 0 ? <div className="small muted">No open purchase orders right now.</div> : (
              <>
              <div className="po-m">
                {openPOs.map((po) => {
                  const req = toDate(po.required_date); const late = req && isPast(req) && !isToday(req);
                  const chip = { draft: 'c-gold', sent: 'c-blue', acknowledged: 'c-violet', partially_received: 'c-amber' }[po.status] || 'c-gold';
                  return (
                    <button type="button" key={po.id} className="po-c" onClick={go('PurchaseOrders')}>
                      <div className="meta">
                        <b>{po.po_number || 'PO'}</b>
                        <small>{po.vendor || '—'}{projectMap[po.project_id]?.name ? ` · ${projectMap[po.project_id].name}` : ''}</small>
                        <small className={late ? 'red b' : ''}>{req ? `${late ? 'Late · needed' : 'Needed'} ${format(req, 'MMM d')}` : 'No required date'}</small>
                      </div>
                      <div className="po-r">
                        <span className="num bb"><Money v={po.total} /></span>
                        <span className={`chip ${chip}`}>{String(po.status || '').replace('_', ' ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="tbl-wrap po-t"><table className="tbl">
                <thead><tr><th>PO</th><th className="hide-m">Project</th><th>Status</th><th className="r">Total</th></tr></thead>
                <tbody>
                  {openPOs.map((po) => {
                    const req = toDate(po.required_date); const late = req && isPast(req) && !isToday(req);
                    const chip = { draft: 'c-gold', sent: 'c-blue', acknowledged: 'c-violet', partially_received: 'c-amber' }[po.status] || 'c-gold';
                    return (
                      <tr key={po.id}>
                        <td className="cell-t"><b>{po.po_number || 'PO'} · {po.vendor}</b><small className={late ? 'red' : ''}>{req ? `${late ? 'Late · needed' : 'Needed'} ${format(req, 'MMM d')}` : 'No required date'}</small></td>
                        <td className="hide-m">{projectMap[po.project_id]?.name || 'Unassigned'}</td>
                        <td><span className={`chip ${chip}`}>{String(po.status || '').replace('_', ' ')}</span></td>
                        <td className="r num b"><Money v={po.total} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
              </>
            )}
          </div>
          <OwnerActionItemsCard orgId={orgId} onOpen={go('OwnerActionItems')} />
        </section>
      </main>
    </div>
  );
}
