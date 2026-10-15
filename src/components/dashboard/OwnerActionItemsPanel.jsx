import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, ListChecks } from 'lucide-react';
import { createPageUrl } from '@/utils';

const NAVY = '#0F1B2D';
const GOLD = '#E8B547';

const STATUS_STYLE = {
  Open: 'bg-amber-100 text-amber-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Waiting: 'bg-purple-100 text-purple-700',
  Done: 'bg-emerald-100 text-emerald-700',
};

const CATEGORY_STYLE = {
  Accounts: 'bg-sky-100 text-sky-700',
  'Licensing/NICET': 'bg-indigo-100 text-indigo-700',
  Decisions: 'bg-amber-100 text-amber-700',
  Approvals: 'bg-rose-100 text-rose-700',
  Other: 'bg-slate-100 text-slate-600',
};

const STATUSES = ['Open', 'In Progress', 'Waiting', 'Done'];

export default function OwnerActionItemsPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = user?.organization_id;

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

  const openItems = React.useMemo(
    () => items.filter((i) => i.status !== 'Done').slice(0, 5),
    [items]
  );

  const go = () => navigate(createPageUrl('OwnerActionItems'));

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(15,27,45,0.08)' }}>
            <ListChecks className="h-4 w-4" style={{ color: NAVY }} />
          </div>
          <CardTitle className="text-base font-semibold text-slate-900">Owner Action Items</CardTitle>
          {counts.Open > 0 && (
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(232,181,71,0.18)', color: '#92660c' }}>
              {counts.Open} open
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={go} className="text-slate-500 hover:text-slate-900">
          View all <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {/* Status counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 pb-3">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={go}
              className="flex flex-col items-start rounded-lg border border-slate-200 p-3 text-left hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[s]}`}>{s}</span>
              <span className="mt-1.5 text-2xl font-bold text-slate-900 leading-none">{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Top open items */}
        <div className="border-t border-slate-100">
          {isLoading ? (
            <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : openItems.length === 0 ? (
            <div className="p-8 text-center">
              <ListChecks className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">No open action items. Everything's handled.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {openItems.map((item) => (
                <li
                  key={item.id}
                  onClick={go}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    {item.notes && <p className="text-xs text-slate-500 truncate">{item.notes}</p>}
                  </div>
                  <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_STYLE[item.category] || CATEGORY_STYLE.Other}`}>
                    {item.category}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[item.status] || ''}`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}