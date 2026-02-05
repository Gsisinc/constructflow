import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  User, 
  Calendar,
  FileCheck,
  Loader2,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function PhaseGateChecklist({ 
  gate, 
  open, 
  onOpenChange,
  onUpdateChecklist,
  onSignOff,
  onApproveGate,
  currentUser
}) {
  const [signOffComment, setSignOffComment] = useState('');

  if (!gate) return null;

  const checklistItems = gate.checklist_items || [];
  const signoffs = gate.required_signoffs || [];
  
  const completedItems = checklistItems.filter(item => item.completed).length;
  const progress = checklistItems.length > 0 ? (completedItems / checklistItems.length) * 100 : 0;
  
  const completedSignoffs = signoffs.filter(s => s.signed).length;
  const allItemsComplete = completedItems === checklistItems.length;
  const allSignoffsComplete = completedSignoffs === signoffs.length;

  const handleCheckItem = (index, checked) => {
    const updatedItems = [...checklistItems];
    updatedItems[index] = {
      ...updatedItems[index],
      completed: checked,
      completed_date: checked ? new Date().toISOString().split('T')[0] : null
    };
    onUpdateChecklist?.(updatedItems);
  };

  const handleSignOff = (index) => {
    const updatedSignoffs = [...signoffs];
    updatedSignoffs[index] = {
      ...updatedSignoffs[index],
      signed: true,
      signed_date: new Date().toISOString().split('T')[0],
      comments: signOffComment
    };
    onSignOff?.(updatedSignoffs);
    setSignOffComment('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Phase Gate: {gate.from_phase?.replace('_', ' ')} → {gate.to_phase?.replace('_', ' ')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Overview */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">Gate Progress</span>
              <Badge className={cn(
                gate.status === 'approved' ? 'bg-green-100 text-green-700' :
                gate.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              )}>
                {gate.status?.replace('_', ' ')}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{completedItems} of {checklistItems.length} items complete</span>
              <span>{completedSignoffs} of {signoffs.length} sign-offs</span>
            </div>
          </div>

          {/* Checklist Items */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              Compliance Checklist
            </h4>
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    item.completed ? "bg-green-50 border-green-200" : "bg-white border-slate-200"
                  )}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => handleCheckItem(index, checked)}
                    disabled={gate.status === 'approved'}
                  />
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm",
                      item.completed && "text-green-700"
                    )}>
                      {item.item}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    {item.auto_verified && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                        <Bot className="h-3 w-3" />
                        Auto-verified by system
                      </div>
                    )}
                    {item.completed_date && (
                      <p className="text-xs text-slate-500 mt-1">
                        Completed {format(new Date(item.completed_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stakeholder Sign-offs */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Required Sign-offs
            </h4>
            <div className="space-y-3">
              {signoffs.map((signoff, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border",
                    signoff.signed ? "bg-green-50 border-green-200" : "bg-white border-slate-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {signoff.signed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{signoff.role}</p>
                        <p className="text-sm text-slate-500">{signoff.name || 'Awaiting assignment'}</p>
                      </div>
                    </div>
                    {signoff.signed ? (
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-medium">Signed</p>
                        <p className="text-xs text-slate-500">
                          {signoff.signed_date && format(new Date(signoff.signed_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ) : !gate.status?.includes('approved') && (
                      <Button
                        size="sm"
                        onClick={() => handleSignOff(index)}
                        disabled={!allItemsComplete}
                      >
                        Sign Off
                      </Button>
                    )}
                  </div>
                  {signoff.comments && (
                    <p className="text-sm text-slate-600 mt-2 pl-8">"{signoff.comments}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sign-off Comment Input */}
          {!allSignoffsComplete && allItemsComplete && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sign-off Comments (Optional)</label>
              <Textarea
                value={signOffComment}
                onChange={(e) => setSignOffComment(e.target.value)}
                placeholder="Add any comments for your sign-off..."
                rows={2}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {allItemsComplete && allSignoffsComplete && gate.status !== 'approved' && (
              <Button 
                onClick={() => onApproveGate?.()}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Phase Gate
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}