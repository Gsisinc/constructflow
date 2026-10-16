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
import { Plus, FileText, TrendingUp, DollarSign, Search, ArrowRight, Calendar, Sparkles, ChevronRight, Upload, Loader2, CheckCircle, AlertTriangle, Trophy, Activity, CircleDollarSign, CalendarClock, Building2, MapPin, Layers, RefreshCw, Briefcase, Filter } from 'lucide-react';
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
      ...data, 
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
    mutationFn: ({ id, data }) => base44.entities.BidOpportunity.update(id, data),
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
    return matchesStatus && matchesSearch;
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            Intelligence Center
          </div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">
            Bid Opportunities
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage, analyze, and track your construction bids with AI-powered insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingBid(null)}
                className="h-10 px-4 gap-2 bg-[hsl(var(--brand-gold,43_67%_47%))] text-[hsl(var(--brand-navy,214_68%_14%))] hover:opacity-90 font-semibold"
              >
                <Plus className="h-5 w-5" />
                Create New Bid
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <BidForm 
                bid={editingBid} 
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

      {/* Stats: one compact row of chips */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'Total', value: stats.total, icon: FileText },
          { label: 'Active', value: stats.active, icon: Activity },
          { label: 'Won', value: stats.won, icon: Trophy },
          { label: 'Pipeline', value: fmtDollars(stats.value), icon: CircleDollarSign },
        ].map((stat) => (
          <div key={stat.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm">
            <stat.icon className="h-4 w-4 text-[hsl(var(--brand-gold,43_67%_47%))]" />
            <span className="text-muted-foreground">{stat.label}</span>
            <span className="font-semibold tabular-nums text-primary">{stat.value}</span>
          </div>
        ))}
        <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {scraperStatus?.last_run
            ? `Scraper ${fmtDate(scraperStatus.last_run, 'MMM d, h:mm a')} · ${scraperStatus.records_added ?? 0} added`
            : 'Scraper never run · daily 6 AM PT'}
          <Button size="sm" variant="ghost" className="h-7 px-2" disabled={runScraperMutation.isPending} onClick={() => runScraperMutation.mutate()} title="Run scraper now">
            {runScraperMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Search and status filter */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, client, agency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-card border-border rounded-lg"
          />
        </div>
        {/* Segmented control on desktop (main stages), select on mobile / for all statuses */}
        <div className="hidden lg:inline-flex rounded-lg border border-border bg-card p-1">
          {['All', 'review', 'intake', 'off_pricing', 'estimated', 'submitted', 'won', 'lost'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`h-8 px-3 rounded-md text-sm font-medium transition-colors ${
                statusFilter === status ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {bidStatusLabels[status]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
            aria-label="Filter by status"
          >
            {bidStatuses.map((status) => (
              <option key={status} value={status}>{bidStatusLabels[status] || status}</option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">{filteredBids.length} shown</span>
        </div>
      </div>

      {/* Bids List */}
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
                    <div className="min-w-0"><dt className="text-xs text-muted-foreground">Due</dt><dd className="font-semibold text-primary">{bid.due_date ? fmtDate(bid.due_date) : '—'}</dd></div>
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
    </div>
  );
}

function BidForm({ bid, onSubmit }) {
  const [formData, setFormData] = useState(bid || {
    title: '',
    project_name: '',
    client_name: '',
    agency: '',
    division: '',
    lv_domain: '',
    owner_name: '',
    status: 'review',
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
      estimated_value: aiPreview.estimated_value || prev.estimated_value,
      due_date: aiPreview.due_date || prev.due_date,
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
                  {aiPreview.due_date && <div><span className="text-muted-foreground">Due:</span> <span className="font-medium">{aiPreview.due_date}</span></div>}
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
            onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) })}
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
            onChange={(e) => setFormData({ ...formData, win_probability: parseInt(e.target.value) })}
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