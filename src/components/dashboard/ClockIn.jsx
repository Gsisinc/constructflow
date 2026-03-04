import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ClockIn() {
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setUserData(user);
    };
    loadUser();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clockMutation = useMutation({
    mutationFn: async (action) => {
      if (!userData) throw new Error('Not authenticated');
      await base44.auth.updateMe({
        last_clock_action: action,
        last_clock_time: new Date().toISOString()
      });
      return action;
    },
    onSuccess: (action) => {
      setUserData(prev => ({
        ...prev,
        last_clock_action: action,
        last_clock_time: new Date().toISOString()
      }));
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(action === 'in' ? 'Clocked in successfully' : 'Clocked out successfully');
    }
  });

  const isClockedIn = userData?.last_clock_action === 'in';
  const clockedInTime = userData?.last_clock_time ? new Date(userData.last_clock_time) : null;

  return (
    <Card className="border border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-600" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Current Status</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`h-3 w-3 rounded-full ${isClockedIn ? 'bg-green-500' : 'bg-slate-300'}`} />
                <p className="text-sm font-semibold text-slate-900">
                  {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                </p>
              </div>
            </div>
            {clockedInTime && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Last action at</p>
                <p className="text-sm font-semibold text-slate-900">{format(clockedInTime, 'h:mm a')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Time */}
        <div className="text-center">
          <p className="text-xs text-slate-500 font-medium">Current Time</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{format(currentTime, 'h:mm:ss a')}</p>
        </div>

        {/* Clock Buttons */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => clockMutation.mutate('in')}
            disabled={clockMutation.isPending || isClockedIn}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Clock In
          </Button>
          <Button 
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            onClick={() => clockMutation.mutate('out')}
            disabled={clockMutation.isPending || !isClockedIn}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Clock Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}