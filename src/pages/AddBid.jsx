import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, Loader, CheckCircle, AlertCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const DEFAULT_PHASES = [
  {
    name: 'Site Survey & Design',
    duration_days: 5,
    description: 'Assess location, design low voltage alarm system layout, and customer approval',
    requirements: ['Site survey completed', 'System design approval', 'Permits reviewed']
  },
  {
    name: 'Material Procurement',
    duration_days: 10,
    description: 'Order all alarm panels, sensors, wiring, and equipment',
    requirements: ['Equipment ordered', 'Materials received', 'Quality inspection']
  },
  {
    name: 'Rough Wiring & Conduit',
    duration_days: 14,
    description: 'Install conduit runs, pull alarm wiring, place device boxes',
    requirements: ['Conduit installation', 'Wiring runs completed', 'Box placement']
  },
  {
    name: 'Device Installation',
    duration_days: 10,
    description: 'Mount sensors, detectors, keypads, and alarm panel',
    requirements: ['Sensors mounted', 'Panel installed', 'Keypads mounted']
  },
  {
    name: 'System Programming & Configuration',
    duration_days: 7,
    description: 'Program alarm zones, set sensor parameters, configure monitoring',
    requirements: ['Zones programmed', 'Sensor calibration', 'Monitoring setup']
  },
  {
    name: 'Testing & Inspection',
    duration_days: 5,
    description: 'Full system testing, alarm verification, and code compliance inspection',
    requirements: ['System tested', 'Alarm signals verified', 'Final inspection passed']
  },
  {
    name: 'Documentation & Customer Handoff',
    duration_days: 3,
    description: 'Provide documentation, user manuals, and customer training',
    requirements: ['Documentation provided', 'Customer trained', 'Warranty setup']
  }
];

