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
import { Plus, FileText, TrendingUp, DollarSign, Search, ArrowRight, Calendar, Sparkles, ChevronRight, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
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
  review: 'bg-blue-100 text-blue-800',
  intake: 'bg-cyan-100 text-cyan-800',
  off_pricing: 'bg-amber-100 text-amber-800',
  user_analyzing: 'bg-purple-100 text-purple-800',
  estimated: 'bg-indigo-100 text-indigo-800',
  submitted: 'bg-green-100 text-green-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
  no_bid: 'bg-slate-100 text-slate-800',
  closed: 'bg-slate-200 text-slate-700'
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
    <div className="max-w-[1600px] mx-auto space-y-8 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            Intelligence Center
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Bid Opportunities
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Manage, analyze, and track your construction bids with AI-powered insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingBid(null)}
                className="btn-premium-primary h-12 px-6 gap-2"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bids', value: stats.total, icon: FileText, color: 'text-navy-700', bg: 'bg-navy-50' },
          { label: 'Won Bids', value: stats.won, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Bids', value: stats.active, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Pipeline Value', value: fmtDollars(stats.value), icon: DollarSign, color: 'text-gold-700', bg: 'bg-gold-50' },
        ].map((stat, i) => (
          <Card key={i} className="premium-card border-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily scraper status */}
      <Card className="premium-card border-none">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Calendar className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Daily Bid Scraper</p>
              <p className="text-xs text-slate-500">
                {scraperStatus?.last_run
                  ? `Last run ${fmtDate(scraperStatus.last_run, 'MMM d, yyyy · h:mm a')} · ${scraperStatus.records_added ?? 0} records added`
                  : 'Never run · scheduled daily at 6 AM PT'}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" disabled={runScraperMutation.isPending} onClick={() => runScraperMutation.mutate()}>
            {runScraperMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Calendar className="h-4 w-4 mr-1" />}
            Run scraper now
          </Button>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="premium-card border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by title, client, or agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-slate-50 border-none focus-visible:ring-primary/20 rounded-xl"
              />
            </div>
            <div className="h-8 w-px bg-slate-200 hidden lg:block" />
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
              {bidStatuses.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'ghost'}
                  onClick={() => setStatusFilter(status)}
                  className={`h-10 px-4 rounded-xl font-medium transition-all ${
                    statusFilter === status 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {bidStatusLabels[status] || status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bids List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {filteredBids.length === 0 ? (
          <div className="py-20">
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
              className="premium-card border-none group cursor-pointer"
              onClick={() => navigate(createPageUrl('BidDetail') + `?id=${bid.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                  <div className="flex items-start gap-5 flex-1">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      bid.status === 'won' ? 'bg-emerald-50 text-emerald-600' : 
                      bid.status === 'lost' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                    } group-hover:bg-primary group-hover:text-white`}>
                      <FileText className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors">
                          {bid.title || bid.project_name}
                        </h3>
                        {bid.ai_analysis && (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-100 px-2 py-0.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> AI Analyzed
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-500 font-medium flex items-center gap-2">
                        {bid.client_name || bid.agency}
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        {bid.location || 'No location set'}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-4">
                        <Badge className={`${statusColors[bid.status]} px-3 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider`}>
                          {bid.status.replace('_', ' ')}
                        </Badge>
                        {belowFloorByBid[bid.id] && (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Below floor
                          </Badge>
                        )}
                        {bid.estimated_value && (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            {fmtDollars(bid.estimated_value)}
                          </div>
                        )}
                        {bid.due_date && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            Due {fmtDate(bid.due_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 border-t md:border-t-0 pt-4 md:pt-0 md:items-end">
                    <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <label className="text-[10px] uppercase tracking-wide text-slate-400">Status</label>
                      <BidStatusSelect
                        value={bid.status}
                        onChange={(v) => { if (v === 'won') handleMarkWon(bid); else tagBidMutation.mutate({ id: bid.id, status: v }); }}
                        className="h-8 w-[150px]"
                      />
                    </div>
                    {bid.status === 'won' && !bid.linked_project_id && (
                      <Button size="sm"
                        className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-white"
                        disabled={convertToProjectMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); convertToProjectMutation.mutate(bid); }}>
                        {convertToProjectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                        Convert to Project
                      </Button>
                    )}
                    {bid.linked_project_id && (
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-xs text-emerald-600"
                        onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('ProjectDetail') + `?id=${bid.linked_project_id}`); }}>
                        View Project
                      </Button>
                    )}
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
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 hover:border-amber-500 hover:bg-amber-50 transition-all text-center">
                {uploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 mx-auto text-amber-600 animate-spin" />
                    <p className="text-sm text-slate-600">Uploading &amp; analyzing...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                    <p className="font-semibold text-slate-800">Drop bid document here</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, Word, Excel &middot; AI auto-fills all fields</p>
                  </>
                )}
                <input type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" />
              </div>
            </label>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />{f.name}
                  </div>
                ))}
              </div>
            )}
            {aiPreview && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                    <Sparkles className="h-4 w-4" /> AI Extracted
                  </div>
                  <Button size="sm" onClick={handleApplyAi} className="bg-primary hover:bg-primary/90 text-white h-7 text-xs gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Apply
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
                  {aiPreview.title && <div><span className="text-slate-500">Title:</span> <span className="font-medium">{aiPreview.title}</span></div>}
                  {aiPreview.agency && <div><span className="text-slate-500">Agency:</span> <span className="font-medium">{aiPreview.agency}</span></div>}
                  {aiPreview.estimated_value > 0 && <div><span className="text-slate-500">Value:</span> <span className="font-medium">{fmtDollars(aiPreview.estimated_value)}</span></div>}
                  {aiPreview.due_date && <div><span className="text-slate-500">Due:</span> <span className="font-medium">{aiPreview.due_date}</span></div>}
                  {aiPreview.location && <div><span className="text-slate-500">Location:</span> <span className="font-medium">{aiPreview.location}</span></div>}
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