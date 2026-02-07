import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ClockIn() {
  const queryClient = useQueryClient();
  const [user] = useState(null);

  const { data: timeCards = [] } = useQuery({
    queryKey: ['timeCards'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (userData) {
        return base44.entities.Task.filter({ assigned_to: userData.email }) || [];
      }
      return [];
    }
  });

  const clockMutation = useMutation({
    mutationFn: async (action) => {
      const userData = await base44.auth.me();
      if (!userData) throw new Error('Not authenticated');
      
      // Store clock in/out in user data
      await base44.auth.updateMe({
        last_clock_action: action,
        last_clock_time: new Date().toISOString()
      });
      return action;
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(action === 'in' ? 'Clocked in' : 'Clocked out');
    }
  });

  const isClockedIn = user?.last_clock_action === 'in';

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
      <CardHeader>
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Button 
            className="w-full bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => clockMutation.mutate('in')}
            disabled={clockMutation.isPending}
          >
            {clockMutation.isPending ? 'Loading...' : '✓ Clock In'}
          </Button>
          <Button 
            className="w-full bg-blue-700 hover:bg-blue-800"
            onClick={() => clockMutation.mutate('out')}
            disabled={clockMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Clock Out
          </Button>
        </div>
        <Button className="w-full bg-white text-blue-600 hover:bg-blue-50" variant="ghost">
          Request Time Off
        </Button>
      </CardContent>
    </Card>
  );
}