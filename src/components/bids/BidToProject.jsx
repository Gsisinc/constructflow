import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Rocket, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BidToProject({ bid, organizationId }) {
  const [converting, setConverting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  const handleConvert = async () => {
    setConverting(true);
    try {
      // Extract AI analysis data
      const aiAnalysis = bid.ai_analysis || {};
      const complexityScore = aiAnalysis.complexity_score || 5;
      const riskFactors = aiAnalysis.risk_factors || [];
      const recommendedMarkup = aiAnalysis.recommended_markup || 15;
      const estimatedValue = bid.estimated_value || 0;

      // Calculate budget with markup and contingency
      const contingencyPercent = Math.max(10, complexityScore * 1.5);
      const timelineDays = Math.max(30, Math.floor((estimatedValue / 10000) * (complexityScore / 5)));
      const endDate = new Date(Date.now() + timelineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch requirements
      const requirements = await base44.entities.BidRequirement.filter({
        bid_opportunity_id: bid.id
      });

      // Create project with AI-enhanced data
      const project = await base44.entities.Project.create({
        organization_id: organizationId,
        name: bid.title || bid.project_name,
        client_name: bid.client_name || bid.agency,
        client_email: bid.client_email,
        project_type: bid.project_type || 'commercial',
        status: 'awarded',
        current_phase: 'preconstruction',
        description: bid.description || bid.scope_of_work,
        budget: estimatedValue,
        contingency_percent: contingencyPercent,
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate,
        address: bid.location,
        health_status: complexityScore > 7 ? 'yellow' : 'green',
        projected_final_cost: estimatedValue * (1 + contingencyPercent / 100)
      });

      // Create project phases with budgets
      const phases = [
        { name: 'preconstruction', duration: Math.ceil(timelineDays * 0.1) },
        { name: 'foundation', duration: Math.ceil(timelineDays * 0.15) },
        { name: 'superstructure', duration: Math.ceil(timelineDays * 0.25) },
        { name: 'enclosure', duration: Math.ceil(timelineDays * 0.15) },
        { name: 'mep_rough', duration: Math.ceil(timelineDays * 0.15) },
        { name: 'interior_finishes', duration: Math.ceil(timelineDays * 0.15) },
        { name: 'commissioning', duration: Math.ceil(timelineDays * 0.05) }
      ];

      const phaseBudgetPromises = phases.map(phase =>
        base44.entities.PhaseBudget.create({
          project_id: project.id,
          phase_name: phase.name,
          allocated_budget: estimatedValue / phases.length,
          spent: 0,
          committed: 0
        })
      );
      await Promise.all(phaseBudgetPromises);

      // Create tasks from requirements
      if (requirements.length > 0) {
        const taskPromises = requirements
          .filter(req => req.status !== 'completed')
          .map(req => 
            base44.entities.OperationalTask.create({
              organization_id: organizationId,
              project_id: project.id,
              title: `${req.category}: ${req.requirement_text.substring(0, 50)}`,
              description: req.requirement_text,
              category: req.category === 'technical' ? 'documentation' : 
                         req.category === 'legal' ? 'compliance' :
                         req.category === 'financial' ? 'procurement' : 'other',
              priority: req.priority,
              status: 'pending',
              source: 'auto_generated',
              auto_generated_from: 'bid_conversion'
            })
          );
        await Promise.all(taskPromises);
      }

      // Create risk issues from AI analysis
      if (riskFactors.length > 0) {
        const riskPromises = riskFactors.slice(0, 5).map((risk) =>
          base44.entities.Issue.create({
            project_id: project.id,
            title: `Risk: ${risk.substring(0, 50)}`,
            description: risk,
            type: 'other',
            severity: complexityScore > 7 ? 'high' : 'medium',
            status: 'open'
          })
        );
        await Promise.all(riskPromises);
      }

      // Update bid status
      await base44.entities.BidOpportunity.update(bid.id, {
        status: 'won'
      });

      toast.success('Project created with AI insights!');
      setShowDialog(false);
      navigate(createPageUrl('ProjectDetail') + `?id=${project.id}`);
    } catch (error) {
      console.error('Conversion failed:', error);
      toast.error('Failed to create project: ' + error.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        <Rocket className="h-4 w-4" />
        Convert to Project
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Bid to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-slate-900 mb-2">
                      This will create:
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      <li>✓ New project with bid details</li>
                      <li>✓ Tasks from requirements</li>
                      <li>✓ Budget allocation</li>
                      <li>✓ Timeline setup</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={handleConvert}
                disabled={converting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {converting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={converting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}