import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function AIAgentFixed() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '');
  const [samGovKey, setSamGovKey] = useState(localStorage.getItem('sam_gov_api_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSaveKeys = () => {
    localStorage.setItem('anthropic_api_key', apiKey);
    localStorage.setItem('sam_gov_api_key', samGovKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const agents = [
    {
      id: 'bid-discovery',
      name: 'Bid Discovery Agent',
      description: 'Discovers construction bids from SAM.gov and other sources',
      status: samGovKey ? 'configured' : 'needs-config',
      icon: Zap
    },
    {
      id: 'project-assistant',
      name: 'Project Assistant',
      description: 'AI assistant for project management questions',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    },
    {
      id: 'cost-analyzer',
      name: 'Cost Analyzer',
      description: 'Analyzes project costs and provides insights',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    },
    {
      id: 'schedule-optimizer',
      name: 'Schedule Optimizer',
      description: 'Optimizes project schedules using AI',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    },
    {
      id: 'safety-monitor',
      name: 'Safety Monitor',
      description: 'Monitors and suggests safety improvements',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    },
    {
      id: 'quality-checker',
      name: 'Quality Checker',
      description: 'Checks project quality against standards',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    },
    {
      id: 'team-coordinator',
      name: 'Team Coordinator',
      description: 'Coordinates team activities and communication',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    },
    {
      id: 'compliance-checker',
      name: 'Compliance Checker',
      description: 'Checks compliance with regulations',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    },
    {
      id: 'budget-forecaster',
      name: 'Budget Forecaster',
      description: 'Forecasts project budgets with AI',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    },
    {
      id: 'risk-analyst',
      name: 'Risk Analyst',
      description: 'Analyzes project risks and mitigation',
      status: apiKey ? 'configured' : 'needs-config',
      icon: Bot
    }
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Agents Configuration</h1>
        <p className="text-gray-600">Configure API keys to enable AI features</p>
      </div>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Add your API keys to enable AI agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Anthropic API Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Get from https://console.anthropic.com</p>
          </div>

          <div>
            <label className="text-sm font-medium">SAM.gov API Key</label>
            <Input
              type="password"
              placeholder="Your SAM.gov API key"
              value={samGovKey}
              onChange={(e) => setSamGovKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Get from https://api.sam.gov</p>
          </div>

          <Button onClick={handleSaveKeys} className="w-full">
            Save Configuration
          </Button>

          {saved && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Configuration saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {!apiKey && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Anthropic API key not configured. Some agents won't work.
              </AlertDescription>
            </Alert>
          )}

          {!samGovKey && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                SAM.gov API key not configured. Bid Discovery won't work.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>{agent.description}</CardDescription>
                  </div>
                  {agent.status === 'configured' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant={agent.status === 'configured' ? 'default' : 'outline'}
                  className="w-full"
                  disabled={agent.status !== 'configured'}
                >
                  {agent.status === 'configured' ? 'Use Agent' : 'Configure First'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
