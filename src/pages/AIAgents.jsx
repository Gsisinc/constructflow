import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AgentChat from '@/components/agents/AgentChat';
import LocalAgentChat from '@/components/agents/LocalAgentChat';
import MinibrowserLauncher, { openMinibrowser } from '@/components/MinibrowserLauncher';
import { AGENT_WORKFLOWS } from '@/config/agentWorkflows';
import { AGENCY_DIVISIONS, filterSpecialAgents } from '@/config/specialAgents';
import { Maximize2, Bot, Sparkles, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  blueprint_analyzer: '📐',
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
  blueprint_analyzer: 'from-blue-600 to-violet-600',
};

export default function AIAgents() {
  const [activeTab, setActiveTab] = useState('deepseek');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [chatAgent, setChatAgent] = useState(null);
  const [specialChatAgent, setSpecialChatAgent] = useState(null);
  const [agencySearch, setAgencySearch] = useState('');
  const [agencyDivision, setAgencyDivision] = useState('');

  const filteredAgencyAgents = filterSpecialAgents(agencySearch, agencyDivision || undefined);
  const divisionLabel = (id) => AGENCY_DIVISIONS.find((d) => d.id === id)?.label || id;

  const agents = {
    deepseek: { 
      name: 'DeepSeek', 
      icon: '🟣', 
      url: 'https://chat.deepseek.com/',
      image: '/deepseek-hero.png',
      color: 'from-purple-500 to-purple-600',
      desc: 'Advanced reasoning and code generation'
    },
    chatgpt: { 
      name: 'ChatGPT', 
      icon: '🟢', 
      url: 'https://chat.openai.com/',
      image: '/chatgpt-hero.png',
      color: 'from-green-500 to-green-600',
      desc: 'OpenAI GPT-4 powered assistant'
    },
    grok: { 
      name: 'Grok', 
      icon: '🟡', 
      url: 'https://grok.com/',
      image: '/grok-hero.png',
      color: 'from-yellow-500 to-yellow-600',
      desc: 'Real-time AI with web knowledge'
    },
    claude: { 
      name: 'Claude', 
      icon: '🔵', 
      url: 'https://claude.ai/',
      image: '/claude-hero.png',
      color: 'from-blue-500 to-blue-600',
      desc: 'Anthropic Claude AI assistant'
    },
    manus: { 
      name: 'Manus AMS', 
      icon: '🔴', 
      url: 'https://www.manus.ai/',
      image: '/manus-hero.png',
      color: 'from-red-500 to-red-600',
      desc: 'Manus AI management system'
    },
  };

  const customAgents = [
    ...Object.entries(AGENT_WORKFLOWS).map(([id, w]) => ({
      id,
      name: w.name,
      desc: w.purpose,
      icon: WORKFLOW_ICONS[id] || '🤖',
      color: WORKFLOW_COLORS[id] || 'from-blue-500 to-blue-600',
    })),
    {
      id: 'blueprint_analyzer',
      name: 'Blueprint Analyzer',
      desc: 'Upload blueprints or drawings — AI reads them with computer vision and generates quantity takeoffs and cost estimates.',
      icon: '📐',
      color: 'from-blue-600 to-violet-600',
      badge: 'Vision AI',
    },
  ];

  const currentAgent = agents[activeTab];

  return (
    <div className="min-h-screen bg-[var(--cf-page-bg)] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--cf-heading)] tracking-tight flex items-center gap-3">
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
            {/* The Agency — hero */}
            <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-violet-900/40 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-violet-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-3xl">🎭</span>
                    The Agency
                  </h2>
                  <p className="text-white/90 text-sm mt-1 max-w-xl">
                    Specialized AI agents from{' '}
                    <a href="https://github.com/msitarzewski/agency-agents" target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline inline-flex items-center gap-1">
                      agency-agents <ExternalLink className="h-3 w-3" />
                    </a>
                    . All use Claude or OpenAI (your API keys in Settings). In chat, use the analyzer to attach images or PDFs for vision and extraction.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span className="rounded-full bg-white/10 px-3 py-1">{filteredAgencyAgents.length} agents</span>
                </div>
              </div>
            </div>

            {/* Search + division filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cf-muted)]" />
                <Input
                  placeholder="Search agents by name or description..."
                  value={agencySearch}
                  onChange={(e) => setAgencySearch(e.target.value)}
                  className="pl-9 bg-[var(--cf-surface)] border-[var(--cf-border)]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAgencyDivision('')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${!agencyDivision ? 'bg-violet-600 text-white' : 'bg-[var(--cf-surface)] text-[var(--cf-muted)] hover:bg-[var(--cf-border)]'}`}
                >
                  All
                </button>
                {AGENCY_DIVISIONS.map((div) => (
                  <button
                    key={div.id}
                    onClick={() => setAgencyDivision(agencyDivision === div.id ? '' : div.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${agencyDivision === div.id ? 'bg-violet-600 text-white' : 'bg-[var(--cf-surface)] text-[var(--cf-muted)] hover:bg-[var(--cf-border)]'}`}
                  >
                    <span>{div.icon}</span>
                    {div.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Agency agent grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {filteredAgencyAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-xl transition-all border-[var(--cf-border)] bg-[var(--cf-surface)]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-2xl">{agent.icon}</span>
                        {agent.name}
                      </CardTitle>
                      <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full font-medium shrink-0">
                        {divisionLabel(agent.division)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--cf-muted)] mt-1">{agent.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      className={`w-full bg-gradient-to-r ${agent.color || 'from-cyan-500 to-cyan-600'} text-white hover:opacity-90`}
                      onClick={() => setSpecialChatAgent(agent)}
                    >
                      {specialChatAgent?.id === agent.id ? 'Chat open' : 'Use agent'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAgencyAgents.length === 0 && (
              <p className="text-center text-[var(--cf-muted)] py-8">No agents match your search. Try a different term or clear the division filter.</p>
            )}

            <div>
              <h3 className="text-sm font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3">Construction Workflow Agents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                      {agent.badge && (
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          {agent.badge}
                        </span>
                      )}
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
                  className="w-full sm:w-auto sm:w-auto bg-amber-600 hover:bg-amber-700 text-white border-0 px-6 py-3 text-base font-medium"
                  icon={Maximize2}
                />
              </CardContent>
            </Card>

                {/* AI Agent Visualization */}
            <Card className="overflow-hidden border border-[var(--cf-border)]">
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 min-h-[200px] sm:min-h-[360px]" style={{ minHeight: 'min(480px, 50vh)' }}>
                <img
                  src={currentAgent.image}
                  alt={`${currentAgent.name} visualization`}
                  className="w-full sm:w-auto h-full object-cover"
                />
              </div>
            </Card>

            <div>
              <h3 className="text-xs font-semibold text-[var(--cf-muted)] uppercase tracking-wider mb-3">All AI services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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

        {specialChatAgent && (
          <LocalAgentChat
            agent={specialChatAgent}
            onClose={() => setSpecialChatAgent(null)}
          />
        )}
      </div>
    </div>
  );
}