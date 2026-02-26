import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Building2, Users, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('choice'); // choice, create, join
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // If user already has organization, redirect to dashboard
        if (currentUser?.organization_id) {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    getUser();
  }, [navigate]);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('setupOrganization', {
        action: 'create',
        org_name: orgName
      });

      if (response.data.success) {
        navigate(createPageUrl('Dashboard'));
      }
    } catch (err) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async () => {
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('setupOrganization', {
        action: 'join',
        invite_code: inviteCode
      });

      if (response.data.success) {
        navigate(createPageUrl('Dashboard'));
      }
    } catch (err) {
      setError(err.message || 'Failed to join organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 mb-4">
            <Building2 className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Nexus Construct</h1>
          <p className="text-slate-600 mt-2">Let's get your workspace set up</p>
          {user && <p className="text-sm text-slate-500 mt-2">Signed in as {user.email}</p>}
        </div>

        {/* Step: Choose */}
        {step === 'choice' && (
          <div className="grid gap-4">
            <Button
              onClick={() => setStep('create')}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm font-semibold">Create New Organization</span>
              <span className="text-xs opacity-90">Start your own workspace</span>
            </Button>

            <Button
              onClick={() => setStep('join')}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm font-semibold">Join Existing Organization</span>
              <span className="text-xs text-slate-500">Use an invite code</span>
            </Button>
          </div>
        )}

        {/* Step: Create Organization */}
        {step === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Organization</CardTitle>
              <CardDescription>Set up your new workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Organization Name</label>
                <Input
                  placeholder="e.g., Golden State Integrated Systems"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('choice');
                    setError('');
                    setOrgName('');
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateOrg}
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Join Organization */}
        {step === 'join' && (
          <Card>
            <CardHeader>
              <CardTitle>Join Organization</CardTitle>
              <CardDescription>Enter the invite code from your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Invite Code</label>
                <Input
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  maxLength="20"
                />
              </div>

              <p className="text-xs text-slate-500">
                Ask your organization administrator for an invite code.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('choice');
                    setError('');
                    setInviteCode('');
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoinOrg}
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}