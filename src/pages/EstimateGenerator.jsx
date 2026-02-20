import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Upload, Loader2, FileText, X } from 'lucide-react';

export default function EstimateGenerator() {
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setAttachedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      loading: true
    });

    // Simulate file upload
    setTimeout(() => {
      setAttachedFile(prev => ({
        ...prev,
        loading: false
      }));
    }, 2000);
  };

  const generateEstimate = async () => {
    if (!scopeOfWork.trim()) {
      setError('Please enter scope of work');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
      
      if (!apiKey) {
        throw new Error('Claude API key not configured');
      }

      const prompt = `Generate a detailed construction estimate based on the following scope of work:

${scopeOfWork}

${attachedFile ? `\nAttached document: ${attachedFile.name}` : ''}

Please provide:
1. Itemized breakdown of tasks
2. Estimated labor hours for each task
3. Material costs (with assumptions noted)
4. Labor costs
5. Contingency (10%)
6. Total estimated cost
7. Timeline estimate

Format as a professional estimate document.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 2048,
          system: 'You are a professional construction estimator. Create detailed, accurate estimates based on project scope. Always include itemized breakdowns, labor and material costs, and contingency amounts.',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate estimate');
      }

      const data = await response.json();
      const result = data.content[0].text;

      setEstimateResult({
        generatedAt: new Date().toLocaleString(),
        content: result
      });
    } catch (err) {
      setError(err.message || 'Failed to generate estimate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            💡 AI Estimate Generator
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Generate professional construction estimates in minutes with AI
          </p>
        </div>

        {!estimateResult ? (
          // Input Form
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Create Estimate</CardTitle>
                <p className="text-white/80 text-sm mt-2">Provide scope and details for AI-powered estimate</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                
                {/* Scope of Work */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Scope of Work & Instructions
                  </label>
                  <Textarea
                    value={scopeOfWork}
                    onChange={(e) => setScopeOfWork(e.target.value)}
                    placeholder="E.g. 900 sqft kitchen model. Remove existing cabinets, appliances, and old electrical. Install new cabinets, countertops, flooring, lighting, and high-end appliances. Update plumbing, electrical, and paint."
                    className="min-h-40"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Provide detailed scope including project type, location, materials, and any special requirements
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Attach PDF File
                    <span className="text-xs text-blue-600 ml-2">BETA</span>
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Include plans, bill of materials, etc. (up to 32 MB) - Optional
                  </p>
                  
                  {attachedFile ? (
                    <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                      <FileText className="w-6 h-6 text-orange-600" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{attachedFile.name}</p>
                        {attachedFile.loading ? (
                          <p className="text-xs text-slate-500">Uploading...</p>
                        ) : (
                          <p className="text-xs text-slate-500">{(attachedFile.size / 1024).toFixed(2)} KB</p>
                        )}
                      </div>
                      <button
                        onClick={() => setAttachedFile(null)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Drag and drop, or click to upload
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PDF files up to 32MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                </div>

                {/* Warning */}
                <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    AI-generated content may be inaccurate. Please review all descriptions and pricing for accuracy.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={generateEstimate}
                  disabled={loading || !scopeOfWork.trim()}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Generating Estimate...
                    </>
                  ) : (
                    'Draft Estimate'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Results
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Generated Estimate</CardTitle>
                <p className="text-white/80 text-sm mt-2">Generated: {estimateResult.generatedAt}</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg whitespace-pre-wrap font-mono text-sm text-slate-900 dark:text-slate-100 max-h-96 overflow-y-auto">
                  {estimateResult.content}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setEstimateResult(null);
                  setScopeOfWork('');
                  setAttachedFile(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Create Another Estimate
              </Button>
              <Button
                onClick={() => {
                  const text = estimateResult.content;
                  const element = document.createElement('a');
                  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                  element.setAttribute('download', `estimate-${new Date().getTime()}.txt`);
                  element.style.display = 'none';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Download Estimate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
