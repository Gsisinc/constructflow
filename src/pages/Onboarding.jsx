import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState({
    name: '',
    industry: 'low_voltage',
    phone: '',
    website: ''
  });
  const [userData, setUserData] = useState({
    user_role: 'owner',
    phone: ''
  });

  const handleCreateOrganization = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Create organization
      const org = await base44.entities.Organization.create({
        ...orgData,
        owner_email: user.email
      });

      // Update user with organization
      await base44.auth.updateMe({
        organization_id: org.id,
        organization_name: org.name,
        user_role: userData.user_role,
        phone: userData.phone
      });

      toast.success('Organization created successfully!');
      window.location.href = '/Dashboard';
    } catch (error) {
      toast.error('Failed to create organization');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-slate-200 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/d9a9b4af8_ChatGPT_Image_Jan_20__2026__08_11_07_PM-removebg.png" 
              alt="GSIS Manager" 
              className="h-12 w-auto"
            />
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">Welcome to GSIS Manager</CardTitle>
              <CardDescription>Set up your organization to get started</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <Input
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <Label>Industry</Label>
                <Select value={orgData.industry} onValueChange={(value) => setOrgData({ ...orgData, industry: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low_voltage">Low Voltage / Data Cabling</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="general_contractor">General Contractor</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="specialty">Specialty Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Company Phone</Label>
                <Input
                  value={orgData.phone}
                  onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <Label>Website (Optional)</Label>
                <Input
                  value={orgData.website}
                  onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                />
              </div>

              <Button onClick={() => setStep(2)} className="w-full" disabled={!orgData.name}>
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Your Role</Label>
                <Select value={userData.user_role} onValueChange={(value) => setUserData({ ...userData, user_role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                    <SelectItem value="stakeholder">Stakeholder</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 mt-1">
                  {userData.user_role === 'owner' && 'Full access to all features and settings'}
                  {userData.user_role === 'administrator' && 'Manage projects, users, and settings'}
                  {userData.user_role === 'project_manager' && 'Create and manage projects'}
                  {userData.user_role === 'team_member' && 'Work on assigned tasks and projects'}
                  {userData.user_role === 'stakeholder' && 'View project progress and updates'}
                </p>
              </div>

              <div>
                <Label>Your Phone</Label>
                <Input
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCreateOrganization} className="flex-1" disabled={loading}>
                  {loading ? 'Creating...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}