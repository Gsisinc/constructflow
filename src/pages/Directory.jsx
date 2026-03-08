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
  Menu,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

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

const DEFAULT_CATEGORIES = [
  { id: 'worker', label: 'Worker', color: 'bg-blue-500' },
  { id: 'supervisor', label: 'Supervisor', color: 'bg-purple-500' },
  { id: 'vendor', label: 'Vendor', color: 'bg-green-500' },
  { id: 'inspector', label: 'Inspector', color: 'bg-orange-500' },
  { id: 'client', label: 'Client', color: 'bg-red-500' },
  { id: 'other', label: 'Other', color: 'bg-slate-500' },
];

const DIRECTORY_CUSTOM_CATEGORIES_KEY = 'constructflow.directoryCustomCategories';

function loadCustomCategories() {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage.getItem(DIRECTORY_CUSTOM_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item != null &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.label === 'string'
    );
  } catch {
    return [];
  }
}

function saveCustomCategories(list) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(DIRECTORY_CUSTOM_CATEGORIES_KEY, JSON.stringify(list));
  } catch (_) {}
}

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
    category: worker.category || 'worker',
    group: worker.group || worker.phase || worker.site_zone || worker.employer || '',
  };
}

export default function Directory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const projectIdFromUrl = searchParams.get('projectId') || '';

  const [projectId, setProjectId] = useState(projectIdFromUrl || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all');
  const [certFilter, setCertFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [customCategories, setCustomCategories] = useState(() => loadCustomCategories());
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [detailTab, setDetailTab] = useState('info');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    role: 'electrician',
    company: '',
    phone: '',
    email: '',
    category: 'worker',
    group: '',
  });

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

  const createWorkerMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (user?.organization_id && !payload.organization_id) {
        payload.organization_id = user.organization_id;
      }
      return base44.entities.Worker.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers', 'directory'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Contact added');
      setShowAddForm(false);
      setNewContact({
        name: '',
        company: '',
        role: 'electrician',
        phone: '',
        email: '',
        category: 'worker',
        group: '',
      });
    },
    onError: (err) => {
      const message =
        (typeof err === 'object' && err && 'message' in err && err.message) ||
        'Failed to add contact';
      toast.error(message);
    },
  });

  const clockStatusMutation = useMutation({
    mutationFn: async ({ workerId, action }) => {
      const nowIso = new Date().toISOString();
      if (!workerId) throw new Error('Missing worker id');
      if (action === 'in') {
        return base44.entities.Worker.update(workerId, { site_status: 'on_site', last_seen: nowIso });
      }
      return base44.entities.Worker.update(workerId, { site_status: 'assigned', last_seen: null });
    },
    onSuccess: (_updated, vars) => {
      queryClient.invalidateQueries({ queryKey: ['workers', 'directory'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setSelectedPerson((prev) => {
        if (!prev || prev.id !== vars.workerId) return prev;
        const nowIso = new Date().toISOString();
        return {
          ...prev,
          site_status: vars.action === 'in' ? 'on_site' : 'assigned',
          last_seen: vars.action === 'in' ? nowIso : null,
        };
      });
      toast.success(vars.action === 'in' ? 'Clocked in (On Site)' : 'Clocked out');
    },
    onError: (err) => {
      const message =
        (typeof err === 'object' && err && 'message' in err && err.message) ||
        'Clock action failed';
      toast.error(message);
    },
  });

  const people = useMemo(
    () => workersRaw.map((w, i) => enrichPerson(w, i)),
    [workersRaw]
  );

  const categoriesList = useMemo(() => {
    const custom = Array.isArray(customCategories) ? customCategories : [];
    return [...DEFAULT_CATEGORIES, ...custom.filter((c) => c && typeof c.id === 'string' && typeof c.label === 'string')];
  }, [customCategories]);

  const uniqueGroups = useMemo(() => {
    const set = new Set();
    people.forEach(p => {
      const g = (p.group || '').toString().trim();
      if (g) set.add(g);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [people]);

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
    if (categoryFilter !== 'all') list = list.filter(p => p.category === categoryFilter);
    if (groupFilter !== 'all') list = list.filter(p => (p.group || '') === groupFilter);
    if (emergencyMode) list = list.filter(p => p.site_status === 'on_site');
    if (emergencyMode) list = list.filter(p => p.has_first_aid);
    return list;
  }, [peopleForProject, searchTerm, statusFilter, certFilter, categoryFilter, groupFilter, emergencyMode]);

  const onSiteCount = useMemo(() => peopleForProject.filter((p) => p.site_status === 'on_site').length, [peopleForProject]);
  const selectedProject = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

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

  const handleAddCustomCategory = () => {
    try {
      const label = (newCategoryLabel || '').trim();
      if (!label) {
        toast.error('Enter a category name');
        return;
      }
      const id = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'custom';
      const exists = [...DEFAULT_CATEGORIES, ...(customCategories || [])].some((c) => c && c.id === id);
      if (exists) {
        toast.error('A category with that name already exists');
        return;
      }
      const next = [...(Array.isArray(customCategories) ? customCategories : []), { id, label, color: 'bg-teal-500' }];
      setCustomCategories(next);
      saveCustomCategories(next);
      setNewCategoryLabel('');
      toast.success(`Category "${label}" added`);
    } catch (err) {
      console.error('Add category error:', err);
      toast.error(err?.message || 'Failed to add category. Try again.');
    }
  };

  const handleRemoveCustomCategory = (id) => {
    try {
      const list = Array.isArray(customCategories) ? customCategories : [];
      const next = list.filter((c) => c && c.id !== id);
      setCustomCategories(next);
      saveCustomCategories(next);
      if (categoryFilter === id) setCategoryFilter('all');
      toast.success('Category removed');
    } catch (err) {
      console.error('Remove category error:', err);
      toast.error('Failed to remove category. Try again.');
    }
  };

  const handleAddContact = () => {
    if (!newContact.name.trim()) {
      toast.error('Name is required');
      return;
    }

    createWorkerMutation.mutate({
      name: newContact.name.trim(),
      role: newContact.role,
      trade: newContact.role,
      company: newContact.company?.trim() || '',
      employer: newContact.company?.trim() || '',
      phone: newContact.phone?.trim() || '',
      email: newContact.email?.trim() || '',
      category: newContact.category,
      ...(newContact.group && { phase: newContact.group, group: newContact.group }),
      status: 'assigned',
      site_status: 'assigned',
      current_project_id: projectId || '',
    });
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-100">
      {/* Header */}
      <header className={cn(
        'flex flex-none items-center gap-2 md:gap-4 px-3 md:px-4 py-2 md:py-3 border-b shadow-sm flex-wrap',
        emergencyMode ? 'bg-red-700 text-white border-red-800' : 'bg-slate-800 text-white border-slate-700'
      )}>
        <div className="font-bold text-sm md:text-lg tracking-tight shrink-0">
          {emergencyMode ? 'EMERGENCY' : 'ROSTER'}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'pl-10 h-8 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-400',
              emergencyMode && 'bg-red-800 border-red-600'
            )}
          />
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 md:hidden" onClick={() => setShowFilters(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs md:text-sm px-2"
            onClick={() => setShowAddForm(true)}
          >
            <UserPlus className="h-3 w-3 md:h-4 md:w-4 mr-1" /> Add
          </Button>
        </div>
      </header>

      {emergencyMode && (
        <div className="flex-none px-3 md:px-4 py-2 bg-red-600 text-white flex items-center gap-4 text-xs md:text-sm">
          <span className="font-bold">HEAD COUNT: {onSiteCount}</span>
          <span>On Site + First Aid</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 md:gap-4 p-2 md:p-4">
        {/* Filters - Mobile Sheet, Desktop Sidebar */}
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto p-4 space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Project</Label>
                <Select value={projectId || 'all'} onValueChange={(v) => { setProjectId(v === 'all' ? '' : v); setShowFilters(false); }}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name || p.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SITE_STATUS).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium border',
                        statusFilter === key ? 'ring-2 ring-offset-1 ring-slate-600' : '',
                        key === 'on_site' && 'bg-green-100 text-green-800 border-green-300',
                        key === 'assigned' && 'bg-amber-100 text-amber-800 border-amber-300',
                        key === 'blocked' && 'bg-red-100 text-red-800 border-red-300',
                        key === 'inactive' && 'bg-slate-100 text-slate-600 border-slate-300'
                      )}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Group</Label>
                <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setShowFilters(false); }}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All groups</SelectItem>
                    {uniqueGroups.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium text-white border-0',
                        categoryFilter === cat.id ? cat.color : 'bg-slate-400',
                        categoryFilter === cat.id && 'ring-2 ring-offset-1 ring-slate-600'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setShowFilters(false); setShowManageCategories(true); }}>
                  + Add category
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex md:w-64 flex-col flex-none border rounded bg-slate-50 p-4 overflow-y-auto">
          <h3 className="font-bold text-sm mb-4">Filters</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold mb-2 block">Project</Label>
              <Select value={projectId || 'all'} onValueChange={(v) => setProjectId(v === 'all' ? '' : v)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Status</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SITE_STATUS).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium border',
                      statusFilter === key ? 'ring-2 ring-offset-1 ring-slate-600' : '',
                      key === 'on_site' && 'bg-green-100 text-green-800 border-green-300',
                      key === 'assigned' && 'bg-amber-100 text-amber-800 border-amber-300',
                      key === 'blocked' && 'bg-red-100 text-red-800 border-red-300',
                      key === 'inactive' && 'bg-slate-100 text-slate-600 border-slate-300'
                    )}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Group</Label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {uniqueGroups.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Category</Label>
              <div className="flex flex-wrap gap-2">
                {categoriesList.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium text-white border-0',
                      categoryFilter === cat.id ? cat.color : 'bg-slate-400',
                      categoryFilter === cat.id && 'ring-2 ring-offset-1 ring-slate-600'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setShowManageCategories(true)}>
                + Add category
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {filteredPeople.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
              No personnel match filters
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
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
          )}
        </main>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[400px] overflow-y-auto p-4">
          {selectedPerson && (
            <>
              <SheetHeader className="border-b pb-4 mb-4">
                <SheetTitle>{selectedPerson.name}</SheetTitle>
                <SheetDescription>{TRADES.find(t=>t.value===selectedPerson.trade)?.label} · {selectedPerson.employer}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {['info', 'certs', 'role'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDetailTab(tab)}
                      className={cn(
                        'px-3 py-1 rounded text-sm font-medium border',
                        detailTab === tab ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-600 border-slate-200'
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                {detailTab === 'info' && (
                  <div className="space-y-2 text-sm">
                    <div><span className="text-slate-500">Trade</span><p className="font-medium">{TRADES.find(t=>t.value===selectedPerson.trade)?.label}</p></div>
                    <div><span className="text-slate-500">Company</span><p className="font-medium">{selectedPerson.employer}</p></div>
                    <div><span className="text-slate-500">Status</span><p className="font-medium">{SITE_STATUS[selectedPerson.site_status]?.label}</p></div>
                    <div><span className="text-slate-500">Category</span><p className="font-medium">{categoriesList.find(c=>c.id===selectedPerson.category)?.label || selectedPerson.category}</p></div>
                  </div>
                )}
                {detailTab === 'certs' && (
                  <ul className="space-y-2 text-sm">
                    {(selectedPerson.certifications || []).map((c, i) => {
                      const state = getCertExpiryState(c.expiry);
                      const ct = CERT_TYPES.find(x => x.id === c.id);
                      return (
                        <li key={i} className={cn('p-2 rounded border', state === 'expired' && 'bg-red-50 border-red-200')}>
                          <p className="font-medium">{ct?.label || c.id}</p>
                          <p className="text-xs text-slate-500">
                            Expiry: {c.expiry ? format(new Date(c.expiry), 'MMM d, yyyy') : '—'}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <SheetFooter className="border-t pt-4 mt-4 flex flex-wrap gap-2">
                <Button
                  variant={selectedPerson.site_status === 'on_site' ? 'default' : 'outline'}
                  size="sm"
                  disabled={clockStatusMutation.isPending || !selectedPerson.id}
                  onClick={() => clockStatusMutation.mutate({ workerId: selectedPerson.id, action: selectedPerson.site_status === 'on_site' ? 'out' : 'in' })}
                  className={cn(
                    selectedPerson.site_status === 'on_site'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  )}
                  title={selectedPerson.site_status === 'on_site' ? 'Clock out / mark off site' : 'Clock in / mark on site'}
                >
                  {clockStatusMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : (selectedPerson.site_status === 'on_site' ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />)}
                  {selectedPerson.site_status === 'on_site' ? 'Clock Out' : 'Clock In'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePing(selectedPerson)}><Radio className="h-4 w-4 mr-1" /> Ping</Button>
                <Button variant="outline" size="sm" onClick={() => handleSendRFI(selectedPerson)}><Send className="h-4 w-4 mr-1" /> RFI</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Contact Form */}
      <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
        <SheetContent side="right" className="w-full sm:max-w-[400px] overflow-y-auto p-4">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle>Add Contact</SheetTitle>
            <SheetDescription>Add a new person to the directory</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="trade" className="text-sm font-medium">Trade</Label>
              <Select value={newContact.role} onValueChange={(v) => setNewContact({ ...newContact, role: v })}>
                <SelectTrigger id="trade" className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="company" className="text-sm font-medium">Company</Label>
              <Input
                id="company"
                placeholder="Company name"
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <Select value={newContact.category} onValueChange={(v) => setNewContact({ ...newContact, category: v })}>
                <SelectTrigger id="category" className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriesList.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="group" className="text-sm font-medium">Group (optional)</Label>
              <Input
                id="group"
                placeholder="e.g. Crew A, Foundation Phase"
                value={newContact.group}
                onChange={(e) => setNewContact({ ...newContact, group: e.target.value })}
                className="mt-1 text-sm"
                list="directory-groups"
              />
              <datalist id="directory-groups">
                {uniqueGroups.map(g => <option key={g} value={g} />)}
              </datalist>
            </div>
          </div>
          <SheetFooter className="border-t pt-4 mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button
              onClick={handleAddContact}
              disabled={createWorkerMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {createWorkerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Manage categories */}
      <Sheet open={showManageCategories} onOpenChange={setShowManageCategories}>
        <SheetContent side="right" className="w-full sm:max-w-[360px] overflow-y-auto p-4">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle>Manage categories</SheetTitle>
            <SheetDescription>Add custom categories for filtering and when adding contacts.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New category name"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={handleAddCustomCategory}>Add</Button>
            </div>
            {Array.isArray(customCategories) && customCategories.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Your categories</Label>
                <ul className="space-y-2">
                  {customCategories
                    .filter((cat) => cat && typeof cat.id === 'string' && typeof cat.label === 'string')
                    .map((cat) => (
                      <li key={cat.id} className="flex items-center justify-between rounded border px-3 py-2 bg-slate-50">
                        <span className={cn('px-2 py-0.5 rounded text-xs text-white', cat.color || 'bg-teal-500')}>{cat.label}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleRemoveCustomCategory(cat.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
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
        'relative w-full h-[160px] rounded border flex overflow-hidden cursor-pointer transition-all hover:shadow-lg',
        selected && 'ring-2 ring-[#FFCC00] border-l-4 border-l-[#FFCC00]',
        !selected && 'hover:border-[#FFCC00] border-[#C0C0C0]',
        emergencyMode && person.has_first_aid && 'animate-pulse ring-2 ring-red-500',
        hasExpiringCert && !emergencyMode && 'ring-2 ring-amber-400'
      )}
      style={{ borderWidth: '1px', borderRadius: '4px' }}
      onClick={onSelect}
    >
      <div className="absolute top-0 left-0 w-12 h-12 overflow-hidden z-10 pointer-events-none">
        <div className={cn('absolute top-0 left-0 w-16 h-16 -rotate-45 -translate-x-6 -translate-y-6', statusMeta.ribbon)} />
        <div className="absolute top-1 left-1.5 text-white z-10">
          <StatusIcon className="h-3 w-3" />
        </div>
      </div>
      <div className="w-1/3 h-full relative flex-shrink-0 bg-slate-300">
        <Avatar className="absolute inset-0 w-full h-full rounded-none">
          <AvatarImage src={person.avatar_url} className="object-cover" />
          <AvatarFallback className="rounded-none bg-slate-500 text-white text-xl font-bold flex items-center justify-center">
            {person.name?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 flex flex-col p-2 min-w-0 bg-white">
        <p className="font-bold text-slate-900 truncate text-sm">{person.name}</p>
        <p className="text-xs text-slate-600 truncate">{tradeMeta.label}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{person.employer}</p>
        <div className="flex items-center gap-1 mt-auto flex-wrap">
          {(person.certifications || []).slice(0, 2).map((c, i) => {
            const state = getCertExpiryState(c.expiry);
            const ct = CERT_TYPES.find(x => x.id === c.id);
            const Icon = ct?.icon || Shield;
            return (
              <button key={i} type="button" onClick={e => { e.stopPropagation(); onCertClick(c); }} className={cn('p-0.5 rounded', state === 'expired' || state === 'expiring' ? 'text-red-600' : 'text-slate-400')}>
                <Icon className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
