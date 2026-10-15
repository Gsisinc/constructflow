import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { DrawingRow } from '@/components/bids/BidDrawings';

export default function ProjectDrawings({ projectId }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['project-drawings', projectId],
    queryFn: async () => (await base44.entities.Drawing.filter({ project_id: projectId }, { sort: '-created_date', limit: 200 }))?.items || [],
    enabled: !!projectId,
  });

  if (isLoading) return null;
  if (!items.length) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-navy-700" />
            <h3 className="text-sm font-semibold text-slate-900">Drawings (from bid)</h3>
          </div>
          <Badge variant="outline" className="text-xs">{items.length}</Badge>
        </div>
        <div className="space-y-2">
          {items.map((d) => <DrawingRow key={d.id} drawing={d} />)}
        </div>
      </CardContent>
    </Card>
  );
}