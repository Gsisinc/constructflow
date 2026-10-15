import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { stampCreate, stampUpdate } from '@/lib/audit';
import { PROJECT_TYPE_CATALOG } from './projectTemplates';

// Build the flat type list from the same catalog the create wizard uses,
// so a saved wizard type (e.g. fire_alarm_new_construction) stays selected.
const PROJECT_TYPES = PROJECT_TYPE_CATALOG.flatMap((cat) =>
  cat.types.map((t) => ({ value: t.value, label: t.label }))
);

const STATUSES = [
  { value: 'bidding', label: 'Bidding' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const EMPTY = {
  name: '',
  client_name: '',
  project_type: 'commercial',
  status: 'bidding',
  priority: 'medium',
  address: '',
  start_date: '',
  end_date: '',
  budget: '',
  labor_hours: '',
  labor_rate: '',
  equipment_cost: '',
  description: '',
  project_manager: '',
  image_url: '',
};

export default function ProjectForm({ open, onOpenChange, project, onSubmit }) {
  const [formData, setFormData] = useState(project || EMPTY);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Re-sync local form whenever the project being edited changes
  // (so editing a second project doesn't keep the first one's values).
  useEffect(() => {
    if (open) setFormData(project || EMPTY);
  }, [open, project?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const baseData = {
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : 0,
      labor_rate: formData.labor_rate ? parseFloat(formData.labor_rate) : 0,
      equipment_cost: formData.equipment_cost ? parseFloat(formData.equipment_cost) : 0,
    };
    const stamped = project
      ? await stampUpdate(baseData)
      : await stampCreate(baseData);
    await onSubmit(stamped);
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success('Banner uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // If the saved type isn't in the catalog (legacy), still show it so it isn't lost.
  const typeOptions =
    formData.project_type && !PROJECT_TYPES.some((t) => t.value === formData.project_type)
      ? [{ value: formData.project_type, label: formData.project_type.replace(/_/g, ' ') }, ...PROJECT_TYPES]
      : PROJECT_TYPES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client Name *</Label>
              <Input
                id="client"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Enter client name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Project Type *</Label>
              <Select
                value={formData.project_type || ''}
                onValueChange={(value) => setFormData({ ...formData, project_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Project location"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm">Project Manager</Label>
              <Input
                id="pm"
                value={formData.project_manager}
                onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
                placeholder="Manager name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labor_hours">Labor Hours</Label>
              <Input
                id="labor_hours"
                type="number"
                step="0.25"
                value={formData.labor_hours ?? ''}
                onChange={(e) => setFormData({ ...formData, labor_hours: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labor_rate">Labor Rate ($/hr)</Label>
              <Input
                id="labor_rate"
                type="number"
                step="0.01"
                value={formData.labor_rate ?? ''}
                onChange={(e) => setFormData({ ...formData, labor_rate: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment_cost">Equipment Cost ($)</Label>
              <Input
                id="equipment_cost"
                type="number"
                step="0.01"
                value={formData.equipment_cost ?? ''}
                onChange={(e) => setFormData({ ...formData, equipment_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project details..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Banner Image</Label>
            {formData.image_url ? (
              <div className="relative">
                <img src={formData.image_url} alt="Banner" className="w-full h-40 object-cover rounded-lg" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-slate-400 mb-2 animate-spin" />
                    <span className="text-sm text-slate-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">Click to upload banner</span>
                    <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2" />}
              {project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}