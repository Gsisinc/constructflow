import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, Palette, Building2, Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

export default function Settings() {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: organization } = useQuery({
    queryKey: ['organization', user?.email],
    queryFn: async () => {
      const orgs = await base44.entities.Organization.filter({ owner_email: user.email });
      if (orgs.length === 0) {
        const newOrg = await base44.entities.Organization.create({
          name: 'My Company',
          owner_email: user.email
        });
        return newOrg;
      }
      return orgs[0];
    },
    enabled: !!user?.email
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.update(organization.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Settings saved');
      window.location.reload();
    }
  });

  const [orgForm, setOrgForm] = useState({});

  React.useEffect(() => {
    if (organization) {
      setOrgForm(organization);
    }
  }, [organization]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setOrgForm({ ...orgForm, logo_url: file_url });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = () => {
    updateOrgMutation.mutate(orgForm);
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your company profile and preferences</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="branding">White Label & Branding</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={orgForm.name || ''}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    placeholder="Acme Construction"
                  />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Select value={orgForm.industry} onValueChange={(value) => setOrgForm({ ...orgForm, industry: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_contractor">General Contractor</SelectItem>
                      <SelectItem value="low_voltage">Low Voltage</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="specialty">Specialty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  value={orgForm.address || ''}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={orgForm.phone || ''}
                    onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={orgForm.website || ''}
                    onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                White Label & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Company Logo</Label>
                <div className="mt-2 flex items-center gap-4">
                  {orgForm.logo_url && (
                    <img src={orgForm.logo_url} alt="Logo" className="h-16 w-16 object-contain border rounded-lg" />
                  )}
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                      {uploadingLogo ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-slate-600">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">Upload Logo</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleLogoUpload}
                      accept="image/*"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={orgForm.primary_color || '#1e40af'}
                      onChange={(e) => setOrgForm({ ...orgForm, primary_color: e.target.value })}
                      className="h-10 w-16 rounded border cursor-pointer"
                    />
                    <Input
                      value={orgForm.primary_color || '#1e40af'}
                      onChange={(e) => setOrgForm({ ...orgForm, primary_color: e.target.value })}
                      placeholder="#1e40af"
                    />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={orgForm.secondary_color || '#3b82f6'}
                      onChange={(e) => setOrgForm({ ...orgForm, secondary_color: e.target.value })}
                      className="h-10 w-16 rounded border cursor-pointer"
                    />
                    <Input
                      value={orgForm.secondary_color || '#3b82f6'}
                      onChange={(e) => setOrgForm({ ...orgForm, secondary_color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      value={orgForm.accent_color || '#60a5fa'}
                      onChange={(e) => setOrgForm({ ...orgForm, accent_color: e.target.value })}
                      className="h-10 w-16 rounded border cursor-pointer"
                    />
                    <Input
                      value={orgForm.accent_color || '#60a5fa'}
                      onChange={(e) => setOrgForm({ ...orgForm, accent_color: e.target.value })}
                      placeholder="#60a5fa"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Preview</p>
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded" style={{ backgroundColor: orgForm.primary_color }} />
                  <div className="h-12 w-12 rounded" style={{ backgroundColor: orgForm.secondary_color }} />
                  <div className="h-12 w-12 rounded" style={{ backgroundColor: orgForm.accent_color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Timezone</Label>
                  <Select value={orgForm.timezone} onValueChange={(value) => setOrgForm({ ...orgForm, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date Format</Label>
                  <Select value={orgForm.date_format} onValueChange={(value) => setOrgForm({ ...orgForm, date_format: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Work Hours Start</Label>
                  <Input
                    type="time"
                    value={orgForm.work_hours_start || '08:00'}
                    onChange={(e) => setOrgForm({ ...orgForm, work_hours_start: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Work Hours End</Label>
                  <Input
                    type="time"
                    value={orgForm.work_hours_end || '17:00'}
                    onChange={(e) => setOrgForm({ ...orgForm, work_hours_end: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Currency</Label>
                <Select value={orgForm.currency} onValueChange={(value) => setOrgForm({ ...orgForm, currency: value })}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateOrgMutation.isPending}>
          {updateOrgMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}