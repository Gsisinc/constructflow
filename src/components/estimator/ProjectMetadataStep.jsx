import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ProjectMetadataStep({ data, onComplete }) {
  const [formData, setFormData] = useState({
    projectName: data.projectName || '',
    projectAddress: data.projectAddress || '',
    gcName: data.gcName || '',
    location: data.location || 'in-state',
    notes: data.notes || '',
  });

  const handleSubmit = () => {
    if (!formData.projectName || !formData.projectAddress || !formData.gcName) {
      toast.error('Please fill in all required fields');
      return;
    }
    onComplete(formData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Project Name *</label>
        <Input
          value={formData.projectName}
          onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          placeholder="e.g., Downtown Plaza Tech Buildout"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Project Address *</label>
        <Input
          value={formData.projectAddress}
          onChange={(e) => setFormData({ ...formData, projectAddress: e.target.value })}
          placeholder="e.g., 123 Main St, Sacramento, CA 95814"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">General Contractor *</label>
        <Input
          value={formData.gcName}
          onChange={(e) => setFormData({ ...formData, gcName: e.target.value })}
          placeholder="e.g., Smith Construction Inc."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Project Location *</label>
        <select
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="in-state">California (Base: Isleton, CA)</option>
          <option value="out-of-state">Out of State</option>
        </select>
        <p className="text-xs text-slate-500">
          {formData.location === 'out-of-state' ? 'Out-of-state jobs include per diem, travel, and licensing review.' : ''}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Notes & Special Instructions (Optional)</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="e.g., 'Occupied building — work nights only', 'Verify device models with GC before pricing'"
          className="h-24"
        />
      </div>

      <Button onClick={handleSubmit} className="w-full mt-8">
        Continue to Symbol Review
      </Button>
    </div>
  );
}