import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Banknote, FileText, Loader2 } from 'lucide-react';

export default function PayStub() {
  const [user, setUser] = useState(null);
  const [stubs, setStubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        // TODO: replace with base44.entities.PayStub.filter({ user_id: me.id }) when entity exists
        setStubs([]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        <span className="text-slate-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Banknote className="h-7 w-7 text-amber-600" />
          Pay Stub
        </h1>
        <p className="text-slate-600 mt-1">View your pay history and download stubs.</p>
      </div>

      {stubs.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              No pay stubs yet
            </CardTitle>
            <CardDescription>
              Your organization may enable pay stubs here. When available, you’ll see past periods and can download PDFs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Ask your admin or HR to enable pay stub access. This page is ready for when your backend supports it.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {stubs.length > 0 && (
        <div className="space-y-3">
          {stubs.map((stub) => (
            <Card key={stub.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{stub.period_label || 'Pay period'}</CardTitle>
                <CardDescription>{stub.pay_date}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Net pay, deductions, and download will appear here.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
