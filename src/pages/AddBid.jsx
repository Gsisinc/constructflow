import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, Loader, CheckCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { buildBidAnalysisPrompt, normalizeBidAnalysis } from '@/lib/bidAnalysis';
import { convertBidToProjectFromAI } from '@/lib/bidConversion';

const DEFAULT_PHASES = [
  {
    name: 'Site Survey & Design',
    duration_days: 5,
    description: 'Assess location and design project approach',
    requirements: ['Site survey completed', 'Design approval', 'Permits reviewed']
  },
  {
    name: 'Material Procurement',
    duration_days: 10,
    description: 'Order all required material and equipment',
    requirements: ['Vendor quote finalized', 'Materials received', 'Quality inspection']
  },
  {
    name: 'Installation & Execution',
    duration_days: 14,
    description: 'Execute installation and core scope delivery',
    requirements: ['Field execution complete', 'Installation QA passed']
  },
  {
    name: 'Testing & Handoff',
    duration_days: 7,
    description: 'Final testing, closeout documents, and handoff',
    requirements: ['Commissioning complete', 'Client handoff complete']
  }
];

export default function AddBid() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    project_name: '',
    agency: '',
    description: '',
    estimated_value: 0,
    due_date: '',
    project_type: 'commercial',
    location: ''
  });
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [newRequirement, setNewRequirement] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [createdBidId, setCreatedBidId] = useState(null);
  const [createdProjectId, setCreatedProjectId] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const canAnalyze = useMemo(() => formData.project_name && uploadedFiles.length > 0, [formData.project_name, uploadedFiles.length]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setUploadedFiles((prev) => [...prev, { name: file.name, url: file_url, type: file.type, size: file.size }]);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
  };

  const handleAddPhase = () => {
    setPhases((prev) => [...prev, {
      name: 'New Phase',
      duration_days: 7,
      description: '',
      requirements: []
    }]);
  };

  const handleDeletePhase = (idx) => {
    setPhases((prev) => prev.filter((_, i) => i !== idx));
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

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setAnalyzing(true);
      const bid = await base44.entities.BidOpportunity.create({
        organization_id: null,
        title: formData.project_name,
        project_name: formData.project_name,
        agency: formData.agency,
        client_name: formData.agency,
        description: formData.description,
        scope_of_work: formData.description,
        estimated_value: Number(formData.estimated_value || 0),
        due_date: formData.due_date || null,
        project_type: formData.project_type,
        location: formData.location,
        status: 'analyzing',
        source: 'manual_entry'
      });

      setCreatedBidId(bid.id);

      const createdDocs = await Promise.all(uploadedFiles.map((file) => base44.entities.BidDocument.create({
        bid_opportunity_id: bid.id,
        organization_id: bid.organization_id,
        name: file.name,
        file_url: file.url,
        file_type: file.type,
        file_size: file.size,
        ai_processed: false
      })));

      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: buildBidAnalysisPrompt({ formData, phases, fileCount: uploadedFiles.length }),
        file_urls: uploadedFiles.map((f) => f.url),
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            project_overview: {
              type: 'object',
              properties: {
                scope_summary: { type: 'string' },
                timeline_days: { type: 'number' },
                estimated_budget: { type: 'number' }
              }
            },
            deadlines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  date: { type: 'string' },
                  source: { type: 'string' }
                }
              }
            },
            bid_requirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  category: { type: 'string' },
                  priority: { type: 'string' },
                  source: { type: 'string' }
                }
              }
            },
            project_requirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  category: { type: 'string' },
                  priority: { type: 'string' },
                  source: { type: 'string' }
                }
              }
            },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  duration_days: { type: 'number' },
                  description: { type: 'string' },
                  requirements: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  severity: { type: 'string' },
                  mitigation: { type: 'string' }
                }
              }
            },
            confidence_notes: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      const normalized = normalizeBidAnalysis(llmResponse, { ...formData, phases });

      const combinedRequirements = [
        ...normalized.bidRequirements,
        ...normalized.projectRequirements
      ];

      if (combinedRequirements.length > 0) {
        await Promise.all(combinedRequirements.map((req) => base44.entities.BidRequirement.create({
          bid_opportunity_id: bid.id,
          organization_id: bid.organization_id,
          requirement_text: req.text,
          category: req.category,
          priority: req.priority,
          status: 'pending',
          ai_extracted: true
        })));
      }

      await Promise.all(createdDocs.map((doc) => base44.entities.BidDocument.update(doc.id, {
        ai_processed: true,
        extracted_data: {
          summary: normalized.summary,
          deadlines: normalized.deadlines,
          risks: normalized.risks,
          confidence_notes: normalized.confidenceNotes
        }
      })));

      await base44.entities.BidOpportunity.update(bid.id, {
        status: 'estimating',
        due_date: formData.due_date || normalized.deadlines[0]?.date || null,
        estimated_value: normalized.estimatedBudget,
        ai_analysis: {
          complexity_score: Math.min(10, Math.max(1, Math.round((normalized.risks.length || 1) * 1.5))),
          risk_factors: normalized.risks.map((r) => r.risk || '').filter(Boolean),
          recommended_markup: normalized.risks.length > 4 ? 20 : 15,
          key_points: [normalized.summary, ...normalized.confidenceNotes].filter(Boolean),
          requirements_count: combinedRequirements.length,
          deadlines: normalized.deadlines,
          project_requirements: normalized.projectRequirements,
          phases: normalized.phases,
          analyzed_at: new Date().toISOString()
        }
      });

      const requirements = await base44.entities.BidRequirement.filter({ bid_opportunity_id: bid.id });
      const project = await convertBidToProjectFromAI({
        base44Client: base44,
        bid: {
          ...bid,
          due_date: formData.due_date || normalized.deadlines[0]?.date || null,
          estimated_value: normalized.estimatedBudget,
          description: normalized.scopeSummary || formData.description,
          ai_analysis: {
            complexity_score: Math.min(10, Math.max(1, Math.round((normalized.risks.length || 1) * 1.5))),
            risk_factors: normalized.risks.map((r) => r.risk || '').filter(Boolean),
            recommended_markup: normalized.risks.length > 4 ? 20 : 15,
            key_points: [normalized.summary],
            requirements_count: combinedRequirements.length
          }
        },
        organizationId: bid.organization_id,
        requirements
      });

      setCreatedProjectId(project.id);
      setAnalysisResult({
        summary: normalized.summary,
        estimatedBudget: normalized.estimatedBudget,
        timeline: normalized.timelineDays,
        phases: normalized.phases.map((p) => p.name),
        bidRequirementsCount: normalized.bidRequirements.length,
        projectRequirementsCount: normalized.projectRequirements.length,
        deadlines: normalized.deadlines,
        risks: normalized.risks
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['bidOpportunities'] });

      return { bidId: bid.id, projectId: project.id };
    },
    onError: (error) => {
      console.error('Analyze workflow failed', error);
      alert(`Analysis failed: ${error.message || 'Unknown error'}`);
    },
    onSettled: () => setAnalyzing(false)
  });

  const handleAnalyze = () => {
    if (!canAnalyze) {
      alert('Please enter a project name and upload at least one document');
      return;
    }
    analyzeMutation.mutate();
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
          <Input placeholder="Project Name" value={formData.project_name} onChange={(e) => setFormData({ ...formData, project_name: e.target.value })} />
          <Input placeholder="Agency/Client" value={formData.agency} onChange={(e) => setFormData({ ...formData, agency: e.target.value })} />
          <Textarea placeholder="Project Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <Input type="number" placeholder="Estimated Value ($)" value={formData.estimated_value} onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value || '0') })} />
          <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
          <Input placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
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
              <button onClick={() => setExpandedPhase(expandedPhase === phaseIdx ? -1 : phaseIdx)} className="w-full p-3 flex justify-between items-center hover:bg-slate-50">
                <div className="text-left flex-1">
                  <p className="font-semibold text-slate-900">{phase.name}</p>
                  <p className="text-sm text-slate-600">{phase.duration_days} days • {phase.requirements.length} requirements</p>
                </div>
                {expandedPhase === phaseIdx ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {expandedPhase === phaseIdx && (
                <div className="border-t p-3 space-y-3 bg-slate-50">
                  <Input placeholder="Phase Name" value={phase.name} onChange={(e) => {
                    const updated = [...phases];
                    updated[phaseIdx].name = e.target.value;
                    setPhases(updated);
                  }} />
                  <Textarea placeholder="Phase Description" value={phase.description} onChange={(e) => {
                    const updated = [...phases];
                    updated[phaseIdx].description = e.target.value;
                    setPhases(updated);
                  }} className="resize-none" />
                  <Input type="number" placeholder="Duration (days)" value={phase.duration_days} onChange={(e) => {
                    const updated = [...phases];
                    updated[phaseIdx].duration_days = parseInt(e.target.value || '0');
                    setPhases(updated);
                  }} />

                  <div>
                    <p className="font-semibold text-slate-700 mb-2">Requirements:</p>
                    <div className="space-y-2">
                      {phase.requirements.map((req, reqIdx) => (
                        <div key={reqIdx} className="flex justify-between items-center bg-white p-2 rounded border">
                          <span className="text-sm text-slate-600">{req}</span>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteRequirement(phaseIdx, reqIdx)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Add requirement" value={newRequirement[phaseIdx] || ''} onChange={(e) => setNewRequirement({ ...newRequirement, [phaseIdx]: e.target.value })} onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddRequirement(phaseIdx);
                      }} />
                      <Button size="sm" onClick={() => handleAddRequirement(phaseIdx)} className="bg-amber-600 hover:bg-amber-700">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button size="sm" variant="destructive" onClick={() => handleDeletePhase(phaseIdx)} className="w-full">
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
          <CardTitle>Upload Bid Documents & Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block">
            <div className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center cursor-pointer hover:bg-amber-50 transition">
              <Upload className="h-8 w-8 mx-auto text-amber-600 mb-2" />
              <p className="text-sm text-slate-600">Click to upload specifications, drawings, SOW, compliance docs</p>
              <p className="text-xs text-slate-500 mt-1">PDF, images, or documents</p>
              <input type="file" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" />
            </div>
          </label>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-slate-700">Uploaded Files:</p>
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-600">{file.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleAnalyze} disabled={analyzing || !canAnalyze} className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-lg">
        {analyzing ? (
          <>
            <Loader className="h-5 w-5 mr-2 animate-spin" />
            Analyzing docs, generating requirements, and creating project...
          </>
        ) : (
          <>
            <Plus className="h-5 w-5 mr-2" />
            Analyze Documents & Build Project
          </>
        )}
      </Button>

      {analysisResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Analysis Complete + Project Created</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700">{analysisResult.summary}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-slate-700 mb-1">Estimated Budget</p>
                <p className="text-xl font-bold text-green-600">${Number(analysisResult.estimatedBudget || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Estimated Timeline</p>
                <p className="text-slate-700">{analysisResult.timeline || 'N/A'} days</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Bid Requirements</p>
                <p className="text-slate-700">{analysisResult.bidRequirementsCount}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Project Requirements</p>
                <p className="text-slate-700">{analysisResult.projectRequirementsCount}</p>
              </div>
            </div>

            {analysisResult.deadlines?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-700 mb-1">Detected Deadlines</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {analysisResult.deadlines.map((deadline, idx) => (
                    <li key={idx}>• {deadline.name || 'Deadline'} — {deadline.date || 'Unknown date'}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.phases?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-700 mb-1">Project Phases</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {analysisResult.phases.map((phase, idx) => (
                    <li key={idx}>• {phase}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.risks?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-700 mb-1">Top Risks</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {analysisResult.risks.slice(0, 5).map((risk, idx) => (
                    <li key={idx}>• {risk.risk || 'Risk identified'} ({risk.severity || 'medium'})</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {createdBidId && (
                <Button variant="outline" onClick={() => navigate(createPageUrl('BidDetail') + `?id=${createdBidId}`)}>
                  Open Bid Detail
                </Button>
              )}
              {createdProjectId && (
                <Button onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${createdProjectId}`)}>
                  Open Created Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
