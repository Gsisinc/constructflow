import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Mail, Phone, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserApprovals() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  const { data: pendingUsers = [], isLoading } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (userData?.role === 'admin') {
        return base44.entities.PendingUser.filter({ status: 'pending' }, '-created_date');
      }
      return [];
    }
  });

  React.useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const approveMutation = useMutation({
    mutationFn: async (pendingUser) => {
      // Map requested role to system role (admin or user)
      const systemRole = pendingUser.requested_role === 'project_manager' ? 'admin' : 'user';
      await base44.users.inviteUser(pendingUser.email, systemRole);
      await base44.entities.PendingUser.update(pendingUser.id, {
        status: 'approved',
        reviewed_by: user?.email,
        reviewed_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      toast.success('User approved and invited!');
    },
    onError: () => {
      toast.error('Failed to approve user');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (pendingUser) => {
      await base44.entities.PendingUser.update(pendingUser.id, {
        status: 'rejected',
        reviewed_by: user?.email,
        reviewed_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      toast.success('User application rejected');
    },
    onError: () => {
      toast.error('Failed to reject user');
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">Only admins can access user approvals.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">User Approvals</h1>
        <p className="text-slate-600">Review and approve pending user applications</p>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No pending applications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((pendingUser) => (
            <Card key={pendingUser.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{pendingUser.full_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {pendingUser.requested_role.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-slate-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(pendingUser.created_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4" />
                    {pendingUser.email}
                  </div>
                  {pendingUser.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4" />
                      {pendingUser.phone}
                    </div>
                  )}
                  {pendingUser.company && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="h-4 w-4" />
                      {pendingUser.company}
                    </div>
                  )}
                  {pendingUser.message && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700">{pendingUser.message}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveMutation.mutate(pendingUser)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve & Invite
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate(pendingUser)}
                    disabled={rejectMutation.isPending}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
