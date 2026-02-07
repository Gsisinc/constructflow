import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeWidget() {
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const queryClient = useQueryClient();

  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => base44.entities.Worker.list('-created_date', 10)
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => base44.users.inviteUser(data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setEmail('');
      setShowDialog(false);
      toast.success('Invite sent');
    }
  });

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteMutation.mutate({ email, role });
  };

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
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="user">Team Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button 
                onClick={handleInvite} 
                className="w-full"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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