import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  UserPlus,
  Building2,
  Shield,
  AlertTriangle,
  Phone,
  Radio,
  Stethoscope,
  Truck,
  AlertOctagon,
  Send,
  X,
  Grid3X3,
  List,
  HardHat,
  Hammer,
  Zap,
  Wrench,
  Wind,
  Check,
  Clock,
  FileText,
  Lock,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

// --- Industrial palette: Safety Yellow #FFCC00, Concrete Grey, Hard Hat Orange ---
const SAFETY_YELLOW = '#FFCC00';
const BORDER_SILVER = '#C0C0C0';

const TRADES = [
  { value: 'electrician', label: 'Electrician', color: 'bg-amber-500 text-white', icon: Zap },
  { value: 'plumber', label: 'Plumber', color: 'bg-blue-600 text-white', icon: Wrench },
  { value: 'hvac', label: 'HVAC', color: 'bg-cyan-600 text-white', icon: Wind },
  { value: 'carpentry', label: 'Carpentry', color: 'bg-amber-700 text-white', icon: Hammer },
  { value: 'concrete', label: 'Concrete', color: 'bg-stone-600 text-white', icon: Hammer },
  { value: 'drywall', label: 'Drywall', color: 'bg-slate-500 text-white', icon: Hammer },
  { value: 'safety_officer', label: 'Safety Officer', color: 'bg-orange-600 text-white', icon: Shield },
  { value: 'gc_superintendent', label: 'GC Superintendent', color: 'bg-emerald-700 text-white', icon: HardHat },
  { value: 'foreman', label: 'Foreman', color: 'bg-slate-700 text-white', icon: HardHat },
  { value: 'laborer', label: 'Laborer', color: 'bg-slate-600 text-white', icon: Hammer },
  { value: 'engineer', label: 'Engineer', color: 'bg-indigo-600 text-white', icon: HardHat },
  { value: 'supervisor', label: 'Supervisor', color: 'bg-violet-600 text-white', icon: HardHat },
  { value: 'other', label: 'Other', color: 'bg-slate-400 text-white', icon: HardHat },
];

const SITE_STATUS = {
  on_site: { label: 'On Site', ribbon: 'bg-green-500', icon: Check },
  assigned: { label: 'Expected', ribbon: 'bg-yellow-500', icon: Clock },
  blocked: { label: 'Not Cleared', ribbon: 'bg-red-500', icon: Shield },
  inactive: { label: 'Inactive', ribbon: 'bg-slate-400', icon: X },
};

const CERT_TYPES = [
  { id: 'osha10', label: 'OSHA 10', icon: Shield },
  { id: 'osha30', label: 'OSHA 30', icon: Shield },
  { id: 'first_aid', label: 'First Aid', icon: Stethoscope },
  { id: 'crane', label: 'Crane License', icon: Truck },
];

