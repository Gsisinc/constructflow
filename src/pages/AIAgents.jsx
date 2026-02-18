import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, RefreshCw } from 'lucide-react';

export default function AIAgents() {
  const [activeTab, setActiveTab] = useState('deepseek');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [urlInput, setUrlInput] = useState({
    deepseek: 'https://chat.deepseek.com/',
    chatgpt: 'https://chat.openai.com/',
    grok: 'https://grok.com/',
    claude: 'https://claude.ai/',
    manus: 'https://www.manus.ai/',
  });

  const agents = {
    deepseek: { 
      name: 'DeepSeek', 
      icon: '🟣', 
      url: 'https://chat.deepseek.com/',
      color: 'from-purple-500 to-purple-600',
      desc: 'Advanced reasoning and code generation'
    },
    chatgpt: { 
      name: 'ChatGPT', 
      icon: '🟢', 
      url: 'https://chat.openai.com/',
      color: 'from-green-500 to-green-600',
      desc: 'OpenAI GPT-4 powered assistant'
    },
    grok: { 
      name: 'Grok', 
      icon: '🟡', 
      url: 'https://grok.com/',
      color: 'from-yellow-500 to-yellow-600',
      desc: 'Real-time AI with web knowledge'
    },
    claude: { 
      name: 'Claude', 
      icon: '🔵', 
      url: 'https://claude.ai/',
      color: 'from-blue-500 to-blue-600',
      desc: 'Anthropic Claude AI assistant'
    },
    manus: { 
      name: 'Manus AMS', 
      icon: '🔴', 
      url: 'https://www.manus.ai/',
      color: 'from-red-500 to-red-600',
      desc: 'Manus AI management system'
    },
  };

  const customAgents = [
    { id: 1, name: 'Central Orchestrator', desc: 'Project CEO coordinating all specialist agents', icon: '👔' },
    { id: 2, name: 'Market Intelligence', desc: 'Proactive bid opportunity searcher', icon: '📊' },
    { id: 3, name: 'Bid Package Assembly', desc: 'Intelligent document synthesis', icon: '📋' },
    { id: 4, name: 'Proposal Generation', desc: 'Client-specific proposals', icon: '✍️' },
    { id: 5, name: 'Risk Prediction', desc: 'Cost overruns and schedule risks', icon: '⚠️' },
    { id: 6, name: 'Regulatory Intelligence', desc: 'Permit automation and compliance', icon: '⚖️' },
    { id: 7, name: 'Quality Assurance', desc: 'QA planning and inspections', icon: '✅' },
    { id: 8, name: 'Safety Compliance', desc: 'Safety planning and OSHA compliance', icon: '🛡️' },
    { id: 9, name: 'Sustainability Optimization', desc: 'Green building strategies', icon: '🌱' },
    { id: 10, name: 'Stakeholder Communication', desc: 'Message tailoring for audiences', icon: '💬' },
  ];

  const currentAgent = agents[activeTab];

  const handleNavigate = (e) => {
    if (e.key === 'Enter') {
      let url = urlInput[activeTab];
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      setUrlInput(prev => ({
        ...prev,
        [activeTab]: url
      }));
    }
  };

  const goHome = () => {
    setUrlInput(prev => ({
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
            🌐 AI Agent Web Browser
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Access AI services directly in your app with a built-in web browser
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          <button
            key="custom"
            onClick={() => setActiveTab('custom')}
            className={`p-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            <span>⚙️ Custom</span>
          </button>
          {Object.entries(agents).map(([key, agent]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`p-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
              }`}
            >
              <span className="mr-1">{agent.icon}</span>
              <span className="hidden sm:inline">{agent.name}</span>
              <span className="sm:hidden">{agent.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'custom' ? (
          // Custom Agents Grid
          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span>⚙️</span>
                  Custom Agents
                </CardTitle>
                <p className="text-white/80 text-sm mt-2">ConstructFlow built-in AI agents for construction</p>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className="hover:shadow-lg dark:hover:shadow-slate-700 transition-shadow cursor-pointer"
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
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">
                    {customAgents.find(a => a.id === selectedAgent)?.name} Selected ✓
                  </h3>
                  <p className="text-sm">
                    This agent will be used for your next interaction. Configuration and advanced options coming soon.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Web Browser for AI Services
          <div className="space-y-4">
            {/* Info Card */}
            <Card className={`border-2 bg-gradient-to-r ${currentAgent.color}`}>
              <CardHeader className={`bg-gradient-to-r ${currentAgent.color} text-white rounded-t-lg`}>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-3xl">{currentAgent.icon}</span>
                  {currentAgent.name}
                </CardTitle>
                <p className="text-white/80 text-sm mt-2">{currentAgent.desc}</p>
              </CardHeader>
            </Card>

            {/* Browser Toolbar */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goHome}
                    className="gap-2"
                  >
                    🏠 Home
                  </Button>
                  <Input
                    value={urlInput[activeTab]}
                    onChange={(e) => setUrlInput(prev => ({ ...prev, [activeTab]: e.target.value }))}
                    onKeyPress={handleNavigate}
                    placeholder="Enter URL or search..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      let url = urlInput[activeTab];
                      if (!url.startsWith('http')) url = 'https://' + url;
                      setUrlInput(prev => ({ ...prev, [activeTab]: url }));
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Go
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={urlInput[activeTab]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2 flex items-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Web Browser Window */}
            <Card className="overflow-hidden border-2">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden" style={{ height: '700px' }}>
                <iframe
                  key={urlInput[activeTab]}
                  src={urlInput[activeTab]}
                  className="w-full h-full border-0"
                  title={currentAgent.name}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-presentation allow-downloads"
                  allow="camera; microphone; clipboard-read; clipboard-write; payment; geolocation"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Card>

            {/* Info & Instructions */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <strong>💡 Instructions:</strong>
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>✓ Type any URL in the address bar and press Enter</li>
                    <li>✓ Click "Home" to return to {currentAgent.name}</li>
                    <li>✓ Click "Go" to refresh the page</li>
                    <li>✓ Click "Open" to open in a new browser tab if the embed doesn't work</li>
                  </ul>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                    ⚠️ Note: Some websites block embedding (X-Frame-Options). Use "Open" button to view in your browser.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
