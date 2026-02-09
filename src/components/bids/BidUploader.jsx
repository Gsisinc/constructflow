import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BidUploader({ bidId, organizationId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Create document record
      const doc = await base44.entities.BidDocument.create({
        bid_opportunity_id: bidId,
        organization_id: organizationId,
        name: file.name,
        file_url,
        file_type: file.type,
        file_size: file.size
      });

      toast.success('File uploaded');
      setUploading(false);
      setProcessing(true);

      // AI processing
      try {
        const aiResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this bid/RFP document and extract:
1. All technical requirements
2. Compliance requirements  
3. Deadlines and key dates
4. Deliverables
5. Evaluation criteria
6. Any risk factors or red flags

Provide structured output.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              requirements: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    category: { type: "string" },
                    priority: { type: "string" }
                  }
                }
              },
              deadlines: { type: "array", items: { type: "string" } },
              key_points: { type: "array", items: { type: "string" } },
              risk_factors: { type: "array", items: { type: "string" } }
            }
          }
        });

        // Update document with extracted data
        await base44.entities.BidDocument.update(doc.id, {
          ai_processed: true,
          extracted_data: aiResult
        });

        // Create requirement records
        if (aiResult.requirements?.length > 0) {
          const reqPromises = aiResult.requirements.map(req =>
            base44.entities.BidRequirement.create({
              bid_opportunity_id: bidId,
              organization_id: organizationId,
              requirement_text: req.text,
              category: req.category?.toLowerCase() || 'other',
              priority: req.priority?.toLowerCase() || 'medium',
              ai_extracted: true
            })
          );
          await Promise.all(reqPromises);
        }

        toast.success('AI analysis complete');
        onUploadComplete?.();
      } catch (err) {
        console.error('AI processing failed:', err);
        toast.error('AI analysis failed, but file uploaded');
      }
      
      setProcessing(false);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed');
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
                {uploading ? 'Uploading document...' : 'AI analyzing document...'}
              </p>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                onChange={handleFileUpload}
              />
              <div className="border-2 border-dashed border-amber-300 rounded-lg p-8 hover:border-amber-500 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-amber-600 mb-3" />
                <p className="text-lg font-semibold text-slate-900 mb-1">
                  Upload Bid Document
                </p>
                <p className="text-sm text-slate-500">
                  PDF, Word, or Excel • AI will extract requirements
                </p>
              </div>
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}