import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';

export default function AIAgents() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [iframeKey, setIframeKey] = useState({});

  const agents = {
    deepseek: {
      name: 'DeepSeek',
      url: 'https://chat.deepseek.com/',
      color: 'bg-purple-600',
      description: 'Advanced reasoning and code generation',
      icon: '🟣',
    },
    chatgpt: {
      name: 'ChatGPT',
      url: 'https://chat.openai.com/',
      color: 'bg-green-600',
      description: 'OpenAI GPT-4 powered assistant',
      icon: '🟢',
    },
    grok: {
      name: 'Grok',
      url: 'https://grok.com/',
      color: 'bg-yellow-600',
      description: 'Real-time AI with web knowledge',
      icon: '🟡',
    },
    claude: {
      name: 'Claude',
      url: 'https://claude.ai/',
      color: 'bg-blue-600',
      description: 'Anthropic Claude AI assistant',
      icon: '🔵',
    },
    manus: {
      name: 'Manus AMS',
      url: 'https://www.manus.ai/',
      color: 'bg-red-600',
      description: 'Manus AI management system',
      icon: '🔴',
    },
    custom: {
      name: 'Custom Agents',
      url: null,
      color: 'bg-slate-600',
      description: 'ConstructFlow built-in agents',
      icon: '⚙️',
    },
  };

  const customAgents = [
    {
      id: 'central-orchestrator',
      name: 'Central Orchestrator',
      desc: 'Project CEO coordinating all specialist agents',
      icon: '👔',
    },
    {
      id: 'market-intelligence',
      name: 'Market Intelligence',
      desc: 'Proactive bid opportunity searcher',
      icon: '📊',
    },
    {
      id: 'bid-package',
      name: 'Bid Package Assembly',
      desc: 'Intelligent document synthesis',
      icon: '📋',
    },
    {
      id: 'proposal-generation',
      name: 'Proposal Generation',
      desc: 'Client-specific proposals',
      icon: '✍️',
    },
    {
      id: 'risk-prediction',
      name: 'Risk Prediction',
      desc: 'Cost overruns and schedule risks',
      icon: '⚠️',
    },
    {
      id: 'regulatory',
      name: 'Regulatory Intelligence',
      desc: 'Permit automation and compliance',
      icon: '⚖️',
    },
    {
      id: 'qa',
      name: 'Quality Assurance',
      desc: 'QA planning and inspections',
      icon: '✅',
    },
    {
      id: 'safety',
      name: 'Safety Compliance',
      desc: 'Safety planning and OSHA compliance',
      icon: '🛡️',
    },
    {
      id: 'sustainability',
      name: 'Sustainability Optimization',
      desc: 'Green building strategies',
      icon: '🌱',
    },
    {
      id: 'stakeholder',
      name: 'Stakeholder Communication',
      desc: 'Message tailoring for audiences',
      icon: '💬',
    },
  ];

  const reloadIframe = (agentKey) => {
    setIframeKey(prev => ({
      ...prev,
      [agentKey]: !prev[agentKey],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            AI Agent Platform
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Access multiple AI services and ConstructFlow custom agents
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="deepseek" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6">
            {Object.entries(agents).map(([key, agent]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white rounded text-xs sm:text-sm font-medium"
              >
                <span className="mr-1">{agent.icon}</span>
                <span className="hidden sm:inline">{agent.name}</span>
                <span className="sm:hidden">{agent.name.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Contents */}
          {Object.entries(agents).map(([key, agent]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              {/* Info Card */}
              <Card className="border-2 border-slate-200 dark:border-slate-700">
                <CardHeader className={`${agent.color} text-white rounded-t-lg`}>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <span className="text-3xl">{agent.icon}</span>
                    {agent.name}
                  </CardTitle>
                  <p className="text-white/80 mt-2">{agent.description}</p>
                </CardHeader>
              </Card>

              {/* Content */}
              {key === 'custom' ? (
                // Custom Agents Grid
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customAgents.map((agent) => (
                      <Card
                        key={agent.id}
                        className="hover:shadow-lg dark:hover:shadow-slate-700 transition-shadow cursor-pointer border-slate-200 dark:border-slate-700"
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">{agent.icon}</span>
                            {agent.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {agent.desc}
                          </p>
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded"
                            onClick={() => {
                              setSelectedAgent(agent.id);
                            }}
                          >
                            Use Agent →
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Selected Agent Info */}
                  {selectedAgent && (
                    <Card className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
                      <CardHeader>
                        <CardTitle>
                          {customAgents.find(a => a.id === selectedAgent)?.name} Selected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          This agent will be used for your next interaction. 
                          Configuration and advanced options coming soon.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                // External AI Service Embedded
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reloadIframe(key)}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={agent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Full Site
                      </a>
                    </Button>
                  </div>

                  {/* Embedded Iframe */}
                  <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                      <iframe
                        key={iframeKey[key]}
                        src={agent.url}
                        className="w-full h-full border-0"
                        title={agent.name}
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-presentation allow-top-navigation allow-top-navigation-by-user-activation"
                        allow="camera; microphone; clipboard-read; clipboard-write"
                      />
                    </div>
                  </Card>

                  {/* Info */}
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        💡 <strong>Tip:</strong> Click "Open Full Site" to use {agent.name} in full screen, 
                        or use the embedded preview below. The reload button refreshes the preview.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
