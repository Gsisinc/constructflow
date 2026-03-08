import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Building2, Wrench, UserCheck, Loader2, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SEARCH_DEBOUNCE_MS = 350;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('choice'); // choice | create | join
  const [joinRole, setJoinRole] = useState(null); // 'technician' | 'client'
  const [orgName, setOrgName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser?.organization_id) {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    getUser();
  }, [navigate]);

  const searchOrganizations = useCallback(async (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setError('');
    try {
      const response = await base44.functions.invoke('setupOrganization', {
        action: 'search_organizations',
        query: q,
      });
      const list = response?.data?.organizations ?? response?.organizations ?? [];
      setSearchResults(Array.isArray(list) ? list : []);
    } catch (err) {
      try {
        const list = await base44.entities.Organization.list();
        const all = Array.isArray(list) ? list : [];
        const filtered = all.filter(
          (o) =>
            (o.name || o.organization_name || '')
              .toLowerCase()
              .includes(q)
        );
        setSearchResults(filtered.slice(0, 15));
      } catch (fallbackErr) {
        setSearchResults([]);
        setError('Search is not available. Contact your admin to get added to an organization.');
      }
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      searchOrganizations(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery, searchOrganizations]);

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
        org_name: orgName.trim(),
      });
      if (response?.data?.success !== false && !response?.data?.error) {
        toast.success('Organization created. You’re the admin.');
        navigate(createPageUrl('Dashboard'));
        return;
      }
      throw new Error(response?.data?.error || response?.data?.message || 'Failed to create');
    } catch (err) {
      setError(err?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async () => {
    const org = selectedOrg || (searchResults.length === 1 ? searchResults[0] : null);
    if (!org?.id) {
      setError('Select an organization from the list');
      return;
    }
    if (!joinRole) {
      setError('Choose how you’re joining (Technician or Client).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('setupOrganization', {
        action: 'join',
        organization_id: org.id,
        role: joinRole,
        invite_code: null,
      });
      if (response?.data?.success !== false && response?.data?.error !== true) {
        toast.success(`You’ve joined as ${joinRole === 'technician' ? 'a technician' : 'a client/stakeholder'}.`);
        if (joinRole === 'technician') {
          navigate(createPageUrl('TechnicianPortal'));
        } else {
          navigate(createPageUrl('ClientPortal'));
        }
        return;
      }
      throw new Error(response?.data?.error || response?.data?.message || 'Failed to join');
    } catch (err) {
      setError(err?.message || 'Failed to join organization. The org may require an invite code.');
    } finally {
      setLoading(false);
    }
  };

  const resetJoin = () => {
    setStep('choice');
    setJoinRole(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedOrg(null);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-8 bg-[#fafaf9]">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_50%,_#fafaf9_100%)] pointer-events-none" aria-hidden />
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px] aria-hidden" />

      <div className="relative w-full max-w-md">
        {/* Logo + branding — very large, classy */}
        <div className="text-center mb-10 sm:mb-12">
          {/* Add your logo at public/mygsis-logo.png; fallback: wordmark below */}
          <div className="flex justify-center mb-6">
            {!logoError ? (
              <img
                src="/mygsis-logo.png"
                alt="MYGSIS"
                className="h-28 sm:h-36 md:h-44 w-auto max-w-[320px] object-contain object-center drop-shadow-sm"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span
                className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#1c1917] select-none"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                MYGSIS
              </span>
            )}
          </div>
          <p className="text-[#57534e] text-sm sm:text-base tracking-wide uppercase letter-spacing-wider">
            Let&apos;s get your workspace set up
          </p>
          {user && (
            <p className="text-[#78716c] text-xs sm:text-sm mt-3 font-medium">
              Signed in as <span className="text-[#57534e]">{user.email}</span>
            </p>
          )}
        </div>

        {/* Step: Choose path */}
        {step === 'choice' && (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setStep('create')}
              className="group w-full rounded-xl border border-[#e7e5e4] bg-white p-5 text-left shadow-sm transition-all hover:border-[#d6d3d1] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 focus:ring-offset-2"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fef3c7] text-[#b45309] group-hover:bg-[#fde68a] transition-colors">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#1c1917]">Create New Organization</span>
                  <span className="mt-0.5 block text-xs text-[#78716c]">Start your own workspace and invite others</span>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#a8a29e] group-hover:text-[#78716c] transition-colors" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setJoinRole('technician');
                setStep('join');
                setSearchQuery('');
                setSearchResults([]);
                setSelectedOrg(null);
                setError('');
              }}
              className="group w-full rounded-xl border border-[#e7e5e4] bg-white p-5 text-left shadow-sm transition-all hover:border-[#d6d3d1] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 focus:ring-offset-2"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#475569] group-hover:bg-[#e2e8f0] transition-colors">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#1c1917]">Join as Technician</span>
                  <span className="mt-0.5 block text-xs text-[#78716c]">Search for your company and join the Tech Portal</span>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#a8a29e] group-hover:text-[#78716c] transition-colors" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setJoinRole('client');
                setStep('join');
                setSearchQuery('');
                setSearchResults([]);
                setSelectedOrg(null);
                setError('');
              }}
              className="group w-full rounded-xl border border-[#e7e5e4] bg-white p-5 text-left shadow-sm transition-all hover:border-[#d6d3d1] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1c1917]/10 focus:ring-offset-2"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#475569] group-hover:bg-[#e2e8f0] transition-colors">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#1c1917]">Join as Client / Stakeholder</span>
                  <span className="mt-0.5 block text-xs text-[#78716c]">Search for your organization and view progress reports</span>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#a8a29e] group-hover:text-[#78716c] transition-colors" />
              </div>
            </button>
          </div>
        )}

        {/* Step: Create Organization */}
        {step === 'create' && (
          <div className="rounded-xl border border-[#e7e5e4] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1c1917]">Create Organization</h2>
            <p className="mt-1 text-sm text-[#78716c]">You&apos;ll be the admin and can invite technicians and clients.</p>
            <div className="mt-5 space-y-4">
              {error && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1c1917]">Organization name</label>
                <Input
                  placeholder="e.g. Golden State Integrated Systems"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={loading}
                  className="border-[#e7e5e4] bg-[#fafaf9] focus:border-[#a8a29e] focus:ring-[#1c1917]/10"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={resetJoin} disabled={loading} className="flex-1 border-[#e7e5e4] text-[#57534e] hover:bg-[#f5f5f4]">
                  Back
                </Button>
                <Button onClick={handleCreateOrg} disabled={loading} className="flex-1 bg-[#b45309] text-white hover:bg-[#92400e]">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Join (search + select + join) */}
        {step === 'join' && joinRole && (
          <div className="rounded-xl border border-[#e7e5e4] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1c1917]">
              Join as {joinRole === 'technician' ? 'Technician' : 'Client / Stakeholder'}
            </h2>
            <p className="mt-1 text-sm text-[#78716c]">
              Search for your organization, select it, then tap Join. Your admin can then assign you projects, modules, or training.
            </p>
            <div className="mt-5 space-y-4">
              {error && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1c1917]">Search organization</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]" />
                  <Input
                    placeholder="Type your company or organization name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading}
                    className="border-[#e7e5e4] bg-[#fafaf9] pl-9 focus:border-[#a8a29e] focus:ring-[#1c1917]/10"
                  />
                </div>
              </div>

              {searching && (
                <div className="flex items-center gap-2 text-sm text-[#78716c]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-48 divide-y overflow-y-auto rounded-lg border border-[#e7e5e4]">
                  {searchResults.map((org) => {
                    const name = org.name || org.organization_name || 'Unnamed';
                    const isSelected = selectedOrg?.id === org.id;
                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => setSelectedOrg(isSelected ? null : org)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-[#fafaf9]',
                          isSelected && 'border-l-4 border-l-[#b45309] bg-[#fffbeb]'
                        )}
                      >
                        <span className="truncate font-medium text-[#1c1917]">{name}</span>
                        {isSelected ? (
                          <span className="text-xs font-medium text-[#b45309]">Selected</span>
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#a8a29e]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {searchQuery.trim() && !searching && searchResults.length === 0 && (
                <p className="text-sm text-[#78716c]">No organizations found. Try a different name or ask your admin to add you.</p>
              )}

              <p className="text-xs text-[#78716c]">
                After you join, your organization admin can assign you to projects, training, and modules.
              </p>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={resetJoin} disabled={loading} className="flex-1 border-[#e7e5e4] text-[#57534e] hover:bg-[#f5f5f4]">
                  Back
                </Button>
                <Button
                  onClick={handleJoinOrg}
                  disabled={loading || !selectedOrg}
                  className="flex-1 bg-[#b45309] text-white hover:bg-[#92400e]"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining...</>
                  ) : (
                    <>Join {selectedOrg ? (selectedOrg.name || selectedOrg.organization_name || '') : ''}</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