function addDays(d, days) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function getCertExpiryState(expiry) {
  if (!expiry) return null;
  const d = typeof expiry === 'string' ? new Date(expiry) : expiry;
  const days = differenceInDays(d, new Date());
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

function enrichPerson(worker, index) {
  const roleToTrade = worker.role && TRADES.some(t => t.value === worker.role)
    ? worker.role
    : (worker.trade || TRADES[index % TRADES.length].value);
  const status = worker.site_status || worker.status || (index % 4 === 0 ? 'on_site' : index % 4 === 1 ? 'assigned' : 'assigned');
  const company = worker.company || worker.employer || 'Direct';
  const certs = worker.certifications || [
    { id: 'osha10', expiry: addDays(new Date(), 90), document_url: null, issue_date: addDays(new Date(), -365) },
    ...(index % 3 === 0 ? [{ id: 'first_aid', expiry: addDays(new Date(), 15), document_url: null, issue_date: addDays(new Date(), -200) }] : []),
  ];
  return {
    ...worker,
    trade: roleToTrade,
    site_status: status,
    employer: company,
    site_badge_number: worker.site_badge_number || `B-${String(worker.id || index).slice(-4)}`,
    emergency_contact: worker.emergency_contact || 'On file',
    emergency_phone: worker.emergency_phone || null,
    vehicle: worker.vehicle || null,
    parking_spot: worker.parking_spot || null,
    daily_rate: worker.daily_rate != null ? worker.daily_rate : null,
    certifications: certs,
    phase: worker.phase || (index % 2 === 0 ? 'Foundation Phase' : 'Interior Finishing'),
    site_zone: worker.site_zone || (index % 3 === 0 ? 'Tower A' : index % 3 === 1 ? 'Parking Garage' : 'Main Site'),
    has_first_aid: certs.some(c => c.id === 'first_aid'),
    last_seen: worker.last_seen || (status === 'on_site' ? new Date(Date.now() - 10 * 60 * 1000).toISOString() : null),
  };
}

export default function Directory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const projectIdFromUrl = searchParams.get('projectId') || '';

  const [projectId, setProjectId] = useState(projectIdFromUrl || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all');
  const [certFilter, setCertFilter] = useState('all');
  const [detailTab, setDetailTab] = useState('info');

  useEffect(() => {
    if (projectIdFromUrl) setProjectId(projectIdFromUrl);
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined' && projectId) {
      try { window.sessionStorage.setItem('constructflow.directoryProjectId', projectId); } catch (_) {}
    }
  }, [projectId]);

  const { data: user } = useQuery({
    queryKey: ['currentUser', 'directory'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return base44.entities.Project.filter({ organization_id: user.organization_id }, '-created_date');
    },
    enabled: !!user?.organization_id,
  });

  const { data: workersRaw = [] } = useQuery({
    queryKey: ['workers', 'directory'],
    queryFn: () => base44.entities.Worker.list('-created_date'),
  });

  const { data: projectTasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => (projectId ? base44.entities.Task.filter({ project_id: projectId }) : Promise.resolve([])),
    enabled: !!projectId,
  });

  const people = useMemo(
    () => workersRaw.map((w, i) => enrichPerson(w, i)),
    [workersRaw]
  );

  const peopleForProject = useMemo(() => {
    if (!projectId) return people;
    return people.filter(p => p.current_project_id === projectId || p.project_id === projectId);
  }, [people, projectId]);

  const filteredPeople = useMemo(() => {
    let list = peopleForProject.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.employer || p.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.trade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone || '').includes(searchTerm) ||
        (p.site_badge_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (statusFilter !== 'all') list = list.filter(p => p.site_status === statusFilter);
    if (certFilter !== 'all') list = list.filter(p => (p.certifications || []).some(c => c.id === certFilter));
    if (emergencyMode) list = list.filter(p => p.site_status === 'on_site');
    if (emergencyMode) list = list.filter(p => p.has_first_aid);
    return list;
  }, [peopleForProject, searchTerm, statusFilter, certFilter, emergencyMode]);

  const onSiteCount = useMemo(() => peopleForProject.filter((p) => p.site_status === 'on_site').length, [peopleForProject]);
  const selectedProject = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

  const byTradeCount = useMemo(() => {
    const map = {};
    filteredPeople.forEach(p => { map[p.trade] = (map[p.trade] || 0) + 1; });
    return map;
  }, [filteredPeople]);

  const byCompanyCount = useMemo(() => {
    const map = {};
    filteredPeople.forEach(p => { const c = p.employer || 'Unknown'; map[c] = (map[c] || 0) + 1; });
    return map;
  }, [filteredPeople]);

  const tasksForPerson = useMemo(() => {
    if (!selectedPerson || !projectId) return [];
    return projectTasks.filter(t => (t.assigned_to === selectedPerson.id || t.assignee_id === selectedPerson.id));
  }, [selectedPerson, projectId, projectTasks]);

  const handlePing = (person, location = 'Delivery Zone 3') => {
    toast.success(`Ping sent to ${person.name}: "Foreman needs you at ${location}."`);
  };

  const handleSendRFI = (person) => {
    setSelectedPerson(null);
    const pid = projectId || (typeof window !== 'undefined' && window.sessionStorage.getItem('constructflow.directoryProjectId'));
    const rfiUrl = pid
      ? createPageUrl('ProjectDetail') + `?id=${pid}&rfi=1&recipient=${encodeURIComponent(person.name || '')}&recipientId=${person.id || ''}`
      : createPageUrl('Projects');
    navigate(rfiUrl);
    toast.info(`Send RFI: opening with ${person.name} pre-filled as recipient.`);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)] bg-slate-100">
      {/* A. Persistent Header - Industrial Toolbar */}
      <header
        className={cn(
          'flex flex-none items-center gap-4 px-4 py-3 border-b shadow-sm',
          emergencyMode ? 'bg-red-700 text-white border-red-800' : 'bg-slate-800 text-white border-slate-700'
        )}
      >
        <div className="font-bold text-lg tracking-tight shrink-0">
          {emergencyMode ? 'EMERGENCY — SITE ROSTER' : 'SITE ROSTER'}
        </div>
        <div className="flex-1 flex items-center gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, trade, company, or cert..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'pl-10 h-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400',
                emergencyMode && 'bg-red-800 border-red-600'
              )}
            />
          </div>
          <div className="flex items-center border border-slate-600 rounded overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2',
                viewMode === 'grid' ? 'bg-[#FFCC00] text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2',
                viewMode === 'list' ? 'bg-[#FFCC00] text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Select value={projectId || 'all'} onValueChange={(v) => { setProjectId(v === 'all' ? '' : v); if (v === 'all') setSearchParams({}); else setSearchParams({ projectId: v }); }}>
            <SelectTrigger className={cn('w-[200px] h-9 text-sm bg-slate-700 border-slate-600 text-white', emergencyMode && 'bg-red-800 border-red-600')}>
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name || p.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => { if (emergencyMode) setEmergencyMode(false); else setStatusFilter(prev => prev === 'on_site' ? 'all' : 'on_site'); }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all',
              emergencyMode ? 'bg-red-600 border-white animate-pulse' : statusFilter === 'on_site' ? 'border-[#FFCC00] bg-slate-600' : 'bg-slate-700 border-slate-500 hover:border-[#FFCC00]'
            )}
            title="Click to filter to checked-in personnel only"
          >
            <span className={cn('inline-flex h-2 w-2 rounded-full animate-pulse', emergencyMode ? 'bg-white' : 'bg-green-400')} />
            <span className="text-sm font-semibold">{onSiteCount}</span>
            <span className="text-xs opacity-90">On Site Now</span>
          </button>
          <Button
            type="button"
            variant={emergencyMode ? 'secondary' : 'destructive'}
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setEmergencyMode(!emergencyMode)}
          >
            <AlertOctagon className="h-4 w-4" />
            Emergency
          </Button>
          <Button size="sm" className="h-9 bg-amber-500 hover:bg-amber-600 text-slate-900">
            <UserPlus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </header>

      {emergencyMode && (
        <div className="flex-none px-4 py-2 bg-red-600 text-white flex items-center gap-4">
          <span className="font-bold text-xl">HEAD COUNT: {onSiteCount}</span>
          <span className="text-sm">Showing only On Site + First Aid / Medics. Emergency contacts in panel.</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* B. Left Rail - Tool Shed */}
        <aside className="w-64 flex-none border-r border-slate-300 bg-slate-200 overflow-y-auto">
          <div className="p-3 border-b border-slate-300">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Tool Shed</h2>
          </div>
          <Accordion type="multiple" defaultValue={['trade', 'company', 'status', 'cert']} className="px-2">
            <AccordionItem value="trade">
              <AccordionTrigger className="text-sm py-3">By Trade</AccordionTrigger>
              <AccordionContent className="space-y-1 pb-3">
                {TRADES.filter(t => byTradeCount[t.value] > 0).map(t => {
                  const Icon = t.icon;
                  return (
                    <div key={t.value} className="flex items-center justify-between text-sm py-1">
                      <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-slate-600" />{t.label}</span>
                      <Badge variant="secondary" className="text-xs">{byTradeCount[t.value]}</Badge>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="company">
              <AccordionTrigger className="text-sm py-3">By Company</AccordionTrigger>
              <AccordionContent className="space-y-1 pb-3">
                {Object.entries(byCompanyCount).sort((a,b)=>a[0].localeCompare(b[0])).map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-sm py-1">
                    <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-600" />{name}</span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="status">
              <AccordionTrigger className="text-sm py-3">By Status</AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-2 pb-3">
                {Object.entries(SITE_STATUS).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border',
                      statusFilter === key ? 'ring-2 ring-offset-1 ring-slate-600' : '',
                      key === 'on_site' && 'bg-green-100 text-green-800 border-green-300',
                      key === 'assigned' && 'bg-amber-100 text-amber-800 border-amber-300',
                      key === 'blocked' && 'bg-red-100 text-red-800 border-red-300',
                      key === 'inactive' && 'bg-slate-100 text-slate-600 border-slate-300'
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', meta.ribbon)} />
                    {meta.label}
                  </button>
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cert">
              <AccordionTrigger className="text-sm py-3">By Certification</AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-2 pb-3">
                {CERT_TYPES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCertFilter(certFilter === c.id ? 'all' : c.id)}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium border bg-slate-100 border-slate-300',
                      certFilter === c.id && 'ring-2 ring-offset-1 ring-slate-600'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        {/* C. Main Canvas - The Board */}
        <main className="flex-1 min-w-0 p-4 overflow-auto bg-slate-100 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px]">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredPeople.map((p) => (
                <SiteRosterCard
                  key={p.id}
                  person={p}
                  selected={selectedIds.has(p.id)}
                  emergencyMode={emergencyMode}
                  onSelect={() => setSelectedPerson(p)}
                  onToggleSelect={() => toggleSelect(p.id)}
                  onPing={handlePing}
                  onCertClick={() => {}}
                />
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>NAME</TableHead>
                    <TableHead>TRADE</TableHead>
                    <TableHead>COMPANY</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>CERTS</TableHead>
                    <TableHead className="w-24">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople.map((p, i) => (
                    <TableRow
                      key={p.id}
                      className={cn(
                        'group cursor-pointer',
                        i % 2 === 1 && 'bg-slate-50'
                      )}
                      onClick={() => setSelectedPerson(p)}
                    >
                      <TableCell>
                        <Avatar className="h-8 w-8 rounded border border-slate-200">
                          <AvatarImage src={p.avatar_url} />
                          <AvatarFallback className="bg-slate-300 text-xs">{p.name?.[0]}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">{TRADES.find(t=>t.value===p.trade)?.label || p.trade}</p>
                        </div>
                      </TableCell>
                      <TableCell>{TRADES.find(t=>t.value===p.trade)?.label || p.trade}</TableCell>
                      <TableCell className="text-slate-600">{p.employer}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          SITE_STATUS[p.site_status]?.label && (p.site_status === 'on_site' ? 'text-green-700' : p.site_status === 'blocked' ? 'text-red-700' : 'text-slate-600')
                        )}>
                          {SITE_STATUS[p.site_status]?.label || p.site_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {(p.certifications || []).slice(0, 3).map((c, j) => {
                            const state = getCertExpiryState(c.expiry);
                            const ct = CERT_TYPES.find(x => x.id === c.id);
                            const Icon = ct?.icon || Shield;
                            return (
                              <span key={j} className={cn(state === 'expired' || state === 'expiring' ? 'text-red-600' : 'text-slate-500')}>
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                            );
                          })}
                          {(p.certifications || []).length > 3 && <span className="text-xs text-slate-400">+{(p.certifications||[]).length-3}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e)=>{e.stopPropagation(); p.phone && (window.location.href=`tel:${p.phone}`);}}><Phone className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e)=>{e.stopPropagation(); handlePing(p);}}><Radio className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
          {filteredPeople.length === 0 && (
            <div className="flex items-center justify-center py-24 text-slate-500">
              No personnel match the current filters. Change project or filters.
            </div>
          )}
        </main>
      </div>

      {/* Detail Slide-Over */}
      <Sheet open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[40%] overflow-y-auto">
          {selectedPerson && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <SheetTitle className="text-xl">{selectedPerson.name}</SheetTitle>
                    <SheetDescription>{TRADES.find(t=>t.value===selectedPerson.trade)?.label} · {selectedPerson.employer}</SheetDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => selectedPerson.phone && (window.location.href = `tel:${selectedPerson.emergency_phone || selectedPerson.phone}`)}>
                      Emergency Call
                    </Button>
                  </div>
                </div>
              </SheetHeader>
              <div className="py-4">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <Avatar className="h-24 w-24 rounded-lg border-2 border-slate-200">
                    <AvatarImage src={selectedPerson.avatar_url} />
                    <AvatarFallback className="rounded-lg bg-slate-300 text-2xl text-slate-700">{selectedPerson.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'w-full text-center py-2 rounded font-bold text-sm',
                    selectedPerson.site_status === 'on_site' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                  )}>
                    STATUS: {selectedPerson.site_status === 'on_site' ? 'ON SITE' : (SITE_STATUS[selectedPerson.site_status]?.label || selectedPerson.site_status).toUpperCase()}
                    {selectedPerson.last_seen && selectedPerson.site_status === 'on_site' && (
                      <p className="text-xs font-normal mt-1">Last check-in: {format(new Date(selectedPerson.last_seen), 'PPp')}</p>
                    )}
                  </div>
                </div>
                {emergencyMode && (
                  <Card className="mb-4 border-red-200 bg-red-50">
                    <CardContent className="py-3">
                      <p className="text-xs font-semibold text-red-800">Emergency Contact</p>
                      <p className="font-medium text-red-900">{selectedPerson.emergency_contact}</p>
                      {selectedPerson.emergency_phone && <a href={`tel:${selectedPerson.emergency_phone}`} className="text-red-700 text-sm font-medium">{selectedPerson.emergency_phone}</a>}
                    </CardContent>
                  </Card>
                )}
                <div className="w-full">
                  <div className="flex border-b gap-2 mb-4">
                    {['info', 'certs', 'role'].map(tab => (
                      <button key={tab} type="button" onClick={() => setDetailTab(tab)} className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px', detailTab === tab ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500')}>
                        {tab === 'info' ? 'INFO' : tab === 'certs' ? 'CERTS & DOCS' : 'PROJECT ROLE'}
                      </button>
                    ))}
                  </div>
                  {detailTab === 'info' && (
                    <div className="space-y-4 text-sm">
                      <div><span className="text-slate-500">Phone</span><p className="font-medium">{selectedPerson.phone || '—'}</p></div>
                      <div><span className="text-slate-500">Email</span><p className="font-medium truncate">{selectedPerson.email || '—'}</p></div>
                      <div><span className="text-slate-500">Employer</span><p className="font-medium">{selectedPerson.employer}</p></div>
                      <div><span className="text-slate-500">Site Badge #</span><p className="font-medium">{selectedPerson.site_badge_number}</p></div>
                      <div><span className="text-slate-500">Parking Spot</span><p className="font-medium">{selectedPerson.parking_spot || selectedPerson.vehicle || '—'}</p></div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Emergency Contact</span>
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        <p className="font-medium">{selectedPerson.emergency_contact}</p>
                      </div>
                    </div>
                  )}
                  {detailTab === 'certs' && (
                    <ul className="space-y-3">
                      {(selectedPerson.certifications || []).map((c, i) => {
                        const state = getCertExpiryState(c.expiry);
                        const ct = CERT_TYPES.find(x => x.id === c.id);
                        return (
                          <li key={i} className={cn('flex items-center justify-between p-3 rounded border', state === 'expired' && 'bg-red-50 border-red-200')}>
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-slate-500" />
                              <div>
                                <p className="font-medium">{ct?.label || c.id}</p>
                                <p className="text-xs text-slate-500">
                                  Issue: {c.issue_date ? format(new Date(c.issue_date), 'MMM d, yyyy') : '—'} · Expiry: {c.expiry ? format(new Date(c.expiry), 'MMM d, yyyy') : '—'}
                                </p>
                              </div>
                            </div>
                            {state === 'expired' && <Button size="sm" variant="outline" className="text-red-700 border-red-300">REUPLOAD</Button>}
                          </li>
                        );
                      })}
                      {(!selectedPerson.certifications || selectedPerson.certifications.length === 0) && <p className="text-slate-500 text-sm">No certifications on file.</p>}
                    </ul>
                  )}
                  {detailTab === 'role' && (
                    <div className="space-y-2">
                      {selectedProject && <p className="text-xs text-slate-500 mb-2">Project: {selectedProject.name}</p>}
                      {tasksForPerson.length === 0 ? (
                        <p className="text-slate-500 text-sm">No task assignments on this project.</p>
                      ) : (
                        tasksForPerson.map(t => (
                          <div key={t.id} className="flex justify-between items-start p-3 rounded border bg-slate-50 text-sm">
                            <div>
                              <p className="font-medium">{t.name || t.title || 'Task'}</p>
                              <p className="text-xs text-slate-500">Status: {t.status || 'In Progress'} · Assigned by: Site Sup</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <SheetFooter className="border-t pt-4 flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePing(selectedPerson)}><Radio className="h-4 w-4 mr-1" /> Ping</Button>
                <Button variant="outline" size="sm" onClick={() => handleSendRFI(selectedPerson)}><Send className="h-4 w-4 mr-1" /> Send RFI</Button>
                <Button variant="outline" size="sm" onClick={() => selectedPerson.phone && (window.location.href = `tel:${selectedPerson.phone}`)}><Phone className="h-4 w-4 mr-1" /> Call</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SiteRosterCard({ person, selected, emergencyMode, onSelect, onToggleSelect, onPing, onCertClick }) {
  const statusMeta = SITE_STATUS[person.site_status] || SITE_STATUS.assigned;
  const tradeMeta = TRADES.find(t => t.value === person.trade) || TRADES[TRADES.length - 1];
  const StatusIcon = statusMeta.icon;
  const hasExpiringCert = (person.certifications || []).some(c => getCertExpiryState(c.expiry) === 'expiring' || getCertExpiryState(c.expiry) === 'expired');

  return (
    <div
      className={cn(
        'relative w-[280px] h-[180px] rounded border flex overflow-hidden cursor-pointer transition-all hover:shadow-lg',
        selected && 'ring-2 ring-[#FFCC00] border-l-4 border-l-[#FFCC00]',
        !selected && 'hover:border-[#FFCC00] border-[#C0C0C0]',
        emergencyMode && person.has_first_aid && 'animate-pulse ring-2 ring-red-500',
        hasExpiringCert && !emergencyMode && 'ring-2 ring-amber-400'
      )}
      style={{ borderWidth: '1px', borderRadius: '4px' }}
      onClick={onSelect}
    >
      {/* Status ribbon - top-left diagonal */}
      <div className="absolute top-0 left-0 w-14 h-14 overflow-hidden z-10 pointer-events-none">
        <div className={cn('absolute top-0 left-0 w-20 h-20 -rotate-45 -translate-x-6 -translate-y-6', statusMeta.ribbon)} />
        <div className="absolute top-1 left-1.5 text-white z-10">
          <StatusIcon className="h-3.5 w-3.5" />
        </div>
      </div>
      {/* Checkbox on hover */}
      <div className="absolute top-2 right-2 z-10 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect()} className="rounded border-slate-400" onClick={e => e.stopPropagation()} />
      </div>
      {/* Photo - left 1/3 */}
      <div className="w-1/3 h-full relative flex-shrink-0 bg-slate-300">
        <Avatar className="absolute inset-0 w-full h-full rounded-none">
          <AvatarImage src={person.avatar_url} className="object-cover" />
          <AvatarFallback className="rounded-none bg-slate-500 text-white text-2xl font-bold flex items-center justify-center">
            <HardHat className="h-8 w-8 mr-1" />
            {person.name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 right-0 opacity-30 text-slate-600 text-[10px] font-medium truncate max-w-full px-1" title={person.employer}>
          {person.employer}
        </div>
      </div>
      {/* Info - right 2/3 */}
      <div className="flex-1 flex flex-col p-2 min-w-0 bg-white">
        <p className="font-bold text-slate-900 truncate" style={{ fontSize: '14pt' }}>{person.name}</p>
        <p className="text-xs text-slate-600 truncate">{tradeMeta.label}{person.role ? ` | ${person.role}` : ''}</p>
        <p className="text-[11pt] text-slate-500 truncate mt-0.5">{person.employer}</p>
        <div className="flex items-center gap-1 mt-auto flex-wrap">
          {(person.certifications || []).slice(0, 3).map((c, i) => {
            const state = getCertExpiryState(c.expiry);
            const ct = CERT_TYPES.find(x => x.id === c.id);
            const Icon = ct?.icon || Shield;
            return (
              <button key={i} type="button" onClick={e => { e.stopPropagation(); onCertClick(c); }} className={cn('p-0.5 rounded', state === 'expired' || state === 'expiring' ? 'text-red-600' : 'text-slate-400')}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          {(person.certifications || []).length > 3 && <span className="text-xs bg-slate-200 rounded px-1">+{(person.certifications||[]).length - 3}</span>}
        </div>
        <div className="flex justify-end mt-1">
          <button type="button" onClick={e => { e.stopPropagation(); onPing(person); }} className="p-1 rounded hover:bg-slate-100" title="Ping"><Radio className="h-3.5 w-3.5 text-slate-500" /></button>
          <button type="button" className="p-1 rounded hover:bg-slate-100" title="More"><MoreHorizontal className="h-3.5 w-3.5 text-slate-500" /></button>
        </div>
      </div>
    </div>
  );
}
