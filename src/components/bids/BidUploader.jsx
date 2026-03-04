import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Loader2, CheckCircle, Calendar,
  DollarSign, FileText, Sparkles, ClipboardList, X
} from 'lucide-react';
import { toast } from 'sonner';
import { loadPolicy, requirePermission } from '@/lib/permissions';
import { parseLlmJsonResponse } from '@/lib/llmResponse';

function mergeUnique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeAnalysisPayload(payload = {}) {
  const data = parseLlmJsonResponse(payload);
  return {
    // Core bid fields — new additions
    project_name: data.project_name || data.title || '',
    agency: data.agency || data.client_name || '',
    location: data.location || '',
    estimated_value: Number(data.estimated_value || 0),
    due_date: data.due_date || '',
    description: data.description || data.scope_summary || '',
    summary: data.summary || '',
    // Analysis fields
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    deadlines: Array.isArray(data.deadlines) ? data.deadlines : [],
    key_points: Array.isArray(data.key_points) ? data.key_points : [],
    risk_factors: Array.isArray(data.risk_factors) ? data.risk_factors : [],
    phases: Array.isArray(data.phases) ? data.phases : [],
    complexity_score: Number(data.complexity_score || 0),
    recommended_markup: Number(data.recommended_markup || 0)
  };
}

