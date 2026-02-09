import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AlertSettings() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: thresholds = [], isLoading } = useQuery({
    queryKey: ['thresholds', user?.organization_id],
    queryFn: () => base44.entities.AlertThreshold.filter({ organization_id: user.organization_id }),
    enabled: !!user?.organization_id
  });

  const { data: dismissedAlerts = [] } = useQuery({
    queryKey: ['dismissedAlerts', user?.organization_id],
    queryFn: () => base44.entities.Alert.filter({ 
      organization_id: user.organization_id,
      dismissed: true
    }, '-dismissed_at', 50),
    enabled: !!user?.organization_id
  });

  const createThresholdMutation = useMutation({
    mutationFn: (data) => base44.entities.AlertThreshold.create({
      ...data,
      organization_id: user.organization_id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
      toast.success('Threshold created');
    }
  });

  const updateThresholdMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AlertThreshold.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
      toast.success('Threshold updated');
    }
  });

  const deleteThresholdMutation = useMutation({
    mutationFn: (id) => base44.entities.AlertThreshold.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
      toast.success('Threshold deleted');
    }
  });

  const restoreAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dismissedAlerts'] });
      toast.success('Alert restored');
    }
  });

  const createDefaultThresholds = async () => {
    const defaults = [
      { name: 'Budget Critical', type: 'budget', threshold_value: 90, severity: 'critical', description: 'Alert when project budget reaches 90%' },
      { name: 'Deadline Warning', type: 'deadline', threshold_value: 7, severity: 'warning', description: 'Alert 7 days before project deadline' },
      { name: 'Safety Critical', type: 'safety', threshold_value: 1, severity: 'critical', description: 'Alert for any safety incident' }
    ];

    for (const threshold of defaults) {
      await createThresholdMutation.mutateAsync(threshold);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-8 w-8 text-amber-600" />
            Alert Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure alert thresholds and manage dismissed alerts</p>
        </div>
        {thresholds.length === 0 && (
          <Button onClick={createDefaultThresholds} className="bg-amber-600 hover:bg-amber-700">
            Create Default Thresholds
          </Button>
        )}
      </div>

      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {thresholds.map(threshold => (
            <div key={threshold.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{threshold.name}</h3>
                  <Badge className={threshold.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                    {threshold.severity}
                  </Badge>
                  <Badge variant="outline">{threshold.type}</Badge>
                </div>
                <p className="text-sm text-slate-600">{threshold.description}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Threshold: {threshold.threshold_value}{threshold.type === 'budget' ? '%' : threshold.type === 'deadline' ? ' days' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={threshold.enabled}
                  onCheckedChange={(checked) => 
                    updateThresholdMutation.mutate({ 
                      id: threshold.id, 
                      data: { enabled: checked } 
                    })
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => {
                    if (confirm('Delete this threshold?')) {
                      deleteThresholdMutation.mutate(threshold.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {thresholds.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No thresholds configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dismissed Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Dismissed Alerts ({dismissedAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dismissedAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">No dismissed alerts</p>
              </div>
            ) : (
              dismissedAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Dismissed by {alert.dismissed_by} on {new Date(alert.dismissed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreAlertMutation.mutate(alert.id)}
                  >
                    Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}