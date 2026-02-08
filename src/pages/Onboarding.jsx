import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, ArrowRight } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('company'); // company, colors, done
  const [companyData, setCompanyData] = useState({
    name: '',
    logo_url: '',
    primary_color: '#1e40af',
    secondary_color: '#3b82f6',
    accent_color: '#60a5fa',
  });
  const [uploading, setUploading] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingOrg } = useQuery({
    queryKey: ['existingOrg', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const orgs = await base44.entities.Organization.filter({ owner_email: user.email });
      return orgs[0] || null;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (userLoading) return;
    
    if (!user) {
      navigate(createPageUrl('Home'));
      return;
    }

    if (existingOrg) {
      navigate(createPageUrl('Dashboard'));
    }
  }, [user, existingOrg, userLoading, navigate]);

  const createOrgMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Organization.create({
        ...data,
        owner_email: user.email,
        industry: 'general_contractor',
        subscription_tier: 'starter',
      }),
    onSuccess: () => {
      navigate(createPageUrl('Dashboard'));
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCompanyData({ ...companyData, logo_url: file_url });
    setUploading(false);
  };

  const handleCreateOrg = () => {
    createOrgMutation.mutate(companyData);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-md">
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Setup Your Company</h1>
          <p className="text-slate-400 mb-6">Welcome, {user?.full_name}!</p>

          {step === 'company' && (
            <div className="space-y-4">
              <div>
                <Label className="text-white">Company Name</Label>
                <Input
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="Your company name"
                  className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <Label className="text-white">Company Logo</Label>
                <label className="mt-1 block">
                  <div className="relative border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-white/40 transition">
                    {companyData.logo_url ? (
                      <img src={companyData.logo_url} alt="Logo" className="h-16 mx-auto mb-2" />
                    ) : (
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-slate-400">
                      {uploading ? 'Uploading...' : 'Click to upload logo'}
                    </p>
                    <input
                      type="file"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </label>
              </div>

              <Button
                onClick={() => setStep('colors')}
                disabled={!companyData.name}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 'colors' && (
            <div className="space-y-4">
              <div>
                <Label className="text-white">Primary Color</Label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={companyData.primary_color}
                    onChange={(e) => setCompanyData({ ...companyData, primary_color: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer"
                  />
                  <Input
                    value={companyData.primary_color}
                    onChange={(e) => setCompanyData({ ...companyData, primary_color: e.target.value })}
                    className="flex-1 bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Secondary Color</Label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={companyData.secondary_color}
                    onChange={(e) => setCompanyData({ ...companyData, secondary_color: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer"
                  />
                  <Input
                    value={companyData.secondary_color}
                    onChange={(e) => setCompanyData({ ...companyData, secondary_color: e.target.value })}
                    className="flex-1 bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Accent Color</Label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={companyData.accent_color}
                    onChange={(e) => setCompanyData({ ...companyData, accent_color: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer"
                  />
                  <Input
                    value={companyData.accent_color}
                    onChange={(e) => setCompanyData({ ...companyData, accent_color: e.target.value })}
                    className="flex-1 bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('company')}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateOrg}
                  disabled={createOrgMutation.isPending}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {createOrgMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}