export default function BidUploader({ bidId, organizationId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser', 'bidUploader'],
    queryFn: () => base44.auth.me()
  });
  const { data: policy } = useQuery({
    queryKey: ['rolePolicy', organizationId, 'bidUploader'],
    queryFn: () => loadPolicy({ organizationId }),
    enabled: !!organizationId
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    setUploading(true);
    setAnalysisResult(null);
    setShowResult(false);

    try {
      requirePermission({
        policy,
        role: user?.role || 'viewer',
        module: 'documents',
        action: 'create',
        message: 'You do not have permission to upload bid documents.'
      });

      const aggregate = {
        project_name: '',
        agency: '',
        location: '',
        estimated_value: 0,
        due_date: '',
        description: '',
        requirements: [],
        deadlines: [],
        key_points: [],
        risk_factors: [],
        phases: [],
        complexityScores: [],
        markups: [],
        summaries: []
      };

      const newFiles = [];

      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newFiles.push({ name: file.name, url: file_url, type: file.type, size: file.size });

        const doc = await base44.entities.BidDocument.create({
          bid_opportunity_id: bidId,
          organization_id: organizationId,
          name: file.name,
          file_url,
          file_type: file.type,
          file_size: file.size,
          ai_processed: false
        });

        setUploading(false);
        setProcessing(true);

        try {
          const aiRaw = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a construction bid analyst. Analyze this bid/RFP/ITB document thoroughly and extract ALL of the following information:

1. project_name: The official project or solicitation title
2. agency: The issuing agency, client, or organization name
3. location: Project location (city, state, address)
4. estimated_value: Estimated contract value in USD (number only, no symbols)
5. due_date: Bid submission deadline in YYYY-MM-DD format
6. description: Comprehensive scope of work summary (3-5 sentences)
7. summary: One-paragraph executive summary of the bid opportunity
8. requirements: Array of ALL bid submission and technical requirements [{text, category (legal/financial/technical/compliance/other), priority (high/medium/low)}]
9. deadlines: Array of all key dates [{name, date (YYYY-MM-DD)}]
10. key_points: Array of important notes and highlights
11. risk_factors: Array of risk factors and concerns
12. phases: Array of project phases [{name, duration_days, description, requirements[]}]
13. complexity_score: Overall complexity score 1-10
14. recommended_markup: Recommended markup percentage 10-25

Return ONLY valid JSON. No markdown, no code fences, no explanation.`,
            file_urls: [file_url],
            response_json_schema: {
              type: 'object',
              properties: {
                project_name: { type: 'string' },
                agency: { type: 'string' },
                location: { type: 'string' },
                estimated_value: { type: 'number' },
                due_date: { type: 'string' },
                description: { type: 'string' },
                summary: { type: 'string' },
                requirements: {
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
                deadlines: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { name: { type: 'string' }, date: { type: 'string' } }
                  }
                },
                key_points: { type: 'array', items: { type: 'string' } },
                risk_factors: { type: 'array', items: { type: 'string' } },
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
                complexity_score: { type: 'number' },
                recommended_markup: { type: 'number' }
              }
            }
          });

          const aiResult = normalizeAnalysisPayload(aiRaw);

          // Update the document record with all extracted data
          await base44.entities.BidDocument.update(doc.id, {
            ai_processed: true,
            extracted_data: {
              project_name: aiResult.project_name,
              agency: aiResult.agency,
              location: aiResult.location,
              estimated_value: aiResult.estimated_value,
              due_date: aiResult.due_date,
              requirements: aiResult.requirements.map((r) => r.text).filter(Boolean),
              deadlines: aiResult.deadlines,
              key_points: aiResult.key_points,
              risk_factors: aiResult.risk_factors,
              phases: aiResult.phases
            }
          });

          // Create BidRequirement records
          if (aiResult.requirements.length > 0) {
            await Promise.all(
              aiResult.requirements
                .filter((req) => req?.text)
                .map((req) =>
                  base44.entities.BidRequirement.create({
                    bid_opportunity_id: bidId,
                    organization_id: organizationId,
                    requirement_text: req.text,
                    category: req.category?.toLowerCase() || 'other',
                    priority: req.priority?.toLowerCase() || 'medium',
                    ai_extracted: true
                  })
                )
            );
          }

          // Aggregate results across multiple files
          if (aiResult.project_name && !aggregate.project_name) aggregate.project_name = aiResult.project_name;
          if (aiResult.agency && !aggregate.agency) aggregate.agency = aiResult.agency;
          if (aiResult.location && !aggregate.location) aggregate.location = aiResult.location;
          if (aiResult.estimated_value > 0 && !aggregate.estimated_value) aggregate.estimated_value = aiResult.estimated_value;
          if (aiResult.due_date && !aggregate.due_date) aggregate.due_date = aiResult.due_date;
          if (aiResult.description && !aggregate.description) aggregate.description = aiResult.description;
          if (aiResult.summary) aggregate.summaries.push(aiResult.summary);
          aggregate.requirements.push(...aiResult.requirements.map((r) => r.text).filter(Boolean));
          aggregate.deadlines.push(
            ...(Array.isArray(aiResult.deadlines)
              ? aiResult.deadlines.map((d) => (typeof d === 'string' ? d : `${d.name || 'Deadline'}: ${d.date || ''}`))
              : [])
          );
          aggregate.key_points.push(...aiResult.key_points);
          aggregate.risk_factors.push(...aiResult.risk_factors);
          aggregate.phases.push(...aiResult.phases);
          if (aiResult.complexity_score > 0) aggregate.complexityScores.push(aiResult.complexity_score);
          if (aiResult.recommended_markup > 0) aggregate.markups.push(aiResult.recommended_markup);
        } catch (err) {
          console.error('AI processing error for file:', file.name, err);
          toast.error(`AI analysis failed for ${file.name}`);
        }
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Fetch existing bid to avoid overwriting good data
      const existingBidRows = await base44.entities.BidOpportunity.filter({ id: bidId });
      const existing = existingBidRows?.[0] || {};
      const existingAi = existing.ai_analysis || {};

      const avgComplexity = aggregate.complexityScores.length
        ? Math.round(aggregate.complexityScores.reduce((a, b) => a + b, 0) / aggregate.complexityScores.length)
        : existingAi.complexity_score || 0;
      const avgMarkup = aggregate.markups.length
        ? Math.round(aggregate.markups.reduce((a, b) => a + b, 0) / aggregate.markups.length)
        : existingAi.recommended_markup || 0;

      // Build update payload — only fill in fields that are currently empty on the bid
      const bidUpdate = {
        ai_analysis: {
          ...existingAi,
          complexity_score: avgComplexity,
          risk_factors: mergeUnique([...(existingAi.risk_factors || []), ...aggregate.risk_factors]),
          recommended_markup: avgMarkup,
          key_points: mergeUnique([...(existingAi.key_points || []), ...aggregate.key_points]),
          deadlines: mergeUnique([...(existingAi.deadlines || []), ...aggregate.deadlines]),
          extracted_requirements: mergeUnique([...(existingAi.extracted_requirements || []), ...aggregate.requirements]),
          requirements_count: mergeUnique([...(existingAi.extracted_requirements || []), ...aggregate.requirements]).length,
          phases: aggregate.phases.length > 0 ? aggregate.phases : (existingAi.phases || []),
          summary: aggregate.summaries[0] || existingAi.summary || '',
          analyzed_at: new Date().toISOString()
        }
      };

      // Auto-fill core bid fields only if they are currently empty
      const fieldsUpdated = [];
      if (aggregate.project_name && !existing.project_name) { bidUpdate.project_name = aggregate.project_name; fieldsUpdated.push('project_name'); }
      if (aggregate.project_name && !existing.title) { bidUpdate.title = aggregate.project_name; fieldsUpdated.push('title'); }
      if (aggregate.agency && !existing.agency) { bidUpdate.agency = aggregate.agency; fieldsUpdated.push('agency'); }
      if (aggregate.agency && !existing.client_name) { bidUpdate.client_name = aggregate.agency; fieldsUpdated.push('client_name'); }
      if (aggregate.location && !existing.location) { bidUpdate.location = aggregate.location; fieldsUpdated.push('location'); }
      if (aggregate.estimated_value > 0 && !existing.estimated_value) { bidUpdate.estimated_value = aggregate.estimated_value; fieldsUpdated.push('estimated_value'); }
      if (aggregate.due_date && !existing.due_date) { bidUpdate.due_date = aggregate.due_date; fieldsUpdated.push('due_date'); }
      if (aggregate.description && !existing.description) { bidUpdate.description = aggregate.description; fieldsUpdated.push('description'); }
      if (aggregate.description && !existing.scope_of_work) { bidUpdate.scope_of_work = aggregate.description; fieldsUpdated.push('scope_of_work'); }

      await base44.entities.BidOpportunity.update(bidId, bidUpdate);

      // Store result for display
      setAnalysisResult({
        requirementsCount: aggregate.requirements.length,
        deadlinesCount: aggregate.deadlines.length,
        riskFactorsCount: aggregate.risk_factors.length,
        phasesCount: aggregate.phases.length,
        complexity: avgComplexity,
        markup: avgMarkup,
        summary: aggregate.summaries[0] || '',
        fieldsUpdated,
        estimatedValue: aggregate.estimated_value,
        dueDate: aggregate.due_date,
        projectName: aggregate.project_name,
        agency: aggregate.agency
      });
      setShowResult(true);

      toast.success(
        `Processed ${files.length} document${files.length > 1 ? 's' : ''}. ` +
        `${aggregate.requirements.length} requirements extracted` +
        (fieldsUpdated.length > 0 ? `, ${fieldsUpdated.length} bid fields auto-filled.` : '.')
      );
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            {uploading || processing ? (
              <div className="space-y-3">
                <Loader2 className="h-12 w-12 mx-auto text-amber-600 animate-spin" />
                <p className="text-sm font-medium text-slate-700">
                  {uploading ? 'Uploading document(s)...' : 'AI analyzing document(s)...'}
                </p>
                <p className="text-xs text-slate-400">
                  {processing
                    ? 'Extracting requirements, deadlines, phases, and auto-filling bid fields...'
                    : 'Please wait while files are uploaded securely...'}
                </p>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
                  multiple
                  onChange={handleFileUpload}
                />
                <div className="border-2 border-dashed border-amber-300 rounded-xl p-8 hover:border-amber-500 hover:bg-amber-50 transition-all">
                  <Upload className="h-12 w-12 mx-auto text-amber-600 mb-3" />
                  <p className="text-lg font-semibold text-slate-900 mb-1">Upload Bid Document(s)</p>
                  <p className="text-sm text-slate-500 mb-3">PDF, Word, Excel, or Images</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-100 rounded-lg px-4 py-2 w-fit mx-auto">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI extracts requirements, phases, deadlines &amp; auto-fills bid fields
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && !uploading && !processing && (
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Uploaded Files</p>
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2.5 py-1.5 border">
                  <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Result Preview */}
      {showResult && analysisResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-900 text-base">AI Analysis Complete</CardTitle>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-slate-400"
                onClick={() => setShowResult(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {analysisResult.summary && (
              <p className="text-xs text-slate-700 bg-white border border-green-200 rounded p-2 leading-relaxed">
                {analysisResult.summary}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white border border-green-200 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-700">{analysisResult.requirementsCount}</p>
                <p className="text-xs text-slate-500">Requirements</p>
              </div>
              <div className="bg-white border border-green-200 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-700">{analysisResult.phasesCount}</p>
                <p className="text-xs text-slate-500">Phases</p>
              </div>
              <div className="bg-white border border-green-200 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-orange-700">{analysisResult.riskFactorsCount}</p>
                <p className="text-xs text-slate-500">Risks</p>
              </div>
              <div className="bg-white border border-green-200 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-purple-700">{analysisResult.complexity}/10</p>
                <p className="text-xs text-slate-500">Complexity</p>
              </div>
            </div>
            {analysisResult.fieldsUpdated.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Bid Fields Auto-Filled
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.fieldsUpdated.map((field) => (
                    <Badge key={field} className="text-xs bg-green-100 text-green-800 border-green-200">
                      {field.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {(analysisResult.estimatedValue > 0 || analysisResult.dueDate) && (
              <div className="flex flex-wrap gap-3 text-xs text-slate-700">
                {analysisResult.estimatedValue > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-green-600" />
                    <span className="font-medium">${Number(analysisResult.estimatedValue).toLocaleString()}</span>
                  </div>
                )}
                {analysisResult.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-medium">{analysisResult.dueDate}</span>
                  </div>
                )}
                {analysisResult.markup > 0 && (
                  <div className="flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5 text-purple-600" />
                    <span className="font-medium">{analysisResult.markup}% markup recommended</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500 italic">
              Refresh the page to see all updated bid fields and requirements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
