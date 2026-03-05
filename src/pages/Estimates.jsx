import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '@/components/skeleton/SkeletonComponents';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trash2, ArrowLeft, ArrowRight, RefreshCw, X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ESTIMATE_BROWSER_HEIGHT_KEY = 'constructflow.estimateBrowserHeight';
const defaultBrowserUrl = 'https://konstructiq.com/';

export default function Estimates() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const [browserFullscreen, setBrowserFullscreen] = useState(false);
  const getBrowserHeightMax = () => (typeof window !== 'undefined' ? Math.min(1400, window.innerHeight - 120) : 900);
  const savedHeight = typeof window !== 'undefined' && window.localStorage
    ? parseInt(localStorage.getItem(ESTIMATE_BROWSER_HEIGHT_KEY), 10) : NaN;
  const [browserHeight, setBrowserHeight] = useState(
    Number.isFinite(savedHeight) && savedHeight >= 320 && savedHeight <= getBrowserHeightMax() ? savedHeight : 560
  );
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(560);
  const isResizing = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage && Number.isFinite(browserHeight)) {
      localStorage.setItem(ESTIMATE_BROWSER_HEIGHT_KEY, String(browserHeight));
    }
  }, [browserHeight]);

  const getTabTitleFromUrl = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('konstructiq.com')) return 'Konstructiq';
      return u.hostname || 'New tab';
    } catch {
      return 'New tab';
    }
  };

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = browserHeight;
  }, [browserHeight]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isResizing.current) return;
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      const dy = e.clientY - resizeStartY.current;
      const maxH = getBrowserHeightMax();
      const next = Math.min(maxH, Math.max(320, resizeStartHeight.current + dy));
      setBrowserHeight(next);
    };
    const onEnd = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && browserFullscreen) {
        setBrowserFullscreen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [browserFullscreen]);

  const normalizeBrowserInput = (input) => {
    const raw = String(input || '').trim();
    if (!raw) return defaultBrowserUrl;
    if (/\s/.test(raw)) {
      return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
    }
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.includes('.') || raw.includes('/') || raw.includes(':')) return `https://${raw}`;
    return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
  };

  const makeTab = ({ id, url, title } = {}) => {
    const normalized = normalizeBrowserInput(url || defaultBrowserUrl);
    return {
      id: id || String(Date.now()),
      url: normalized,
      title: title || getTabTitleFromUrl(normalized),
      key: 0,
      history: [normalized],
      historyIndex: 0,
    };
  };

  const [browserTabs, setBrowserTabs] = useState([
    makeTab({ id: '1', url: defaultBrowserUrl, title: getTabTitleFromUrl(defaultBrowserUrl) }),
  ]);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState('1');
  const [browserUrlInput, setBrowserUrlInput] = useState(defaultBrowserUrl);
  const activeBrowserTab = browserTabs.find((t) => t.id === activeBrowserTabId) || browserTabs[0];

  const addBrowserTab = () => {
    const tab = makeTab({ url: defaultBrowserUrl });
    setBrowserTabs((prev) => [...prev, tab]);
    setActiveBrowserTabId(tab.id);
    setBrowserUrlInput(tab.url);
  };

  const closeBrowserTab = (id) => {
    const idx = browserTabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    if (browserTabs.length <= 1) return;
    const next = browserTabs.filter((t) => t.id !== id);
    setBrowserTabs(next);
    if (activeBrowserTabId === id && next.length) {
      setActiveBrowserTabId(next[Math.max(0, idx - 1)].id);
      const tab = next[Math.max(0, idx - 1)];
      setBrowserUrlInput(tab.url);
    }
  };

  const navigateBrowserTab = (url, { replaceHistory = false } = {}) => {
    const u = normalizeBrowserInput(url);
    setBrowserTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeBrowserTabId) return t;
        const nextTitle = getTabTitleFromUrl(u);
        const history = Array.isArray(t.history) ? t.history : [];
        const idx = typeof t.historyIndex === 'number' ? t.historyIndex : 0;
        if (replaceHistory) {
          const nextHistory = history.slice();
          nextHistory[idx] = u;
          return { ...t, url: u, title: nextTitle, key: t.key + 1, history: nextHistory, historyIndex: idx };
        }
        const truncated = history.slice(0, idx + 1);
        const nextHistory = [...truncated, u];
        return { ...t, url: u, title: nextTitle, key: t.key + 1, history: nextHistory, historyIndex: nextHistory.length - 1 };
      })
    );
    setBrowserUrlInput(u);
  };

  const refreshBrowserTab = () => {
    setBrowserTabs((prev) =>
      prev.map((t) =>
        t.id === activeBrowserTabId ? { ...t, key: t.key + 1 } : t
      )
    );
  };

  const goBackBrowserTab = () => {
    const tab = browserTabs.find((t) => t.id === activeBrowserTabId);
    if (!tab?.history || tab.historyIndex <= 0) return;
    const nextIdx = tab.historyIndex - 1;
    const nextUrl = tab.history[nextIdx];
    setBrowserTabs((prev) =>
      prev.map((t) =>
        t.id === activeBrowserTabId ? { ...t, url: nextUrl, key: t.key + 1, historyIndex: nextIdx, title: getTabTitleFromUrl(nextUrl) } : t
      )
    );
    setBrowserUrlInput(nextUrl);
  };

  const goForwardBrowserTab = () => {
    const tab = browserTabs.find((t) => t.id === activeBrowserTabId);
    if (!tab?.history || tab.historyIndex >= tab.history.length - 1) return;
    const nextIdx = tab.historyIndex + 1;
    const nextUrl = tab.history[nextIdx];
    setBrowserTabs((prev) =>
      prev.map((t) =>
        t.id === activeBrowserTabId ? { ...t, url: nextUrl, key: t.key + 1, historyIndex: nextIdx, title: getTabTitleFromUrl(nextUrl) } : t
      )
    );
    setBrowserUrlInput(nextUrl);
  };

  const browserCard = (
    <Card className={cn('overflow-hidden', browserFullscreen ? 'h-full' : '')}>
      <div className="bg-slate-100 border-b flex flex-col">
        <div
          className="flex items-center gap-1 overflow-x-auto min-h-[40px] px-2 py-1.5 border-b border-slate-200 cursor-default"
          onDoubleClick={() => {
            if (!browserFullscreen) setBrowserHeight(getBrowserHeightMax());
          }}
          title="Double-click to maximize height"
        >
          <div className="px-2 text-sm font-semibold text-slate-700 shrink-0">Browser</div>
          {browserTabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-t-lg border border-b-0 shrink-0 max-w-[180px] min-w-0',
                tab.id === activeBrowserTabId
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-slate-200/80 border-slate-300 hover:bg-slate-200'
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveBrowserTabId(tab.id);
                  setBrowserUrlInput(tab.url);
                }}
                className="flex-1 min-w-0 truncate text-left text-sm font-medium text-slate-700"
              >
                {tab.title}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeBrowserTab(tab.id);
                }}
                className="p-0.5 rounded hover:bg-slate-300 text-slate-500 hover:text-slate-700"
                title="Close tab"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBrowserTab}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-slate-200 text-slate-600 shrink-0 text-sm font-medium"
            title="New window"
          >
            <Plus className="h-4 w-4" />
            <span>New window</span>
          </button>
        </div>
        <div className="flex items-center gap-2 p-2 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={goBackBrowserTab}
            disabled={!(activeBrowserTab?.historyIndex > 0)}
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={goForwardBrowserTab}
            disabled={!(activeBrowserTab?.history && activeBrowserTab.historyIndex < activeBrowserTab.history.length - 1)}
            title="Forward"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={refreshBrowserTab} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Input
            value={browserUrlInput}
            onChange={(e) => setBrowserUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), navigateBrowserTab(browserUrlInput))}
            placeholder="Enter URL or search"
            className="flex-1 min-w-[200px] h-9 bg-white font-mono text-sm"
          />
          <Button type="button" size="sm" className="shrink-0 h-9" onClick={() => navigateBrowserTab(browserUrlInput)}>
            Go
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 h-9"
            onClick={() => setBrowserFullscreen((v) => !v)}
            title={browserFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {browserFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {browserFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 h-9"
            onClick={() => window.open(activeBrowserTab?.url || browserUrlInput, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </Button>
        </div>
      </div>
      <CardContent className="p-0">
        <div
          className="bg-slate-200 rounded-b-lg relative flex flex-col"
          style={{ minHeight: '320px', height: browserFullscreen ? 'calc(100vh - 140px)' : `${browserHeight}px` }}
        >
          {browserTabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(tab.id === activeBrowserTabId ? 'block flex-1 min-h-0' : 'hidden')}
              style={{ height: browserFullscreen ? '100%' : `${browserHeight}px` }}
            >
              {tab.url && (
                <iframe
                  key={tab.key}
                  src={normalizeBrowserInput(tab.url)}
                  title={tab.title}
                  className="w-full rounded-b-lg border-0 bg-white"
                  style={{ height: browserFullscreen ? '100%' : `${browserHeight}px` }}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation"
                  referrerPolicy="no-referrer-when-downgrade"
                  allow="clipboard-read; clipboard-write; fullscreen"
                />
              )}
            </div>
          ))}
          {!browserFullscreen && (
            <div
              role="separator"
              aria-label="Resize browser height"
              onMouseDown={handleResizeStart}
              className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex flex-col items-center justify-center gap-0.5 bg-slate-300/90 hover:bg-slate-400 transition-colors rounded-b-lg border-t border-slate-400/50"
              title="Drag to resize (double-click tab bar to maximize)"
            >
              <span className="w-10 h-0.5 rounded-full bg-slate-500" />
              <span className="w-14 h-0.5 rounded-full bg-slate-500" />
              <span className="w-10 h-0.5 rounded-full bg-slate-500" />
            </div>
          )}
          <p className="absolute bottom-2 left-2 text-xs text-slate-500 bg-white/90 px-2 py-1 rounded z-10">
            If a site refuses to embed, use &quot;Open in new tab&quot;. {!browserFullscreen && 'Drag bottom edge to resize · Double-click tab bar to maximize.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: bidOpportunities = [] } = useQuery({
    queryKey: ['bidOpportunities'],
    queryFn: () => base44.entities.BidOpportunity.list('-created_date')
  });

  const { data: bidEstimates = [] } = useQuery({
    queryKey: ['bidEstimates'],
    queryFn: () => base44.entities.BidEstimate.list('-created_date')
  });

  const deleteEstimateMutation = useMutation({
    mutationFn: async (estimateId) => {
      await base44.entities.BidEstimate.delete(estimateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidEstimates'] });
      toast.success('Estimate deleted successfully');
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete estimate: ' + error.message);
      setDeletingId(null);
    }
  });

  const handleDeleteEstimate = (estimateId) => {
    if (confirm('Are you sure you want to delete this estimate?')) {
      setDeletingId(estimateId);
      deleteEstimateMutation.mutate(estimateId);
    }
  };

  const stats = {
    estimating: bidOpportunities.filter(b => b.status === 'estimating').length,
    approved: bidOpportunities.filter(b => b.status === 'submitted').length
  };

  return (
    <>
      {browserFullscreen ? (
        <div className="fixed inset-0 z-50 bg-slate-50 p-2 sm:p-3">
          {browserCard}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {browserCard}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 break-words">Estimates</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{user?.full_name}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Link to={createPageUrl('BidOpportunities')}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Estimate</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Client Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {bidOpportunities.filter(b => b.status === 'submitted').slice(0, 3).map((bid) => (
              <div key={bid.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-2">
                <div>
                  <p className="font-medium text-sm">{bid.title}</p>
                  <p className="text-xs text-slate-500">{bid.client_name}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
              </div>
            ))}
            {bidOpportunities.filter(b => b.status === 'submitted').length === 0 && (
              <div className="text-center py-4 text-slate-400 text-sm">
                No Records Available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimates Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-slate-400 text-sm">
              No Records Available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <CardTitle className="text-base">Won & Lost Estimates</CardTitle>
            <select className="text-sm border rounded px-2 py-1 min-h-[36px] w-full sm:w-auto">
              <option>Last Month / This Month</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Count (0)</span>
                <span className="text-sm font-medium">$0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Count (0)</span>
                <span className="text-sm font-medium">$0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimates by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm font-medium">Estimating ({stats.estimating})</span>
                  <span className="text-sm text-slate-500">60.00%</span>
                </div>
                <div className="w-full sm:w-auto bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.estimating / (bidOpportunities.length || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm font-medium">Approved ({stats.approved})</span>
                  <span className="text-sm text-slate-500">40.00%</span>
                </div>
                <div className="w-full sm:w-auto bg-slate-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats.approved / (bidOpportunities.length || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimates Out for Bid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-slate-400 text-sm">
              No Records Available
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          {bidEstimates.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">
              No estimates created yet
            </div>
          ) : (
            <div className="space-y-2">
              {bidEstimates.map(estimate => {
                const relatedBid = bidOpportunities.find(b => b.id === estimate.bid_opportunity_id);
                return (
                  <div
                    key={estimate.id}
                    className="border rounded-lg p-3 hover:bg-slate-50 transition-colors flex justify-between items-start group"
                  >
                    <Link
                      to={createPageUrl('BidOpportunityDetail') + '?id=' + estimate.bid_opportunity_id}
                      className="flex-1 block"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{relatedBid?.title || 'Untitled Bid'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {estimate.line_items?.length || 0} line items • {estimate.labor_hours || 0} hrs
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-slate-900 break-words">
                            ${estimate.total_bid_amount?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-slate-500">v{estimate.version}</p>
                        </div>
                      </div>
                      {estimate.notes && (
                        <p className="text-xs text-slate-600 mt-2 truncate">{estimate.notes}</p>
                      )}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteEstimate(estimate.id);
                      }}
                      disabled={deletingId === estimate.id}
                      className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      )}
    </>
  );
}