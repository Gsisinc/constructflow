import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Calendar, Sparkles, Loader2, AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SchedulingAI() {
  const [selectedProject, setSelectedProject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', selectedProject],
    queryFn: () => selectedProject ? base44.entities.Task.filter({ project_id: selectedProject }) : Promise.resolve([]),
    enabled: !!selectedProject,
  });

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const handleAnalyze = async () => {
    if (!selectedProject) { toast.error('Please select a project'); return; }
    setLoading(true);
    setResult(null);
    try {
      const taskSummary = tasks.map(t => `- ${t.name} (${t.status}, priority: ${t.priority}, due: ${t.due_date || 'TBD'})`).join('\n');
      const projectInfo = selectedProjectData ? `Project: ${selectedProjectData.name}, Phase: ${selectedProjectData.current_phase}, Progress: ${selectedProjectData.progress}%` : '';

      const aiPrompt = `You are an expert construction project scheduler. Analyze this project and provide scheduling recommendations.

${projectInfo}
Start Date: ${selectedProjectData?.start_date || 'TBD'}
End Date: ${selectedProjectData?.end_date || 'TBD'}

Current Tasks:
${taskSummary || 'No tasks defined yet'}

User's specific concern: ${prompt || 'Provide a general schedule analysis and optimization recommendations'}

Respond with a JSON object with this exact structure:
{
  "schedule_health": "good|at_risk|critical",
  "summary": "2-3 sentence summary",
  "critical_path": ["task1", "task2", "task3"],
  "risks": [{"risk": "description", "impact": "high|medium|low", "mitigation": "action"}],
  "recommendations": [{"action": "what to do", "reason": "why", "timeline": "when"}],
  "optimizations": ["optimization 1", "optimization 2"],
  "estimated_completion": "date or range"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            schedule_health: { type: 'string' },
            summary: { type: 'string' },
            critical_path: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'object' } },
            recommendations: { type: 'array', items: { type: 'object' } },
            optimizations: { type: 'array', items: { type: 'string' } },
            estimated_completion: { type: 'string' },
          }
        }
      });
      setResult(response);
    } catch (err) {
      toast.error('Analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const healthColor = {
    good: 'bg-green-100 text-green-700 border-green-200',
    at_risk: 'bg-amber-100 text-amber-700 border-amber-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Scheduling AI Assistant</h1>
        <p className="text-slate-500 mt-1">AI-powered schedule analysis, critical path detection, and optimization</p>
      </div>

      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" /> AI Schedule Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.current_phase} ({p.progress || 0}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ask about your schedule (optional)</label>
            <Textarea
              placeholder="e.g. 'What tasks are on the critical path?' or 'How can I recover 2 weeks of schedule?' or 'What are the biggest risks to our completion date?'"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {selectedProject && tasks.length > 0 && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
              <span className="font-medium">Analyzing:</span> {tasks.length} tasks in {selectedProjectData?.name}
            </div>
          )}

          <Button onClick={handleAnalyze} disabled={loading || !selectedProject} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Analyzing Schedule...' : 'Analyze Schedule with AI'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Health & Summary */}
          <Card>
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <Badge className={`text-sm px-3 py-1 border ${healthColor[result.schedule_health] || 'bg-slate-100 text-slate-700'}`}>
                  {result.schedule_health === 'good' ? '✓ On Track' : result.schedule_health === 'at_risk' ? '⚠ At Risk' : '🔴 Critical'}
                </Badge>
                <div>
                  <p className="text-slate-800">{result.summary}</p>
                  {result.estimated_completion && (
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Estimated completion: {result.estimated_completion}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Critical Path */}
            {result.critical_path?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ArrowRight className="h-4 w-4 text-red-500" /> Critical Path</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.critical_path.map((item, i) => (
                      <Badge key={i} variant="outline" className="border-red-200 text-red-700">{item}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Optimizations */}
            {result.optimizations?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Quick Wins</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {result.optimizations.map((opt, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span> {opt}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Risks */}
          {result.risks?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Schedule Risks</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.risks.map((r, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium">{r.risk}</p>
                        <Badge className={r.impact === 'high' ? 'bg-red-100 text-red-700' : r.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                          {r.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600"><span className="font-medium">Mitigation:</span> {r.mitigation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> Recommendations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{r.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>
                        {r.timeline && <Badge variant="outline" className="mt-1 text-xs">{r.timeline}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}