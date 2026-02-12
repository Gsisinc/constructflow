import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Rocket, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { convertBidToProjectFromAI } from '@/lib/bidConversion';

export default function BidToProject({ bid, organizationId }) {
  const [converting, setConverting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  const handleConvert = async () => {
    setConverting(true);
    try {
      const requirements = await base44.entities.BidRequirement.filter({
        bid_opportunity_id: bid.id
      });

      const project = await convertBidToProjectFromAI({
        base44Client: base44,
        bid,
        organizationId,
        requirements
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