export default function AddBid() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    project_name: '',
    agency: '',
    description: '',
    estimated_value: 0,
    due_date: ''
  });
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [newRequirement, setNewRequirement] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setUploadedFiles(prev => [...prev, { name: file.name, url: file_url }]);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
  };

  const analyzeMutation = useMutation({
    mutationFn: async (data) => {
      setAnalyzing(true);
      try {
        const response = await base44.functions.invoke('analyzeBidDocuments', {
          bidData: data,
          fileUrls: uploadedFiles.map(f => f.url)
        });
        setAnalysisResult(response.data);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['bids'] });
      } finally {
        setAnalyzing(false);
      }
    }
  });

  const handleAddPhase = () => {
    setPhases([...phases, {
      name: 'New Phase',
      duration_days: 7,
      description: '',
      requirements: []
    }]);
  };

  const handleDeletePhase = (idx) => {
    setPhases(phases.filter((_, i) => i !== idx));
  };

  const handleAddRequirement = (phaseIdx) => {
    const newReq = newRequirement[phaseIdx] || '';
    if (newReq.trim()) {
      const updatedPhases = [...phases];
      updatedPhases[phaseIdx].requirements.push(newReq);
      setPhases(updatedPhases);
      setNewRequirement({ ...newRequirement, [phaseIdx]: '' });
    }
  };

  const handleDeleteRequirement = (phaseIdx, reqIdx) => {
    const updatedPhases = [...phases];
    updatedPhases[phaseIdx].requirements = updatedPhases[phaseIdx].requirements.filter((_, i) => i !== reqIdx);
    setPhases(updatedPhases);
  };

  const handleAnalyze = () => {
    if (!formData.project_name || uploadedFiles.length === 0) {
      alert('Please enter a project name and upload at least one document');
      return;
    }
    analyzeMutation.mutate({ ...formData, phases });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Add Bid Manually</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bid Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Project Name"
            value={formData.project_name}
            onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
          />
          <Input
            placeholder="Agency/Client"
            value={formData.agency}
            onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
          />
          <Textarea
            placeholder="Project Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Estimated Value ($)"
            value={formData.estimated_value}
            onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) })}
          />
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Project Phases & Requirements</CardTitle>
            <Button size="sm" onClick={handleAddPhase} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-1" /> Add Phase
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {phases.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="border rounded-lg">
              <button
                onClick={() => setExpandedPhase(expandedPhase === phaseIdx ? -1 : phaseIdx)}
                className="w-full p-3 flex justify-between items-center hover:bg-slate-50"
              >
                <div className="text-left flex-1">
                  <p className="font-semibold text-slate-900">{phase.name}</p>
                  <p className="text-sm text-slate-600">{phase.duration_days} days • {phase.requirements.length} requirements</p>
                </div>
                {expandedPhase === phaseIdx ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {expandedPhase === phaseIdx && (
                <div className="border-t p-3 space-y-3 bg-slate-50">
                  <Input
                    placeholder="Phase Name"
                    value={phase.name}
                    onChange={(e) => {
                      const updated = [...phases];
                      updated[phaseIdx].name = e.target.value;
                      setPhases(updated);
                    }}
                  />
                  <Textarea
                    placeholder="Phase Description"
                    value={phase.description}
                    onChange={(e) => {
                      const updated = [...phases];
                      updated[phaseIdx].description = e.target.value;
                      setPhases(updated);
                    }}
                    className="resize-none"
                  />
                  <Input
                    type="number"
                    placeholder="Duration (days)"
                    value={phase.duration_days}
                    onChange={(e) => {
                      const updated = [...phases];
                      updated[phaseIdx].duration_days = parseInt(e.target.value);
                      setPhases(updated);
                    }}
                  />

                  <div>
                    <p className="font-semibold text-slate-700 mb-2">Requirements:</p>
                    <div className="space-y-2">
                      {phase.requirements.map((req, reqIdx) => (
                        <div key={reqIdx} className="flex justify-between items-center bg-white p-2 rounded border">
                          <span className="text-sm text-slate-600">{req}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRequirement(phaseIdx, reqIdx)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add requirement"
                        value={newRequirement[phaseIdx] || ''}
                        onChange={(e) => setNewRequirement({ ...newRequirement, [phaseIdx]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddRequirement(phaseIdx);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddRequirement(phaseIdx)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePhase(phaseIdx)}
                    className="w-full"
                  >
                    Delete Phase
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block">
            <div className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center cursor-pointer hover:bg-amber-50 transition">
              <Upload className="h-8 w-8 mx-auto text-amber-600 mb-2" />
              <p className="text-sm text-slate-600">Click to upload specifications, drawings, or documents</p>
              <p className="text-xs text-slate-500 mt-1">PDF, images, or documents</p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              />
            </div>
          </label>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-slate-700">Uploaded Files:</p>
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">{file.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleAnalyze}
        disabled={analyzing || !formData.project_name || uploadedFiles.length === 0}
        className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-lg"
      >
        {analyzing ? (
          <>
            <Loader className="h-5 w-5 mr-2 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Plus className="h-5 w-5 mr-2" />
            Analyze & Create Project
          </>
        )}
      </Button>

      {analysisResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Analysis Complete!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-slate-700 mb-2">Project Created:</p>
              <p className="text-slate-600">{analysisResult.projectName}</p>
            </div>
            {analysisResult.estimatedBudget && (
              <div>
                <p className="font-semibold text-slate-700 mb-2">Estimated Budget:</p>
                <p className="text-2xl font-bold text-green-600">${analysisResult.estimatedBudget.toLocaleString()}</p>
              </div>
            )}
            {analysisResult.timeline && (
              <div>
                <p className="font-semibold text-slate-700 mb-2">Estimated Timeline:</p>
                <p className="text-slate-600">{analysisResult.timeline} days</p>
              </div>
            )}
            {analysisResult.phases && analysisResult.phases.length > 0 && (
              <div>
                <p className="font-semibold text-slate-700 mb-2">Project Phases:</p>
                <ul className="space-y-1">
                  {analysisResult.phases.map((phase, idx) => (
                    <li key={idx} className="text-sm text-slate-600">• {phase}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}