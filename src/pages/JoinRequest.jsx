import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function JoinRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    requested_role: 'team_member',
    company: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await base44.functions.invoke('submitSignupRequest', formData);
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Application submitted! We\'ll review it soon.');
      } else {
        toast.error('Failed to submit application');
      }
    } catch (error) {
      toast.error('Failed to submit application: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-600/5 to-slate-950 pointer-events-none"></div>
        <Card className="w-full max-w-md text-center bg-slate-900/50 backdrop-blur-md border-white/10 relative z-10">
          <CardContent className="pt-12 pb-8">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Application Submitted!</h2>
            <p className="text-slate-400 mb-6">
              Your signup request has been received. An admin will review your application and send you an invite email once approved.
            </p>
            <Button onClick={() => navigate(createPageUrl('Home'))} variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-white">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-600/5 to-slate-950 pointer-events-none"></div>
      <Card className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-md border-white/10 relative z-10">
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/d9a9b4af8_ChatGPT_Image_Jan_20__2026__08_11_07_PM-removebg.png" 
              alt="GSIS Manager" 
              className="h-12 w-auto"
            />
            <div>
              <CardTitle className="text-2xl text-white">Join GSIS Manager</CardTitle>
              <CardDescription className="text-slate-400">Submit your application for access</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-slate-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
                />
              </div>

              <div>
                <Label className="text-slate-300">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  required
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
                />
              </div>

              <div>
                <Label className="text-slate-300">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
                />
              </div>

              <div>
                <Label className="text-slate-300">Requested Role *</Label>
                <Select value={formData.requested_role} onValueChange={(value) => setFormData({ ...formData, requested_role: value })}>
                  <SelectTrigger className="bg-slate-950/50 border-white/10 text-white focus:border-amber-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="foreman">Foreman</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                    <SelectItem value="stakeholder">Stakeholder</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1.5">
                  {formData.requested_role === 'project_manager' && 'Manage projects and teams'}
                  {formData.requested_role === 'foreman' && 'Lead field operations'}
                  {formData.requested_role === 'team_member' && 'Work on assigned tasks'}
                  {formData.requested_role === 'stakeholder' && 'View project progress'}
                </p>
              </div>

              <div>
                <Label className="text-slate-300">Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your Company Name"
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
                />
              </div>

              <div>
                <Label className="text-slate-300">Why do you want to join?</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your interest..."
                  className="h-24 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('Home'))} className="flex-1 border-white/10 text-white hover:bg-white/5 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}