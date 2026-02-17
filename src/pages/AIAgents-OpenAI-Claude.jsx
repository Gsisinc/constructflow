import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, CheckCircle2, AlertCircle, Zap, MessageSquare } from 'lucide-react';
import AIAgentService from '@/services/AIAgentService';

export default function AIAgentsOpenAIClaude() {
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [claudeKey, setClaudeKey] = useState(localStorage.getItem('claude_api_key') || '');
  const [saved, setSaved] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [inputs, setInputs] = useState({});

  const handleSaveKeys = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('claude_api_key', claudeKey);
    
    // Set environment variables
    process.env.REACT_APP_OPENAI_API_KEY = openaiKey;
    process.env.REACT_APP_CLAUDE_API_KEY = claudeKey;
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const agents = [
    {
      id: 'market-intelligence',
      name: 'Market Intelligence',
      description: 'Discover and analyze construction bid opportunities',
      icon: Zap,
      inputLabel: 'What type of bids are you looking for?',
      method: 'marketIntelligence'
    },
    {
      id: 'bid-assembly',
      name: 'Bid Package Assembly',
      description: 'Organize RFP requirements and create checklists',
      icon: Bot,
      inputLabel: 'Enter project details',
      method: 'bidPackageAssembly'
    },
    {
      id: 'proposal',
      name: 'Proposal Generation',
      description: 'Create compelling project proposals',
      icon: MessageSquare,
      inputLabel: 'Enter project scope and client info',
      method: 'proposalGeneration'
    },
    {
      id: 'regulatory',
      name: 'Regulatory Intelligence',
      description: 'Navigate permits and building codes',
      icon: Bot,
      inputLabel: 'Enter project type and location',
      method: 'regulatoryIntelligence'
    },
    {
      id: 'risk',
      name: 'Risk Prediction',
      description: 'Identify and mitigate project risks',
      icon: AlertCircle,
      inputLabel: 'Enter project details',
      method: 'riskPrediction'
    },
    {
      id: 'quality',
      name: 'Quality Assurance',
      description: 'Define quality standards and inspections',
      icon: CheckCircle2,
      inputLabel: 'Enter project phase and specs',
      method: 'qualityAssurance'
    },
    {
      id: 'safety',
      name: 'Safety Compliance',
      description: 'Create safety plans and hazard analysis',
      icon: Bot,
      inputLabel: 'Enter project type and hazards',
      method: 'safetyCompliance'
    },
    {
      id: 'sustainability',
      name: 'Sustainability',
      description: 'Optimize for eco-friendly methods',
      icon: Zap,
      inputLabel: 'Enter project scope',
      method: 'sustainabilityOptimization'
    },
    {
      id: 'communication',
      name: 'Stakeholder Communication',
      description: 'Tailor messages for different audiences',
      icon: MessageSquare,
      inputLabel: 'Enter message and target audience',
      method: 'stakeholderCommunication'
    },
    {
      id: 'orchestrator',
      name: 'Central Orchestrator',
      description: 'Coordinate multiple agents',
      icon: Bot,
      inputLabel: 'Enter task and select agents',
      method: 'orchestrateAgents'
    }
  ];

  const handleAgentQuery = async (agent) => {
    if (!openaiKey && !claudeKey) {
      alert('Please configure API keys first');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const input = inputs[agent.id] || '';
      
      if (!input.trim()) {
        alert('Please enter input for the agent');
        setLoading(false);
        return;
      }

      let result;

      switch (agent.method) {
        case 'marketIntelligence':
          result = await AIAgentService.marketIntelligence(input);
          break;
        case 'bidPackageAssembly':
          result = await AIAgentService.bidPackageAssembly(input);
          break;
        case 'proposalGeneration':
          const [scope, clientInfo] = input.split('|');
          result = await AIAgentService.proposalGeneration(scope, clientInfo);
          break;
        case 'regulatoryIntelligence':
          const [type, location] = input.split('|');
          result = await AIAgentService.regulatoryIntelligence(type, location);
          break;
        case 'riskPrediction':
          result = await AIAgentService.riskPrediction(input);
          break;
        case 'qualityAssurance':
          const [phase, specs] = input.split('|');
          result = await AIAgentService.qualityAssurance(phase, specs);
          break;
        case 'safetyCompliance':
          const [pType, hazards] = input.split('|');
          result = await AIAgentService.safetyCompliance(pType, hazards);
          break;
        case 'sustainabilityOptimization':
          result = await AIAgentService.sustainabilityOptimization(input);
          break;
        case 'stakeholderCommunication':
          const [msg, audience] = input.split('|');
          result = await AIAgentService.stakeholderCommunication(msg, audience);
          break;
        case 'orchestrateAgents':
          const agentList = input.split(',').map(a => a.trim());
          result = await AIAgentService.orchestrateAgents(input, agentList);
          break;
        default:
          result = 'Agent not configured';
      }

      setResponse(result);
    } catch (error) {
      console.error('Agent error:', error);
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (result) => {
    if (typeof result === 'string') {
      return result;
    }
    if (result.message && typeof result.message === 'string') {
      return result.message;
    }
    return JSON.stringify(result, null, 2);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Agents - OpenAI & Claude</h1>
        <p className="text-gray-600">Configure and use AI agents powered by OpenAI GPT-4 and Claude</p>
      </div>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Add your OpenAI and Claude API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">OpenAI API Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Get from https://platform.openai.com/api-keys</p>
          </div>

          <div>
            <label className="text-sm font-medium">Claude API Key</label>
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Get from https://console.anthropic.com/account/keys</p>
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

          {!openaiKey && !claudeKey && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Add at least one API key to use AI agents
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4">10 AI Agents Available</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveAgent(activeAgent === agent.id ? null : agent.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {<agent.icon className="w-5 h-5" />}
                  {agent.name}
                </CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {activeAgent === agent.id && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <div>
                      <label className="text-sm font-medium">{agent.inputLabel}</label>
                      <Textarea
                        value={inputs[agent.id] || ''}
                        onChange={(e) =>
                          setInputs({ ...inputs, [agent.id]: e.target.value })
                        }
                        placeholder={agent.inputLabel}
                        className="mt-2 text-sm"
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={() => handleAgentQuery(agent)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Processing...' : 'Run Agent'}
                    </Button>

                    {response && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium mb-2">Response:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs">{formatResponse(response)}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
