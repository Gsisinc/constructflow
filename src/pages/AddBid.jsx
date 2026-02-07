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
    name: 'Design & Planning',
    duration_days: 7,
    description: 'System design, planning, and proposal development',
    requirements: ['Design documentation', 'Budget approval', 'Equipment selection']
  },
  {
    name: 'Material Procurement',
    duration_days: 14,
    description: 'Order and receive all materials and equipment',
    requirements: ['Purchase orders', 'Vendor confirmations', 'Material delivery']
  },
  {
    name: 'Installation & Wiring',
    duration_days: 21,
    description: 'Cable runs, equipment installation, and wiring',
    requirements: ['Cabling install', 'Equipment mounting', 'Conduit installation']
  },
  {
    name: 'System Configuration',
    duration_days: 10,
    description: 'Programming and configuration of security system',
    requirements: ['Panel programming', 'Sensor configuration', 'Network setup']
  },
  {
    name: 'Testing & Commissioning',
    duration_days: 7,
    description: 'System testing and performance verification',
    requirements: ['System testing', 'Backup verification', 'Performance validation']
  },
  {
    name: 'Documentation & Training',
    duration_days: 5,
    description: 'Create documentation and train client staff',
    requirements: ['As-built documentation', 'User manuals', 'Staff training']
  },
  {
    name: 'Closeout',
    duration_days: 3,
    description: 'Final inspections, warranty setup, and project closure',
    requirements: ['Final inspection', 'Warranty registration', 'Closeout documentation']
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

  const handleAnalyze = () => {
    if (!formData.project_name || uploadedFiles.length === 0) {
      alert('Please enter a project name and upload at least one document');
      return;
    }
    analyzeMutation.mutate(formData);
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