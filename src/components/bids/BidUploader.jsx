import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loadPolicy, requirePermission } from '@/lib/permissions';

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
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input to allow re-uploading same file
    e.target.value = '';

    setUploading(true);
    console.log('Starting file upload:', file.name);
    
    try {
      requirePermission({ policy, role: user?.role || 'viewer', module: 'documents', action: 'create', message: 'You do not have permission to upload bid documents.' });
      // Upload file
      console.log('Uploading file to Core.UploadFile...');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      console.log('File uploaded successfully:', file_url);
      
      // Create document record
      console.log('Creating BidDocument record...');
      const doc = await base44.entities.BidDocument.create({
        bid_opportunity_id: bidId,
        organization_id: organizationId,
        name: file.name,
        file_url,
        file_type: file.type,
        file_size: file.size
      });
      console.log('BidDocument created:', doc.id);

      setUploading(false);
      setProcessing(true);
      toast.info('🤖 AI analyzing document...');

      // AI processing - with better error handling
      try {
      requirePermission({ policy, role: user?.role || 'viewer', module: 'documents', action: 'create', message: 'You do not have permission to upload bid documents.' });
        console.log('Starting AI analysis with file:', file_url);
        const aiResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this bid/RFP document thoroughly and extract:

1. Technical requirements (list each one)
2. Compliance requirements  
3. Deadlines and key dates
4. Deliverables
5. Risk factors or red flags (cost overruns, tight deadlines, unclear specs, etc.)
6. Complexity score (1-10, where 10 is most complex)
7. Recommended markup percentage (10-25% based on risk and complexity)
8. Key points and important notes

Be thorough and extract as much useful information as possible.`,
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
              risk_factors: { type: "array", items: { type: "string" } },
              complexity_score: { type: "number" },
              recommended_markup: { type: "number" }
            }
          }
        });
        console.log('AI analysis complete:', aiResult);
        toast.success('✅ AI extracted ' + (aiResult.requirements?.length || 0) + ' requirements');

        // Update document with extracted data - flatten requirements to strings
        console.log('Updating document with AI results...');
        await base44.entities.BidDocument.update(doc.id, {
          ai_processed: true,
          extracted_data: {
            requirements: aiResult.requirements?.map(r => r.text) || [],
            deadlines: aiResult.deadlines || [],
            key_points: aiResult.key_points || []
          }
        });

        // Create requirement records
        if (aiResult.requirements?.length > 0) {
          console.log(`Creating ${aiResult.requirements.length} requirements...`);
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
          console.log('Requirements created successfully');
        }

        // Update bid opportunity with AI analysis
        console.log('Updating bid opportunity with AI analysis...');
        const bids = await base44.entities.BidOpportunity.filter({ id: bidId });
        if (bids.length > 0) {
          const currentBid = bids[0];
          await base44.entities.BidOpportunity.update(bidId, {
            ai_analysis: {
              complexity_score: aiResult.complexity_score || 7,
              risk_factors: aiResult.risk_factors || [],
              recommended_markup: aiResult.recommended_markup || 15,
              key_points: aiResult.key_points || [],
              requirements_count: aiResult.requirements?.length || 0,
              analyzed_at: new Date().toISOString()
            }
          });
          console.log('Bid opportunity updated with AI analysis');
        }

        setProcessing(false);
        toast.success('✅ Analysis complete! View in AI Analysis tab');
        
        // Trigger callback to refresh
        if (onUploadComplete) {
          onUploadComplete();
        }
      } catch (err) {
        console.error('AI processing error:', err);
        setProcessing(false);
        toast.error('AI analysis failed: ' + (err.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + (error.message || 'Unknown error'));
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