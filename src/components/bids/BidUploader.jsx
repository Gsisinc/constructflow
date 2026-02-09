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

    // Reset file input to allow re-uploading same file
    e.target.value = '';

    setUploading(true);
    console.log('Starting file upload:', file.name);
    
    try {
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

        // Update document with extracted data
        console.log('Updating document with AI results...');
        await base44.entities.BidDocument.update(doc.id, {
          ai_processed: true,
          extracted_data: aiResult
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
        toast.success('✨ AI analysis complete! Auto-creating project...');

        // Auto-create project from the bid
        try {
          const user = await base44.auth.me();
          const currentBid = bids[0];
          
          if (currentBid && user.organization_id) {
            const complexityScore = aiResult.complexity_score || 5;
            const estimatedValue = currentBid.estimated_value || 100000;
            const contingencyPercent = Math.max(10, complexityScore * 1.5);
            const timelineDays = Math.max(30, Math.floor((estimatedValue / 10000) * (complexityScore / 5)));
            const endDate = new Date(Date.now() + timelineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const project = await base44.entities.Project.create({
              organization_id: user.organization_id,
              name: currentBid.title || currentBid.project_name,
              client_name: currentBid.client_name || currentBid.agency,
              project_type: currentBid.project_type || 'commercial',
              status: 'planning',
              current_phase: 'preconstruction',
              description: currentBid.description || currentBid.scope_of_work,
              budget: estimatedValue,
              contingency_percent: contingencyPercent,
              start_date: new Date().toISOString().split('T')[0],
              end_date: endDate,
              address: currentBid.location,
              health_status: complexityScore > 7 ? 'yellow' : 'green',
              projected_final_cost: estimatedValue * (1 + contingencyPercent / 100)
            });

            // Create phases with budgets
            const phases = [
              { name: 'preconstruction', budget: estimatedValue * 0.1 },
              { name: 'foundation', budget: estimatedValue * 0.15 },
              { name: 'superstructure', budget: estimatedValue * 0.25 },
              { name: 'enclosure', budget: estimatedValue * 0.15 },
              { name: 'mep_rough', budget: estimatedValue * 0.15 },
              { name: 'interior_finishes', budget: estimatedValue * 0.15 },
              { name: 'commissioning', budget: estimatedValue * 0.05 }
            ];

            await Promise.all(phases.map(phase =>
              base44.entities.PhaseBudget.create({
                project_id: project.id,
                phase_name: phase.name,
                allocated_budget: phase.budget,
                spent: 0,
                committed: 0
              })
            ));

            // Create tasks from requirements
            if (aiResult.requirements?.length > 0) {
              await Promise.all(aiResult.requirements.slice(0, 10).map(req =>
                base44.entities.OperationalTask.create({
                  organization_id: user.organization_id,
                  project_id: project.id,
                  title: req.text.substring(0, 100),
                  description: req.text,
                  category: 'documentation',
                  priority: req.priority?.toLowerCase() || 'medium',
                  status: 'pending'
                })
              ));
            }

            toast.success('🎉 Project auto-created with phases, budget, and tasks!');
          }
        } catch (projectError) {
          console.error('Failed to auto-create project:', projectError);
          toast.error('Project creation failed, but analysis is saved');
        }
        
        // Trigger callback immediately to refresh all data
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