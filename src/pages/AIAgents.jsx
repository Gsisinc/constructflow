import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, RefreshCw, ArrowLeft, ArrowRight, Home } from 'lucide-react';

export default function AIAgents() {
  const [activeTab, setActiveTab] = useState('deepseek');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [browserHistory, setBrowserHistory] = useState({});
  const [isLoading, setIsLoading] = useState({});

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
    { id: 'central-orchestrator', name: 'Central Orchestrator', desc: 'Project CEO coordinating all specialist agents', icon: '👔' },
    { id: 'market-intelligence', name: 'Market Intelligence', desc: 'Proactive bid opportunity searcher', icon: '📊' },
    { id: 'bid-package', name: 'Bid Package Assembly', desc: 'Intelligent document synthesis', icon: '📋' },
    { id: 'proposal-generation', name: 'Proposal Generation', desc: 'Client-specific proposals', icon: '✍️' },
    { id: 'risk-prediction', name: 'Risk Prediction', desc: 'Cost overruns and schedule risks', icon: '⚠️' },
    { id: 'regulatory', name: 'Regulatory Intelligence', desc: 'Permit automation and compliance', icon: '⚖️' },
    { id: 'qa', name: 'Quality Assurance', desc: 'QA planning and inspections', icon: '✅' },
    { id: 'safety', name: 'Safety Compliance', desc: 'Safety planning and OSHA compliance', icon: '🛡️' },
    { id: 'sustainability', name: 'Sustainability Optimization', desc: 'Green building strategies', icon: '🌱' },
    { id: 'stakeholder', name: 'Stakeholder Communication', desc: 'Message tailoring for audiences', icon: '💬' },
  ];

  const currentAgent = agents[activeTab];
  const currentUrl = browserHistory[activeTab] || currentAgent.url;

  const handleUrlChange = (newUrl) => {
    setBrowserHistory(prev => ({
      ...prev,
      [activeTab]: newUrl
    }));
    setIsLoading(prev => ({
      ...prev,
      [activeTab]: true
    }));
  };

  const goHome = () => {
    setBrowserHistory(prev => ({
      ...prev,
      [activeTab]: currentAgent.url
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            AI Agent Platform
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Access multiple AI services and ConstructFlow custom agents
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          {Object.entries(agents).map(([key, agent]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`p-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-1">{agent.icon}</span>
              <span className="hidden sm:inline">{agent.name}</span>
              <span className="sm:hidden">{agent.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Info Card */}
          <Card className={`border-2 ${currentAgent.color}`}>
            <CardHeader className={`${currentAgent.color} text-white rounded-t-lg`}>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="text-3xl">{currentAgent.icon}</span>
                {currentAgent.name}
              </CardTitle>
              <p className="text-white/80 mt-2">{currentAgent.description}</p>
            </CardHeader>
          </Card>

          {/* Tab Content */}
          {activeTab === 'custom' ? (
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        Use Agent →
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedAgent && (
                <Card className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
                  <CardHeader>
                    <CardTitle>
                      {customAgents.find(a => a.id === selectedAgent)?.name} Selected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      This agent will be used for your next interaction. Configuration and advanced options coming soon.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Web Browser Component
            <div className="space-y-4">
              {/* Browser Toolbar */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-4 space-y-3">
                  {/* Navigation Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goHome}
                      className="gap-2"
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Forward
                    </Button>
                  </div>

                  {/* URL Bar */}
                  <div className="flex gap-2">
                    <Input
                      value={currentUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          let url = e.target.value;
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url;
                          }
                          handleUrlChange(url);
                        }
                      }}
                      placeholder="Enter URL or search..."
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUrlChange(currentUrl)}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Go
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Browser Window */}
              <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative" style={{ height: '700px' }}>
                  {/* Loading Indicator */}
                  {isLoading[activeTab] && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Loading {currentAgent.name}...</p>
                      </div>
                    </div>
                  )}

                  {/* Iframe with proper security settings */}
                  <iframe
                    src={currentUrl}
                    className="w-full h-full border-0"
                    title={currentAgent.name}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-presentation allow-downloads"
                    allow="camera; microphone; clipboard-read; clipboard-write; payment; usb; xr-spatial-tracking; geolocation; magnetometer; gyroscope; accelerometer"
                    onLoad={() => setIsLoading(prev => ({ ...prev, [activeTab]: false }))}
                    referrerPolicy="no-referrer"
                    style={{ display: isLoading[activeTab] ? 'none' : 'block' }}
                  />

                  {/* Fallback Message */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-center p-6 rounded-lg">
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                      Browser View
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      {currentAgent.name} is loading above. If it doesn't load, click the link below:
                    </p>
                    <Button
                      asChild
                      className="gap-2"
                    >
                      <a
                        href={currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Info Card */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    💡 <strong>How to use:</strong> Type a URL in the address bar and press Enter, or use the Home button to return to {currentAgent.name}. 
                    You can use this browser to access {currentAgent.name} and other websites directly.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
                    ⚠️ Some websites may have restrictions. Click "Open in New Tab" to open in full browser if needed.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
