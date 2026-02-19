import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [iframeError, setIframeError] = useState({});

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
      setIframeError(prev => ({
        ...prev,
        [activeTab]: false
      }));
    }
  };

  const goHome = () => {
    setUrlInput(prev => ({
      ...prev,
      [activeTab]: currentAgent.url
    }));
    setIframeError(prev => ({
      ...prev,
      [activeTab]: false
    }));
  };

  const handleIframeError = () => {
    setIframeError(prev => ({
      ...prev,
      [activeTab]: true
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
            Access AI services directly - click a service to start
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
            ⚙️ Custom
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
                    This agent will be used for your next interaction.
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
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goHome}
                  >
                    🏠 Home
                  </Button>
                  <Input
                    value={urlInput[activeTab]}
                    onChange={(e) => setUrlInput(prev => ({ ...prev, [activeTab]: e.target.value }))}
                    onKeyPress={handleNavigate}
                    placeholder="Enter URL..."
                    className="flex-1 min-w-[200px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goHome}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <a
                      href={urlInput[activeTab]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2 flex items-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Open Site</span>
                      <span className="sm:hidden">↗</span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Connection Error Banner */}
            {iframeError[activeTab] && (
              <Card className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-200">Connection Issue</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {currentAgent.name} blocks embedding in iframes for security. Click <strong>"Open Site"</strong> button above to open it in your browser, or try another service.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Web Browser Window */}
            <Card className="overflow-hidden border-2">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative" style={{ height: '700px' }}>
                {!iframeError[activeTab] && (
                  <iframe
                    key={urlInput[activeTab]}
                    src={urlInput[activeTab]}
                    className="w-full h-full border-0"
                    title={currentAgent.name}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-presentation allow-downloads allow-top-navigation allow-top-navigation-by-user-activation"
                    allow="camera; microphone; clipboard-read; clipboard-write; payment; geolocation; accelerometer; gyroscope; magnetometer"
                    referrerPolicy="no-referrer"
                    onError={handleIframeError}
                    style={{ display: iframeError[activeTab] ? 'none' : 'block' }}
                  />
                )}
                
                {iframeError[activeTab] && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Website Blocked Embedding
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                      {currentAgent.name} doesn't allow being displayed inside another website (X-Frame-Options restriction).
                    </p>
                    <Button
                      asChild
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      <a
                        href={urlInput[activeTab]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open {currentAgent.name} in New Tab
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Instructions */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    📌 How to Use:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                    <li>✓ Website loads automatically when you click a tab</li>
                    <li>✓ Click <strong>"Open Site"</strong> button to use in your main browser</li>
                    <li>✓ Click <strong>"Home"</strong> to refresh and return to service</li>
                    <li>✓ If you see "Website Blocked", use the "Open in New Tab" button</li>
                  </ul>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    💡 Tip: Most AI websites block embedding for security. This is normal. Click "Open Site" to use them fully.
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
