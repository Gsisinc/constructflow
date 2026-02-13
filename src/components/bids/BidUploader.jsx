import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loadPolicy, requirePermission } from '@/lib/permissions';
import { parseLlmJsonResponse } from '@/lib/llmResponse';

function mergeUnique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeAnalysisPayload(payload = {}) {
  const data = parseLlmJsonResponse(payload);
  return {
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    deadlines: Array.isArray(data.deadlines) ? data.deadlines : [],
    key_points: Array.isArray(data.key_points) ? data.key_points : [],
    risk_factors: Array.isArray(data.risk_factors) ? data.risk_factors : [],
    complexity_score: Number(data.complexity_score || 0),
    recommended_markup: Number(data.recommended_markup || 0)
  };
}

export default function BidUploader({ bidId, organizationId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser', 'bidUploader'], queryFn: () => base44.auth.me() });
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

    try {
      requirePermission({
        policy,
        role: user?.role || 'viewer',
        module: 'documents',
        action: 'create',
        message: 'You do not have permission to upload bid documents.'
      });

      const aggregate = {
        requirements: [],
        deadlines: [],
        key_points: [],
        risk_factors: [],
        complexityScores: [],
        markups: []
      };

      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

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
            prompt: `Analyze this bid/RFP document thoroughly and extract:

1. Technical requirements (list each one)
2. Compliance requirements
3. Deadlines and key dates
4. Deliverables
5. Risk factors or red flags
6. Complexity score (1-10)
7. Recommended markup percentage (10-25)
8. Key points and important notes

Return JSON only.`,
            file_urls: [file_url],
            response_json_schema: {
              type: 'object',
              properties: {
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
                deadlines: { type: 'array', items: { type: 'string' } },
                key_points: { type: 'array', items: { type: 'string' } },
                risk_factors: { type: 'array', items: { type: 'string' } },
                complexity_score: { type: 'number' },
                recommended_markup: { type: 'number' }
              }
            }
          });

          const aiResult = normalizeAnalysisPayload(aiRaw);

          await base44.entities.BidDocument.update(doc.id, {
            ai_processed: true,
            extracted_data: {
              requirements: aiResult.requirements.map((r) => r.text).filter(Boolean),
              deadlines: aiResult.deadlines,
              key_points: aiResult.key_points,
              risk_factors: aiResult.risk_factors
            }
          });

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

          aggregate.requirements.push(...aiResult.requirements.map((r) => r.text).filter(Boolean));
          aggregate.deadlines.push(...aiResult.deadlines);
          aggregate.key_points.push(...aiResult.key_points);
          aggregate.risk_factors.push(...aiResult.risk_factors);
          if (aiResult.complexity_score > 0) aggregate.complexityScores.push(aiResult.complexity_score);
          if (aiResult.recommended_markup > 0) aggregate.markups.push(aiResult.recommended_markup);
        } catch (err) {
          console.error('AI processing error for file:', file.name, err);
          toast.error(`AI analysis failed for ${file.name}`);
        }
      }

      const existingBidRows = await base44.entities.BidOpportunity.filter({ id: bidId });
      const existing = existingBidRows?.[0]?.ai_analysis || {};

      const avgComplexity = aggregate.complexityScores.length
        ? Math.round(aggregate.complexityScores.reduce((a, b) => a + b, 0) / aggregate.complexityScores.length)
        : existing.complexity_score || 0;

      const avgMarkup = aggregate.markups.length
        ? Math.round(aggregate.markups.reduce((a, b) => a + b, 0) / aggregate.markups.length)
        : existing.recommended_markup || 0;

      await base44.entities.BidOpportunity.update(bidId, {
        ai_analysis: {
          ...existing,
          complexity_score: avgComplexity,
          risk_factors: mergeUnique([...(existing.risk_factors || []), ...aggregate.risk_factors]),
          recommended_markup: avgMarkup,
          key_points: mergeUnique([...(existing.key_points || []), ...aggregate.key_points]),
          deadlines: mergeUnique([...(existing.deadlines || []), ...aggregate.deadlines]),
          extracted_requirements: mergeUnique([...(existing.extracted_requirements || []), ...aggregate.requirements]),
          requirements_count: mergeUnique([...(existing.extracted_requirements || []), ...aggregate.requirements]).length,
          analyzed_at: new Date().toISOString()
        }
      });

      toast.success(`Processed ${files.length} document${files.length > 1 ? 's' : ''}.`);
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
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          {uploading || processing ? (
            <div className="space-y-3">
              <Loader2 className="h-12 w-12 mx-auto text-amber-600 animate-spin" />
              <p className="text-sm text-slate-600">
                {uploading ? 'Uploading document(s)...' : 'AI analyzing document(s)...'}
              </p>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                multiple
                onChange={handleFileUpload}
              />
              <div className="border-2 border-dashed border-amber-300 rounded-lg p-8 hover:border-amber-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-amber-600 mb-3" />
                <p className="text-lg font-semibold text-slate-900 mb-1">Upload Bid Document(s)</p>
                <p className="text-sm text-slate-500">PDF, Word, or Excel • AI extracts requirements and updates analysis</p>
              </div>
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
