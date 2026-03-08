import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarOff, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function RequestTimeOff() {
  const [user, setUser] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        // TODO: base44.entities.TimeOffRequest.filter({ user_id: me.id })
        setRequests([]);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates.');
      return;
    }
    setLoading(true);
    try {
      // TODO: await base44.entities.TimeOffRequest.create({ user_id: user.id, start_date: startDate, end_date: endDate, reason, status: 'pending' });
      toast.success('Time off request submitted. Your manager will be notified.');
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarOff className="h-7 w-7 text-blue-600" />
          Request Time Off
        </h1>
        <p className="text-slate-600 mt-1">Submit a request for time off. Your manager will approve or respond.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New request</CardTitle>
          <CardDescription>Choose dates and add an optional reason.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Start date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">End date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Reason (optional)</label>
              <Input
                placeholder="e.g. Vacation, sick, personal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Submit request
            </Button>
          </form>
        </CardContent>
      </Card>

      {requests.length === 0 && (
        <Alert>
          <AlertDescription>
            Your past requests will appear here once the backend supports time-off requests. Submitting above will show a success message; connect your backend to persist them.
          </AlertDescription>
        </Alert>
      )}

      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past requests</CardTitle>
            <CardDescription>Status and history.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              {requests.map((r) => (
                <li key={r.id}>{r.start_date} – {r.end_date}: {r.status}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
