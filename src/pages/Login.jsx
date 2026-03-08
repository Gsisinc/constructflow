import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench, Building2, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

const PORTAL_STORAGE_KEY = 'constructflow.portalType';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [portalType, setPortalType] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PORTAL_STORAGE_KEY);
      if (stored === 'tech' || stored === 'client' || stored === 'app') setPortalType(stored);
    } catch (_) {}
  }, []);

  const setPortalAndPersist = (type) => {
    setPortalType(type);
    try {
      sessionStorage.setItem(PORTAL_STORAGE_KEY, type);
    } catch (_) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast.success('Signed in');
      let target = redirectParam && redirectParam.startsWith('/') ? redirectParam : redirectParam ? `/${redirectParam}` : null;
      if (!target) {
        if (portalType === 'tech') target = createPageUrl('TechnicianPortal');
        else if (portalType === 'client') target = createPageUrl('ClientPortal');
        else target = createPageUrl('Home');
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      window.location.href = origin + (target.startsWith('/') ? target : '/' + target);
    } catch (err) {
      toast.error(err?.message || 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <Card className="w-full sm:w-auto max-w-md">
        <CardHeader>
          <CardTitle>Sign in to ConstructFlow</CardTitle>
          <CardDescription>Choose your portal, then enter your credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Portal choice */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Sign in as</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant={portalType === 'tech' ? 'default' : 'outline'}
                className="flex flex-col h-auto py-3 gap-1"
                onClick={() => setPortalAndPersist('tech')}
              >
                <Wrench className="h-5 w-5" />
                <span className="text-xs font-medium">Tech Portal</span>
              </Button>
              <Button
                type="button"
                variant={portalType === 'client' ? 'default' : 'outline'}
                className="flex flex-col h-auto py-3 gap-1"
                onClick={() => setPortalAndPersist('client')}
              >
                <Building2 className="h-5 w-5" />
                <span className="text-xs font-medium">Client Portal</span>
              </Button>
              <Button
                type="button"
                variant={portalType === 'app' ? 'default' : 'outline'}
                className="flex flex-col h-auto py-3 gap-1"
                onClick={() => setPortalAndPersist('app')}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-xs font-medium">Full app</span>
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Tech: clock in/out, projects, requirements. Client: progress reports, updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="text-xs text-slate-500">
            No account? Create one in Supabase Dashboard → Authentication → Users, or contact your admin for access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
