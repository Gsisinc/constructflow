import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Upload, Loader2, CheckCircle, Trash2, ChevronDown, ChevronUp,
  Sparkles, FileText, AlertTriangle, Calendar, DollarSign, MapPin,
  Building2, ClipboardList, ArrowRight, Info, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { buildBidAnalysisPrompt, normalizeBidAnalysis } from '@/lib/bidAnalysis';
import { convertBidToProjectFromAI } from '@/lib/bidConversion';
import { toast } from 'sonner';

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

const EMPTY_FORM = {
  project_name: '',
  agency: '',
  description: '',
  estimated_value: 0,
  due_date: '',
  project_type: 'commercial',
  location: '',
  win_probability: 50
};

// ─── AI Extraction Preview Panel ─────────────────────────────────────────────
function AiExtractionPreview({ extracted, onApply, onDiscard }) {
  if (!extracted) return null;
  return (
    <Card className="border-amber-300 bg-amber-50 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-900 text-base">AI Extracted — Review Before Saving</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onDiscard} className="text-slate-600">
              Discard
            </Button>
            <Button size="sm" onClick={onApply} className="bg-amber-600 hover:bg-amber-700 text-white gap-1">
              <CheckCircle className="h-4 w-4" /> Apply to Form
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {extracted.project_name && (
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Project Name</p>
                <p className="text-slate-900 font-semibold">{extracted.project_name}</p>
              </div>
            </div>
          )}
          {extracted.agency && (
            <div className="flex items-start gap-2">
              <ClipboardList className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Agency / Client</p>
                <p className="text-slate-900 font-semibold">{extracted.agency}</p>
              </div>
            </div>
          )}
          {extracted.estimated_value > 0 && (
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Estimated Value</p>
                <p className="text-slate-900 font-semibold">${Number(extracted.estimated_value).toLocaleString()}</p>
              </div>
            </div>
          )}
          {extracted.due_date && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Due Date</p>
                <p className="text-slate-900 font-semibold">{extracted.due_date}</p>
              </div>
            </div>
          )}
          {extracted.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Location</p>
                <p className="text-slate-900 font-semibold">{extracted.location}</p>
              </div>
            </div>
          )}
        </div>
        {extracted.description && (
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Scope Summary</p>
            <p className="text-slate-700 bg-white border border-amber-200 rounded p-2 text-xs leading-relaxed line-clamp-4">
              {extracted.description}
            </p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white border border-amber-200 rounded p-2">
            <p className="text-lg font-bold text-amber-700">{extracted.requirementsCount || 0}</p>
            <p className="text-xs text-slate-500">Requirements</p>
          </div>
          <div className="bg-white border border-amber-200 rounded p-2">
            <p className="text-lg font-bold text-blue-700">{extracted.phasesCount || 0}</p>
            <p className="text-xs text-slate-500">Phases</p>
          </div>
          <div className="bg-white border border-amber-200 rounded p-2">
            <p className="text-lg font-bold text-red-700">{extracted.risksCount || 0}</p>
            <p className="text-xs text-slate-500">Risks</p>
          </div>
        </div>
        {extracted.risks && extracted.risks.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Top Risks Identified</p>
            <ul className="space-y-1">
              {extracted.risks.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                  <span>{r.risk || r}</span>
                  {r.severity && <Badge className="text-xs ml-1 py-0 px-1 h-4">{r.severity}</Badge>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Phase Editor ─────────────────────────────────────────────────────────────
function PhaseEditor({ phases, setPhases }) {
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [newRequirement, setNewRequirement] = useState({});

  const handleAddPhase = () => {
    setPhases((prev) => [...prev, { name: 'New Phase', duration_days: 7, description: '', requirements: [] }]);
  };
  const handleDeletePhase = (idx) => setPhases((prev) => prev.filter((_, i) => i !== idx));
  const handleAddRequirement = (phaseIdx) => {
    const newReq = newRequirement[phaseIdx] || '';
    if (newReq.trim()) {
      const updated = [...phases];
      updated[phaseIdx].requirements.push(newReq.trim());
      setPhases(updated);
      setNewRequirement({ ...newRequirement, [phaseIdx]: '' });
    }
  };
  const handleDeleteRequirement = (phaseIdx, reqIdx) => {
    const updated = [...phases];
    updated[phaseIdx].requirements = updated[phaseIdx].requirements.filter((_, i) => i !== reqIdx);
    setPhases(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-600" />
            Project Phases &amp; Requirements
          </CardTitle>
          <Button size="sm" onClick={handleAddPhase} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-1" /> Add Phase
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {phases.map((phase, phaseIdx) => (
          <div key={phaseIdx} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedPhase(expandedPhase === phaseIdx ? -1 : phaseIdx)}
              className="w-full p-3 flex justify-between items-center hover:bg-slate-50 transition-colors"
            >
              <div className="text-left flex-1">
                <p className="font-semibold text-slate-900">{phase.name}</p>
                <p className="text-sm text-slate-500">{phase.duration_days} days &middot; {phase.requirements.length} requirements</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); handleDeletePhase(phaseIdx); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {expandedPhase === phaseIdx
                  ? <ChevronUp className="h-5 w-5 text-slate-400" />
                  : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </div>
            </button>
            {expandedPhase === phaseIdx && (
              <div className="p-4 border-t bg-slate-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Phase Name</label>
                    <Input
                      value={phase.name}
                      onChange={(e) => {
                        const updated = [...phases];
                        updated[phaseIdx].name = e.target.value;
                        setPhases(updated);
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Duration (days)</label>
                    <Input
                      type="number"
                      value={phase.duration_days}
                      onChange={(e) => {
                        const updated = [...phases];
                        updated[phaseIdx].duration_days = parseInt(e.target.value) || 1;
                        setPhases(updated);
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
                  <Input
                    value={phase.description}
                    onChange={(e) => {
                      const updated = [...phases];
                      updated[phaseIdx].description = e.target.value;
                      setPhases(updated);
                    }}
                    placeholder="Brief phase description"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Requirements</label>
                  <div className="space-y-1.5 mb-2">
                    {phase.requirements.map((req, reqIdx) => (
                      <div key={reqIdx} className="flex items-center gap-2 bg-white border rounded px-2 py-1">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span className="text-sm flex-1 text-slate-700">{req}</span>
                        <button
                          onClick={() => handleDeleteRequirement(phaseIdx, reqIdx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newRequirement[phaseIdx] || ''}
                      onChange={(e) => setNewRequirement({ ...newRequirement, [phaseIdx]: e.target.value })}
                      placeholder="Add requirement..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRequirement(phaseIdx)}
                    />
                    <Button size="sm" onClick={() => handleAddRequirement(phaseIdx)} className="h-8 bg-amber-600 hover:bg-amber-700">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {phases.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            No phases yet. Click &quot;Add Phase&quot; or upload a document to auto-generate.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ uploadedFiles, setUploadedFiles, uploading, onUpload }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onUpload(files);
  };
  return (
    <div className="space-y-4">
      <label
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="cursor-pointer block"
      >
        <div className="border-2 border-dashed border-amber-300 rounded-xl p-10 hover:border-amber-500 hover:bg-amber-50 transition-all text-center">
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="h-12 w-12 mx-auto text-amber-600 animate-spin" />
              <p className="text-slate-600 font-medium">Uploading &amp; analyzing document&hellip;</p>
              <p className="text-xs text-slate-400">AI is reading your bid document and extracting all information</p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-amber-500 mb-3" />
              <p className="text-lg font-semibold text-slate-800">Drop your bid document here</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse</p>
              <p className="text-xs text-slate-400 mt-3">PDF, Word (.docx), Excel (.xlsx) &middot; Multiple files supported</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-amber-700 bg-amber-100 rounded-lg px-4 py-2 w-fit mx-auto">
                <Sparkles className="h-3.5 w-3.5" />
                AI will auto-fill all bid fields from the document
              </div>
            </>
          )}
          <input
            type="file"
            multiple
            onChange={(e) => onUpload(Array.from(e.target.files || []))}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt"
          />
        </div>
      </label>
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Uploaded Files ({uploadedFiles.length})</p>
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-slate-700">{file.name}</span>
                <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 h-7 px-2"
                onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analysis Result Card ─────────────────────────────────────────────────────
function AnalysisResultCard({ analysisResult, createdBidId, createdProjectId, navigate }) {
  if (!analysisResult) return null;
  return (
    <Card className="border-green-200 bg-green-50 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <CardTitle className="text-green-900">Bid Created &amp; Analysis Complete</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-700 bg-white border border-green-200 rounded p-3">{analysisResult.summary}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-700">${Number(analysisResult.estimatedBudget || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">Estimated Budget</p>
          </div>
          <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-700">{analysisResult.timeline || 'N/A'}</p>
            <p className="text-xs text-slate-500 mt-0.5">Timeline (days)</p>
          </div>
          <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{analysisResult.bidRequirementsCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Bid Requirements</p>
          </div>
          <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-purple-700">{analysisResult.projectRequirementsCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Project Requirements</p>
          </div>
        </div>
        {analysisResult.deadlines && analysisResult.deadlines.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Detected Deadlines</p>
            <ul className="space-y-1">
              {analysisResult.deadlines.map((d, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">{d.name || 'Deadline'}</span>
                  <span className="text-slate-500">&mdash; {d.date || 'Unknown date'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysisResult.phases && analysisResult.phases.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Project Phases</p>
            <div className="flex flex-wrap gap-1.5">
              {analysisResult.phases.map((p, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
              ))}
            </div>
          </div>
        )}
        {analysisResult.risks && analysisResult.risks.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Top Risks</p>
            <ul className="space-y-1">
              {analysisResult.risks.slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                  <span>{r.risk || 'Risk identified'}</span>
                  {r.severity && <Badge className="text-xs ml-1 py-0 px-1 h-4">{r.severity}</Badge>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          {createdBidId && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(createPageUrl('BidDetail') + `?id=${createdBidId}`)}
            >
              <FileText className="h-4 w-4" />
              Open Bid Detail
            </Button>
          )}
          {createdProjectId && (
            <Button
              className="bg-amber-600 hover:bg-amber-700 gap-2"
              onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${createdProjectId}`)}
            >
              <ArrowRight className="h-4 w-4" />
              Open Created Project
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddBid() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiExtracted, setAiExtracted] = useState(null);
  const [aiExtractedRaw, setAiExtractedRaw] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [createdBidId, setCreatedBidId] = useState(null);
  const [createdProjectId, setCreatedProjectId] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  // ── Upload & AI Pre-fill ──────────────────────────────────────────────────
  const handleFileUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setAiExtracted(null);
    setAiExtractedRaw(null);
    try {
      const uploadedList = [];
      for (const file of files) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          uploadedList.push({ name: file.name, url: file_url, type: file.type, size: file.size });
        } catch (err) {
          toast.error(`Failed to upload ${file.name}: ${err.message}`);
        }
      }
      if (!uploadedList.length) return;
      setUploadedFiles((prev) => [...prev, ...uploadedList]);

      toast.info('AI is analyzing your document\u2026');

      const quickPrompt = `You are a construction bid analyst. Analyze this bid/RFP/ITB document thoroughly and extract ALL of the following information. Be precise and comprehensive.

Extract:
1. project_name: The official project or solicitation title
2. agency: The issuing agency, client, or organization name  
3. location: Project location (city, state, address)
4. estimated_value: Estimated contract value in USD (number only, no symbols). If a range is given, use the midpoint.
5. due_date: Bid submission deadline in YYYY-MM-DD format
6. description: A comprehensive scope of work summary (3-5 sentences covering what work is required)
7. project_type: One of: commercial, residential, industrial, government, infrastructure
8. summary: One-paragraph executive summary of the entire bid opportunity
9. bid_requirements: Array of ALL bid submission requirements (bonding, insurance, licenses, forms to submit, etc.) [{text, category (legal/financial/technical/compliance/other), priority (high/medium/low)}]
10. project_requirements: Array of ALL technical/project execution requirements [{text, category, priority}]
11. phases: Array of project phases based on the scope [{name, duration_days, description, requirements[]}]
12. deadlines: Array of all key dates and deadlines [{name, date (YYYY-MM-DD), source}]
13. risks: Array of risk factors and concerns [{risk, severity (high/medium/low), mitigation}]
14. confidence_notes: Any assumptions or notes about data quality or missing information
15. project_overview: {scope_summary, timeline_days, estimated_budget}

Return ONLY valid JSON. No markdown, no code fences, no explanation.`;

      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: quickPrompt,
        file_urls: uploadedList.map((f) => f.url),
        response_json_schema: {
          type: 'object',
          properties: {
            project_name: { type: 'string' },
            agency: { type: 'string' },
            location: { type: 'string' },
            estimated_value: { type: 'number' },
            due_date: { type: 'string' },
            description: { type: 'string' },
            project_type: { type: 'string' },
            summary: { type: 'string' },
            bid_requirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  category: { type: 'string' },
                  priority: { type: 'string' }
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
                  priority: { type: 'string' }
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
            confidence_notes: { type: 'array', items: { type: 'string' } },
            project_overview: {
              type: 'object',
              properties: {
                scope_summary: { type: 'string' },
                timeline_days: { type: 'number' },
                estimated_budget: { type: 'number' }
              }
            }
          }
        }
      });

      // Normalize the response
      let parsed = llmResponse;
      if (typeof llmResponse === 'string') {
        try { parsed = JSON.parse(llmResponse); } catch { parsed = {}; }
      } else if (llmResponse && typeof llmResponse === 'object') {
        if (llmResponse.output) {
          parsed = typeof llmResponse.output === 'string'
            ? JSON.parse(llmResponse.output)
            : llmResponse.output;
        } else if (llmResponse.result) {
          parsed = typeof llmResponse.result === 'string'
            ? JSON.parse(llmResponse.result)
            : llmResponse.result;
        }
      }

      const normalized = normalizeBidAnalysis(parsed, {});

      const preview = {
        project_name: parsed.project_name || '',
        agency: parsed.agency || '',
        location: parsed.location || '',
        estimated_value: Number(parsed.estimated_value) || normalized.estimatedBudget || 0,
        due_date: parsed.due_date || normalized.deadlines?.[0]?.date || '',
        description: parsed.description || normalized.scopeSummary || '',
        project_type: parsed.project_type || 'commercial',
        requirementsCount: (normalized.bidRequirements?.length || 0) + (normalized.projectRequirements?.length || 0),
        phasesCount: normalized.phases?.length || 0,
        risksCount: normalized.risks?.length || 0,
        risks: normalized.risks || []
      };

      setAiExtracted(preview);
      setAiExtractedRaw({ parsed, normalized, uploadedList });
      toast.success('AI extraction complete! Review and apply to form.');
    } catch (err) {
      console.error('Upload/AI error:', err);
      toast.error('AI analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // ── Apply AI extraction to form ───────────────────────────────────────────
  const handleApplyExtraction = () => {
    if (!aiExtracted) return;
    setFormData({
      project_name: aiExtracted.project_name || formData.project_name,
      agency: aiExtracted.agency || formData.agency,
      location: aiExtracted.location || formData.location,
      estimated_value: aiExtracted.estimated_value || formData.estimated_value,
      due_date: aiExtracted.due_date || formData.due_date,
      description: aiExtracted.description || formData.description,
      project_type: aiExtracted.project_type || formData.project_type,
      win_probability: formData.win_probability
    });
    if (aiExtractedRaw?.normalized?.phases?.length > 0) {
      setPhases(aiExtractedRaw.normalized.phases);
    }
    setAiExtracted(null);
    setActiveTab('manual');
    toast.success('Form filled from AI extraction. Review and submit!');
  };

  // ── Full Analyze & Create Workflow ────────────────────────────────────────
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setAnalyzing(true);

      let normalized = aiExtractedRaw?.normalized;

      if (!normalized && uploadedFiles.length > 0) {
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
                items: { type: 'object', properties: { name: { type: 'string' }, date: { type: 'string' }, source: { type: 'string' } } }
              },
              bid_requirements: {
                type: 'array',
                items: { type: 'object', properties: { text: { type: 'string' }, category: { type: 'string' }, priority: { type: 'string' }, source: { type: 'string' } } }
              },
              project_requirements: {
                type: 'array',
                items: { type: 'object', properties: { text: { type: 'string' }, category: { type: 'string' }, priority: { type: 'string' }, source: { type: 'string' } } }
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
                items: { type: 'object', properties: { risk: { type: 'string' }, severity: { type: 'string' }, mitigation: { type: 'string' } } }
              },
              confidence_notes: { type: 'array', items: { type: 'string' } }
            }
          }
        });
        normalized = normalizeBidAnalysis(llmResponse, { ...formData, phases });
      } else if (!normalized) {
        normalized = normalizeBidAnalysis({}, { ...formData, phases });
      }

      const finalFormData = {
        ...formData,
        estimated_value: formData.estimated_value || normalized.estimatedBudget || 0,
        due_date: formData.due_date || normalized.deadlines?.[0]?.date || null,
        description: formData.description || normalized.scopeSummary || ''
      };

      const bid = await base44.entities.BidOpportunity.create({
        organization_id: null,
        title: finalFormData.project_name,
        project_name: finalFormData.project_name,
        agency: finalFormData.agency,
        client_name: finalFormData.agency,
        description: finalFormData.description,
        scope_of_work: finalFormData.description,
        estimated_value: Number(finalFormData.estimated_value || 0),
        due_date: finalFormData.due_date || null,
        project_type: finalFormData.project_type,
        location: finalFormData.location,
        win_probability: Number(finalFormData.win_probability || 50),
        status: uploadedFiles.length > 0 ? 'estimating' : 'new',
        source: 'manual_entry'
      });
      setCreatedBidId(bid.id);

      if (uploadedFiles.length > 0) {
        await Promise.all(uploadedFiles.map((file) =>
          base44.entities.BidDocument.create({
            bid_opportunity_id: bid.id,
            organization_id: bid.organization_id,
            name: file.name,
            file_url: file.url,
            file_type: file.type,
            file_size: file.size,
            ai_processed: true
          })
        ));
      }

      const combinedRequirements = [
        ...(normalized.bidRequirements || []),
        ...(normalized.projectRequirements || [])
      ];
      if (combinedRequirements.length > 0) {
        await Promise.all(combinedRequirements.map((req) =>
          base44.entities.BidRequirement.create({
            bid_opportunity_id: bid.id,
            organization_id: bid.organization_id,
            requirement_text: req.text,
            category: req.category || 'other',
            priority: req.priority || 'medium',
            status: 'pending',
            ai_extracted: uploadedFiles.length > 0
          })
        ));
      }

      await base44.entities.BidOpportunity.update(bid.id, {
        ai_analysis: {
          complexity_score: Math.min(10, Math.max(1, Math.round(((normalized.risks?.length || 1) * 1.5)))),
          risk_factors: (normalized.risks || []).map((r) => r.risk || '').filter(Boolean),
          recommended_markup: (normalized.risks?.length || 0) > 4 ? 20 : 15,
          key_points: [normalized.summary, ...(normalized.confidenceNotes || [])].filter(Boolean),
          requirements_count: combinedRequirements.length,
          deadlines: normalized.deadlines || [],
          project_requirements: normalized.projectRequirements || [],
          phases: normalized.phases || phases,
          analyzed_at: new Date().toISOString()
        }
      });

      const requirements = await base44.entities.BidRequirement.filter({ bid_opportunity_id: bid.id });
      const project = await convertBidToProjectFromAI({
        base44Client: base44,
        bid: {
          ...bid,
          due_date: finalFormData.due_date || normalized.deadlines?.[0]?.date || null,
          estimated_value: normalized.estimatedBudget || finalFormData.estimated_value,
          description: normalized.scopeSummary || finalFormData.description,
          ai_analysis: {
            complexity_score: Math.min(10, Math.max(1, Math.round(((normalized.risks?.length || 1) * 1.5)))),
            risk_factors: (normalized.risks || []).map((r) => r.risk || '').filter(Boolean),
            recommended_markup: (normalized.risks?.length || 0) > 4 ? 20 : 15,
            key_points: [normalized.summary].filter(Boolean),
            requirements_count: combinedRequirements.length
          }
        },
        organizationId: bid.organization_id,
        requirements
      });
      setCreatedProjectId(project.id);

      setAnalysisResult({
        summary: normalized.summary || 'Bid created successfully.',
        estimatedBudget: normalized.estimatedBudget || finalFormData.estimated_value,
        timeline: normalized.timelineDays,
        phases: (normalized.phases || phases).map((p) => p.name),
        bidRequirementsCount: normalized.bidRequirements?.length || 0,
        projectRequirementsCount: normalized.projectRequirements?.length || 0,
        deadlines: normalized.deadlines || [],
        risks: normalized.risks || []
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['bidOpportunities'] });
      return { bidId: bid.id, projectId: project.id };
    },
    onError: (error) => {
      console.error('Bid creation failed', error);
      toast.error(`Failed: ${error.message || 'Unknown error'}`);
    },
    onSettled: () => setAnalyzing(false)
  });

  const canSubmit = useMemo(() => formData.project_name.trim().length > 0, [formData.project_name]);

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Please enter a project name (switch to Manual Entry tab to fill it in)');
      return;
    }
    analyzeMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Bid</h1>
          <p className="text-slate-500 mt-1">Create a bid manually or upload a document for AI-powered auto-fill</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('Bids'))}
          className="text-slate-600 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bids
        </Button>
      </div>

      {/* Mode Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="upload" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Upload &amp; AI Fill
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <FileText className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        {/* ── Upload Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="upload" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                AI-Powered Bid Document Analysis
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Upload your RFP, ITB, or bid document. The AI agent will read it and automatically extract
                the project name, agency, scope, estimated value, due date, requirements, phases, and risks.
              </p>
            </CardHeader>
            <CardContent>
              <UploadZone
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                uploading={uploading}
                onUpload={handleFileUpload}
              />
            </CardContent>
          </Card>

          {/* AI Extraction Preview */}
          {aiExtracted && (
            <AiExtractionPreview
              extracted={aiExtracted}
              onApply={handleApplyExtraction}
              onDiscard={() => { setAiExtracted(null); setAiExtractedRaw(null); }}
            />
          )}

          {/* Info banner */}
          {!uploadedFiles.length && !aiExtracted && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">How it works</p>
                <p className="text-blue-700 mt-0.5">
                  Upload any bid document (PDF, Word, Excel). The AI agent reads the full document,
                  extracts all key information, and pre-fills the form. You can review and edit before saving.
                  The AI also generates project phases, a requirements checklist, and risk assessment automatically.
                </p>
              </div>
            </div>
          )}

          {/* After upload, prompt to review */}
          {uploadedFiles.length > 0 && !aiExtracted && !uploading && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border rounded-lg p-3">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <span>
                {uploadedFiles.length} file(s) uploaded. Switch to the &ldquo;Manual Entry&rdquo; tab to review extracted fields, then click Submit.
              </span>
            </div>
          )}
        </TabsContent>

        {/* ── Manual Entry Tab ────────────────────────────────────────────── */}
        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-600" />
                Bid Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Project Name *</label>
                <Input
                  placeholder="e.g. Downtown Library Renovation"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Agency / Client</label>
                  <Input
                    placeholder="e.g. City of Austin"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Project Type</label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    className="w-full border rounded-md p-2 text-sm bg-white"
                  >
                    {['commercial', 'residential', 'industrial', 'government', 'infrastructure'].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Project Description / Scope of Work</label>
                <Textarea
                  placeholder="Describe the scope of work, project goals, and key deliverables..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-24"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Estimated Value ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.estimated_value || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value || '0') })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Bid Due Date</label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Location</label>
                  <Input
                    placeholder="City, State"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Win Probability (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.win_probability}
                    onChange={(e) => setFormData({ ...formData, win_probability: parseInt(e.target.value) || 50 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Documents in manual mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-amber-600" />
                Supporting Documents (Optional)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Attach bid documents to enhance AI analysis</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <UploadZone
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                uploading={uploading}
                onUpload={handleFileUpload}
              />
              {aiExtracted && (
                <AiExtractionPreview
                  extracted={aiExtracted}
                  onApply={handleApplyExtraction}
                  onDiscard={() => { setAiExtracted(null); setAiExtractedRaw(null); }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Phase Editor — always visible */}
      <PhaseEditor phases={phases} setPhases={setPhases} />

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={analyzing || !canSubmit}
        className="w-full bg-amber-600 hover:bg-amber-700 h-14 text-base font-semibold gap-3"
      >
        {analyzing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {uploadedFiles.length > 0
              ? 'Analyzing documents, generating requirements & creating project\u2026'
              : 'Creating bid & project\u2026'}
          </>
        ) : uploadedFiles.length > 0 ? (
          <>
            <Sparkles className="h-5 w-5" />
            Analyze Documents &amp; Create Bid
          </>
        ) : (
          <>
            <Plus className="h-5 w-5" />
            Create Bid
          </>
        )}
      </Button>

      {/* Analysis Result */}
      <AnalysisResultCard
        analysisResult={analysisResult}
        createdBidId={createdBidId}
        createdProjectId={createdProjectId}
        navigate={navigate}
      />
    </div>
  );
}
