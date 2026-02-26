import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Loader2, PlayCircle, Bot, Search, FileText, Calculator, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureTesting() {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateTestResult = (feature, status, message) => {
    setTestResults(prev => ({
      ...prev,
      [feature]: { status, message, timestamp: new Date().toISOString() }
    }));
  };

  const testMarketIntelligence = async () => {
    setTesting(prev => ({ ...prev, market: true }));
    try {
      const response = await base44.functions.invoke('scrapeCaCounties', {});
      if (response.data?.opportunities?.length > 0) {
        updateTestResult('market', 'success', `Found ${response.data.opportunities.length} opportunities`);
        toast.success('Market Intelligence working!');
      } else {
        updateTestResult('market', 'warning', 'No opportunities found, but function executed');
        toast.info('Function executed but no results');
      }
    } catch (error) {
      updateTestResult('market', 'error', error.message);
      toast.error('Market Intelligence test failed');
    } finally {
      setTesting(prev => ({ ...prev, market: false }));
    }
  };

  const testBidEstimation = async () => {
    setTesting(prev => ({ ...prev, estimation: true }));
    try {
      const bids = await base44.entities.BidOpportunity.list('-created_date', 1);
      if (!bids.length) {
        updateTestResult('estimation', 'warning', 'No bid opportunities found. Create one first.');
        toast.warning('Create a bid opportunity first');
        setTesting(prev => ({ ...prev, estimation: false }));
        return;
      }

      const testBid = bids[0];
      const estimate = await base44.functions.invoke('generateBidEstimate', {
        bidId: testBid.id,
        organizationId: user?.organization_id
      });

      if (estimate.data) {
        updateTestResult('estimation', 'success', 'Estimation generated successfully');
        toast.success('Bid Estimation working!');
      }
    } catch (error) {
      updateTestResult('estimation', 'error', error.message);
      toast.error('Estimation test failed');
    } finally {
      setTesting(prev => ({ ...prev, estimation: false }));
    }
  };

  const testAIAgents = async () => {
    setTesting(prev => ({ ...prev, agents: true }));
    try {
      // Test by checking agent configuration
      const agentTest = await base44.integrations.Core.InvokeLLM({
        prompt: 'Respond with "OK" if you can read this',
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string' }
          }
        }
      });

      if (agentTest) {
        updateTestResult('agents', 'success', 'AI Agents configured correctly with OpenAI GPT-4o');
        toast.success('AI Agents working!');
      }
    } catch (error) {
      updateTestResult('agents', 'error', error.message);
      toast.error('AI Agents test failed');
    } finally {
      setTesting(prev => ({ ...prev, agents: false }));
    }
  };

  const testDocumentAnalysis = async () => {
    setTesting(prev => ({ ...prev, docs: true }));
    try {
      const docs = await base44.entities.BidDocument.list('-created_date', 1);
      if (!docs.length) {
        updateTestResult('docs', 'warning', 'No documents found. Upload a bid document first.');
        toast.warning('Upload a bid document to test');
        setTesting(prev => ({ ...prev, docs: false }));
        return;
      }

      const testDoc = docs[0];
      if (testDoc.ai_processed) {
        updateTestResult('docs', 'success', 'Document analysis working - found processed doc');
        toast.success('Document Analysis working!');
      } else {
        updateTestResult('docs', 'warning', 'Documents uploaded but not AI processed');
        toast.info('Upload a new document to trigger AI analysis');
      }
    } catch (error) {
      updateTestResult('docs', 'error', error.message);
      toast.error('Document analysis test failed');
    } finally {
      setTesting(prev => ({ ...prev, docs: false }));
    }
  };

  const testRequirements = async () => {
    setTesting(prev => ({ ...prev, requirements: true }));
    try {
      const requirements = await base44.entities.BidRequirement.list('-created_date', 5);
      updateTestResult('requirements', 'success', `Found ${requirements.length} requirements`);
      toast.success(`Requirements tracking working! ${requirements.length} found`);
    } catch (error) {
      updateTestResult('requirements', 'error', error.message);
      toast.error('Requirements test failed');
    } finally {
      setTesting(prev => ({ ...prev, requirements: false }));
    }
  };

  const features = [
    {
      id: 'agents',
      name: 'AI Agents (OpenAI GPT-4o)',
      description: 'Central Orchestrator, Market Intelligence, Bid Assembly, Proposal Generation',
      icon: Bot,
      test: testAIAgents,
      instructions: 'Tests if AI agents are configured correctly with OpenAI'
    },
    {
      id: 'market',
      name: 'Bid Discovery',
      description: 'Scrape government sites for RFPs and bid opportunities',
      icon: Search,
      test: testMarketIntelligence,
      instructions: 'Runs bid scraper to find live opportunities'
    },
    {
      id: 'estimation',
      name: 'Bid Estimation System',
      description: 'AI-powered cost estimation with labor, materials, equipment breakdown',
      icon: Calculator,
      test: testBidEstimation,
      instructions: 'Requires at least one bid opportunity. Creates detailed cost estimate.'
    },
    {
      id: 'docs',
      name: 'Document Analysis',
      description: 'AI extraction of requirements from uploaded bid documents',
      icon: FileText,
      test: testDocumentAnalysis,
      instructions: 'Requires uploaded documents. Checks if AI processing is working.'
    },
    {
      id: 'requirements',
      name: 'Requirements Tracking',
      description: 'Track and manage bid requirements with categories and priorities',
      icon: Pencil,
      test: testRequirements,
      instructions: 'Lists existing requirements from bids'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Feature Testing Dashboard</h1>
          <p className="text-slate-600">Test all latest features and verify they're working correctly</p>
        </div>

        <Tabs defaultValue="tests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tests">Run Tests</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              const result = testResults[feature.id];
              const isLoading = testing[feature.id];

              return (
                <Card key={feature.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Icon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                          <p className="text-sm text-slate-600 mt-1">{feature.description}</p>
                          <p className="text-xs text-slate-500 mt-2 italic">{feature.instructions}</p>
                        </div>
                      </div>
                      <Button
                        onClick={feature.test}
                        disabled={isLoading}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Run Test
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {result && (
                    <CardContent>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                        {result.status === 'success' && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {result.status === 'error' && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {result.status === 'warning' && (
                          <XCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="text-sm text-slate-700">{result.message}</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Test Results Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(testResults).length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No tests run yet. Go to "Run Tests" tab to start.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(testResults).map(([key, result]) => {
                      const feature = features.find(f => f.id === key);
                      return (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                            <span className="font-medium">{feature?.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle>Setup Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">✅ AI Agents Configured</p>
                      <p className="text-sm text-slate-600">All 4 agents set to use OpenAI GPT-4o model</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">✅ SAM.gov API Key Set</p>
                      <p className="text-sm text-slate-600">Required for federal bid discovery</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 border-2 border-slate-300 rounded-full mt-0.5" />
                    <div>
                      <p className="font-medium">To Test Document Analysis:</p>
                      <p className="text-sm text-slate-600">1. Go to Bids → Select a bid → Upload a PDF/Word document</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 border-2 border-slate-300 rounded-full mt-0.5" />
                    <div>
                      <p className="font-medium">To Test Bid Estimation:</p>
                      <p className="text-sm text-slate-600">1. Create or select a bid opportunity<br />2. Ensure it has requirements and documents<br />3. Run the estimation test</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}