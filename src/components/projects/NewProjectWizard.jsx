import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Plus, Trash2, Upload, Loader2, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { PROJECT_TYPE_CATALOG, getPhaseTemplate } from './projectTemplates';

const STATUSES = [
  { value: 'bidding', label: 'Bidding' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

// ─── Step 1: Pick project type ────────────────────────────────────────────────
function StepTypeSelector({ selectedType, onSelect }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Select Project Type</h2>
        <p className="text-sm text-slate-500 mt-1">This determines which phases and checklists are generated for your project.</p>
      </div>
      {PROJECT_TYPE_CATALOG.map(category => (
        <div key={category.category}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{category.icon}</span>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{category.category}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {category.types.map(type => (
              <button
                key={type.value}
                onClick={() => onSelect(type.value)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  selectedType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{type.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                  </div>
                  {selectedType === type.value && (
                    <Check className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Step 2: Project details ─────────────────────────────────────────────────
function StepProjectDetails({ formData, onChange, uploading, onImageUpload }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Project Details</h2>
        <p className="text-sm text-slate-500 mt-1">Fill in the basic information for this project.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Project Name *</Label>
          <Input value={formData.name} onChange={e => onChange('name', e.target.value)} placeholder="Enter project name" />
        </div>
        <div className="space-y-1.5">
          <Label>Client Name *</Label>
          <Input value={formData.client_name} onChange={e => onChange('client_name', e.target.value)} placeholder="Enter client name" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={v => onChange('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={v => onChange('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Project Manager</Label>
          <Input value={formData.project_manager} onChange={e => onChange('project_manager', e.target.value)} placeholder="PM name" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Address</Label>
        <Input value={formData.address} onChange={e => onChange('address', e.target.value)} placeholder="Project location" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={formData.start_date} onChange={e => onChange('start_date', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input type="date" value={formData.end_date} onChange={e => onChange('end_date', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Budget ($)</Label>
          <Input type="number" value={formData.budget} onChange={e => onChange('budget', e.target.value)} placeholder="0.00" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={e => onChange('description', e.target.value)} placeholder="Project details..." rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label>Project Banner Image</Label>
        {formData.image_url ? (
          <div className="relative">
            <img src={formData.image_url} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
            <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7"
              onClick={() => onChange('image_url', '')}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            {uploading ? <Loader2 className="h-6 w-6 text-slate-400 animate-spin" /> : <Upload className="h-6 w-6 text-slate-400 mb-1" />}
            <span className="text-xs text-slate-500">{uploading ? 'Uploading...' : 'Click to upload banner'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Review & edit phases ────────────────────────────────────────────
function StepPhaseReview({ phases, onChange }) {
  const addItem = (phaseIdx) => {
    const updated = [...phases];
    updated[phaseIdx] = { ...updated[phaseIdx], items: [...updated[phaseIdx].items, ''] };
    onChange(updated);
  };

  const removeItem = (phaseIdx, itemIdx) => {
    const updated = [...phases];
    updated[phaseIdx].items = updated[phaseIdx].items.filter((_, i) => i !== itemIdx);
    onChange(updated);
  };

  const updateItem = (phaseIdx, itemIdx, value) => {
    const updated = [...phases];
    updated[phaseIdx].items[itemIdx] = value;
    onChange(updated);
  };

  const toggleItem = (phaseIdx, itemIdx) => {
    const updated = [...phases];
    const items = [...updated[phaseIdx].items];
    // items are strings; completed tracked separately if needed — skip for now
    onChange(updated);
  };

  const addPhase = () => {
    onChange([...phases, { phase: 'New Phase', items: [''] }]);
  };

  const removePhase = (idx) => {
    onChange(phases.filter((_, i) => i !== idx));
  };

  const updatePhaseName = (idx, name) => {
    const updated = [...phases];
    updated[idx] = { ...updated[idx], phase: name };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Review & Edit Phase Requirements</h2>
          <p className="text-sm text-slate-500 mt-1">
            All {phases.reduce((s, p) => s + p.items.length, 0)} requirements pre-loaded from your project type template. Edit, add, or remove anything.
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-700 flex-shrink-0">{phases.length} phases</Badge>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {phases.map((phase, phaseIdx) => (
          <div key={phaseIdx} className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Phase header */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-200">
              <Input
                value={phase.phase}
                onChange={e => updatePhaseName(phaseIdx, e.target.value)}
                className="h-7 text-sm font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 flex-1"
              />
              <Badge variant="outline" className="text-xs flex-shrink-0">{phase.items.length} items</Badge>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 flex-shrink-0"
                onClick={() => removePhase(phaseIdx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Phase items */}
            <div className="p-3 space-y-1.5">
              {phase.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded border border-slate-300 flex-shrink-0 mt-0.5" />
                  <Input
                    value={item}
                    onChange={e => updateItem(phaseIdx, itemIdx, e.target.value)}
                    className="h-7 text-xs border-slate-200 flex-1"
                    placeholder="Requirement..."
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 flex-shrink-0"
                    onClick={() => removeItem(phaseIdx, itemIdx)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-blue-600 gap-1 mt-1"
                onClick={() => addItem(phaseIdx)}>
                <Plus className="h-3 w-3" /> Add item
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addPhase} className="gap-1">
        <Plus className="h-3 w-3" /> Add Phase
      </Button>
    </div>
  );
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────
export default function NewProjectWizard({ open, onOpenChange, onCreated, organizationId }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    name: '', client_name: '', status: 'bidding', priority: 'medium',
    address: '', start_date: '', end_date: '', budget: '',
    description: '', project_manager: '', image_url: '',
  });
  const [phases, setPhases] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setPhases(getPhaseTemplate(type).map(p => ({ ...p, items: [...p.items] })));
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('image_url', file_url);
      toast.success('Banner uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const project = await base44.entities.Project.create({
        ...formData,
        project_type: selectedType,
        organization_id: organizationId,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      });

      // Bulk-create phase requirements
      const allRequirements = [];
      phases.forEach((phase, phaseOrder) => {
        phase.items.forEach((item, itemOrder) => {
          if (item.trim()) {
            allRequirements.push({
              project_id: project.id,
              phase_name: phase.phase,
              requirement_text: item.trim(),
              order: phaseOrder * 1000 + itemOrder,
              status: 'pending',
            });
          }
        });
      });

      if (allRequirements.length > 0) {
        await base44.entities.PhaseRequirement.bulkCreate(allRequirements);
      }

      toast.success(`Project created with ${allRequirements.length} phase requirements`);
      onCreated(project);
      // Reset
      setStep(1);
      setSelectedType('');
      setFormData({ name: '', client_name: '', status: 'bidding', priority: 'medium', address: '', start_date: '', end_date: '', budget: '', description: '', project_manager: '', image_url: '' });
      setPhases([]);
    } catch (err) {
      toast.error('Failed to create project: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const canProceedStep1 = !!selectedType;
  const canProceedStep2 = !!formData.name && !!formData.client_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            New Project
            <div className="flex items-center gap-1 ml-auto">
              {[1, 2, 3].map(s => (
                <React.Fragment key={s}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>{step > s ? <Check className="h-3 w-3" /> : s}</div>
                  {s < 3 && <div className={`h-0.5 w-6 transition-colors ${step > s ? 'bg-green-500' : 'bg-slate-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 pr-1">
          {step === 1 && <StepTypeSelector selectedType={selectedType} onSelect={handleTypeSelect} />}
          {step === 2 && <StepProjectDetails formData={formData} onChange={handleChange} uploading={uploading} onImageUpload={handleImageUpload} />}
          {step === 3 && <StepPhaseReview phases={phases} onChange={setPhases} />}
        </div>

        <div className="flex justify-between pt-4 border-t mt-2">
          <Button variant="outline" onClick={() => step === 1 ? onOpenChange(false) : setStep(s => s - 1)}>
            {step === 1 ? 'Cancel' : <><ChevronLeft className="h-4 w-4 mr-1" />Back</>}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Create Project
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}