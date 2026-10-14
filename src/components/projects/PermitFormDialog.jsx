import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PERMIT_TYPES = [
  { value: 'building', label: 'Building' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'fire', label: 'Fire' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'occupancy', label: 'Occupancy' },
  { value: 'other', label: 'Other' },
];

const STATUSES = ['not_started', 'preparing', 'submitted', 'under_review', 'approved', 'rejected', 'expired'];

export default function PermitFormDialog({ open, onOpenChange, projectId, onCreated }) {
  const [form, setForm] = useState({
    permit_type: 'building',
    permit_number: '',
    description: '',
    status: 'not_started',
    issuing_authority: '',
    application_date: '',
    fees: '',
  });
  const [saving, setSaving] = useState(false);

  const reset = () => setForm({ permit_type: 'building', permit_number: '', description: '', status: 'not_started', issuing_authority: '', application_date: '', fees: '' });

  const handleSave = async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Permit.create({
        project_id: projectId,
        permit_type: form.permit_type,
        permit_number: form.permit_number,
        description: form.description,
        status: form.status,
        issuing_authority: form.issuing_authority,
        application_date: form.application_date || null,
        fees: form.fees ? parseFloat(form.fees) : null,
      });
      toast.success('Permit added');
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error('Failed to add permit: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Permit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Permit Type *</Label>
              <Select value={form.permit_type} onValueChange={(v) => setForm({ ...form, permit_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERMIT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Permit Number</Label>
              <Input value={form.permit_number} onChange={(e) => setForm({ ...form, permit_number: e.target.value })} placeholder="e.g. BP-2026-0123" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Issuing Authority</Label>
              <Input value={form.issuing_authority} onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })} placeholder="e.g. City of Sacramento" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Application Date</Label>
              <Input type="date" value={form.application_date} onChange={(e) => setForm({ ...form, application_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Fees ($)</Label>
              <Input type="number" value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Scope of permit…" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Permit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}