import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function FieldHoursApproval() {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      if (userData?.organization_id) {
        const orgs = await base44.entities.Organization.filter({ id: userData.organization_id });
        setOrganization(orgs[0]);
      }
    };
    loadUser();
  }, []);

  const { data: fieldHours = [] } = useQuery({
    queryKey: ['fieldHoursForApproval', organization?.id],
    queryFn: () => organization?.id ? base44.entities.FieldHoursLog.filter({}) : [],
    enabled: !!organization?.id,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.FieldHoursLog.update(id, { approved: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fieldHoursForApproval'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.FieldHoursLog.update(id, { approved: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fieldHoursForApproval'] }),
  });

  if (!user || !organization) return <div className="p-6">Loading...</div>;

  const pending = fieldHours.filter(fh => !fh.approved);
  const approved = fieldHours.filter(fh => fh.approved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Field Hours Approval</h1>
          <p className="text-slate-600">Review and approve technician field hours</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{pending.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{approved.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{(fieldHours.reduce((sum, fh) => sum + (fh.hours || 0), 0)).toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        {pending.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Approval
                </CardTitle>
                <CardDescription>{pending.length} entries awaiting review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pending.map(entry => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{entry.technician_name}</p>
                        <p className="text-sm text-slate-600">{entry.project_name} • {entry.task_type}</p>
                        <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-bold text-amber-600">{entry.hours}h</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 gap-1"
                          onClick={() => approveMutation.mutate(entry.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 hover:bg-red-50"
                          onClick={() => rejectMutation.mutate(entry.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {approved.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Approved Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {approved.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{entry.technician_name}</p>
                        <p className="text-xs text-slate-600">{entry.project_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{entry.hours}h</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}