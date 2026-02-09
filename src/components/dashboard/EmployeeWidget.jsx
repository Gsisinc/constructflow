import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EmployeeWidget() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['workers', user?.organization_id],
    queryFn: () => base44.entities.Worker.filter({ organization_id: user.organization_id }, '-created_date', 10),
    enabled: !!user?.organization_id
  });

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      assigned: 'bg-blue-100 text-blue-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({workers.length})
        </CardTitle>
        <Link to={createPageUrl('TeamManagement')}>
          <Button size="sm" variant="outline">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {workers.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No team members</div>
          ) : (
            workers.slice(0, 5).map(worker => (
              <div key={worker.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <div className="flex-1">
                  <p className="text-sm font-medium">{worker.name}</p>
                  <p className="text-xs text-slate-500">{worker.role}</p>
                </div>
                <Badge className={getStatusColor(worker.status)}>
                  {worker.status?.replace('_', ' ') || 'available'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}