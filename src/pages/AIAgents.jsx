import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AgentChat from '@/components/agents/AgentChat';
import MinibrowserLauncher, { openMinibrowser } from '@/components/MinibrowserLauncher';
import { AGENT_WORKFLOWS } from '@/config/agentWorkflows';
import { Maximize2, Bot, Sparkles } from 'lucide-react';

const WORKFLOW_ICONS = {
  central_orchestrator: '👔',
  market_intelligence: '📊',
  bid_package_assembly: '📋',
  proposal_generation: '✍️',
  regulatory_intelligence: '⚖️',
  risk_prediction: '⚠️',
  quality_assurance: '✅',
  safety_compliance: '🛡️',
  sustainability_optimization: '🌱',
  stakeholder_communication: '💬',
};

const WORKFLOW_COLORS = {
  central_orchestrator: 'from-slate-500 to-slate-600',
  market_intelligence: 'from-blue-500 to-cyan-600',
  bid_package_assembly: 'from-amber-500 to-amber-600',
  proposal_generation: 'from-emerald-500 to-emerald-600',
  regulatory_intelligence: 'from-violet-500 to-violet-600',
  risk_prediction: 'from-orange-500 to-orange-600',
  quality_assurance: 'from-green-500 to-green-600',
  safety_compliance: 'from-red-500 to-red-600',
  sustainability_optimization: 'from-teal-500 to-teal-600',
  stakeholder_communication: 'from-indigo-500 to-indigo-600',
};

export default function AIAgents() {
  const [activeTab, setActiveTab] = useState('deepseek');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [chatAgent, setChatAgent] = useState(null);

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

  const customAgents = Object.entries(AGENT_WORKFLOWS).map(([id, w]) => ({
    id,
    name: w.name,
    desc: w.purpose,
    icon: WORKFLOW_ICONS[id] || '🤖',
    color: WORKFLOW_COLORS[id] || 'from-blue-500 to-blue-600',
  }));

  const currentAgent = agents[activeTab];

  return (
    <div className="min-h-screen bg-[var(--cf-page-bg)] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--cf-heading)] tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
              <Bot className="h-8 w-8" />
            </span>
            AI Agents Hub
          </h1>
          <p className="text-[var(--cf-muted)] mt-2 text-base">
            Custom construction agents (real AI) and quick access to external AI in minibrowsers
          </p>
        </header>

        {/* Tab pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all ${
              activeTab === 'custom'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-[var(--cf-surface)] text-[var(--cf-muted)] hover:bg-[var(--cf-border)]'
            }`}
          >
            <Sparkles className="inline h-4 w-4 mr-1.5 -mt-0.5" /> Custom agents
          </button>
          {Object.entries(agents).map(([key, agent]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 rounded-full font-medium text-sm transition-all ${
                activeTab === key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-[var(--cf-border)]'
                  : 'bg-[var(--cf-surface)] text-[var(--cf-muted)] hover:bg-[var(--cf-border)]'
              }`}
            >
              <span className="mr-1.5">{agent.icon}</span>
              {agent.name}
            </button>
          ))}
        </div>

        {activeTab === 'custom' ? (
          <section>
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 shadow-xl">
              <h2 className="text-xl font-bold flex items-center gap-2">Custom Agents</h2>
              <p className="text-white/90 text-sm mt-1">Real AI (Claude or OpenAI). Add API keys in .env.local for live responses.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className="hover:shadow-xl transition-all cursor-pointer border-[var(--cf-border)] bg-[var(--cf-surface)]"
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{agent.icon}</span>
                      {agent.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-[var(--cf-muted)]">{agent.desc}</p>
                    <Button
                      className={`w-full ${selectedAgent === agent.id ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'} text-white`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatAgent({ id: agent.id, name: agent.name, description: agent.desc, color: agent.color });
                      }}
                    >
                      {chatAgent?.id === agent.id ? 'Chat open' : 'Use agent'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <Card className={`overflow-hidden border-0 bg-gradient-to-br ${currentAgent.color} text-white shadow-xl`}>
              <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="text-5xl">{currentAgent.icon}</div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-bold mb-1">{currentAgent.name}</h2>
                  <p className="text-white/90 text-sm mb-2">{currentAgent.desc}</p>
                  <MinibrowserLauncher
                    url={currentAgent.url}
                    label="Open in new window"
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/40 text-sm px-4 py-2 rounded-lg"
                    icon={Maximize2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Open in new window – primary (most AI sites block embedding) */}
            <Card className="overflow-hidden border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-3">
                  Most AI sites (Claude, ChatGPT, etc.) block embedding. Use the button below to open in a new window.
                </p>
                <MinibrowserLauncher
                  url={currentAgent.url}
                  label="Open in new window"
                  variant="default"
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white border-0 px-6 py-3 text-base font-medium"
                  icon={Maximize2}
                />
              </CardContent>
            </Card>

            {/* Optional embedded frame (often blank due to X-Frame-Options) */}
            <Card className="overflow-hidden border border-[var(--cf-border)]">
              <div className="bg-[var(--cf-surface)] px-3 py-2 border-b border-[var(--cf-border)] flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--cf-muted)]">Embedded preview (may be blocked)</span>
                <MinibrowserLauncher
                  url={currentAgent.url}
                  label="Open in new window"
                  variant="outline"
                  className="text-xs shrink-0"
                  icon={Maximize2}
                />
              </div>
              <div className="relative bg-slate-100 dark:bg-slate-900 min-h-[200px] sm:min-h-[360px]" style={{ minHeight: 'min(480px, 50vh)' }}>
                <iframe
                  src={currentAgent.url}
                  title={`${currentAgent.name} embedded`}
                  className="w-full border-0 rounded-b-md"
                  style={{ height: 'min(480px, 50vh)', minHeight: 200 }}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
              <p className="text-xs text-[var(--cf-muted)] px-3 py-2 bg-[var(--cf-surface)] border-t border-[var(--cf-border)]">
                If the frame is blank, the site blocks embedding — use &quot;Open in new window&quot; above.
              </p>
            </Card>

            <div>
              <h3 className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3">All AI services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(agents).map(([key, agent]) => (
                  <Card
                    key={key}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg border-[var(--cf-border)] ${activeTab === key ? 'ring-2 ring-violet-500' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <p className="font-semibold text-[var(--cf-heading)]">{agent.name}</p>
                          <p className="text-xs text-[var(--cf-muted)]">{agent.desc}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); openMinibrowser(agent.url, agent.name); }}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {chatAgent && (
          <AgentChat
            agent={chatAgent}
            onClose={() => setChatAgent(null)}
          />
        )}
      </div>
    </div>
  );
}