import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AIAgents() {
  const [activeTab, setActiveTab] = useState('deepseek');
  const [selectedAgent, setSelectedAgent] = useState(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            🤖 AI Agents Hub
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Access AI services and custom construction agents
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          <button
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
          <div>
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">⚙️ Custom Agents</h2>
              <p className="text-white/80 text-sm mt-1">ConstructFlow AI agents for construction management</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{agent.icon}</span>
                      {agent.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{agent.desc}</p>
                    <Button
                      className={`w-full ${selectedAgent === agent.id ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                      onClick={(e) => { e.stopPropagation(); setSelectedAgent(selectedAgent === agent.id ? null : agent.id); }}
                    >
                      {selectedAgent === agent.id ? '✓ Selected' : 'Use Agent →'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero launch card */}
            <div className={`rounded-2xl bg-gradient-to-br ${currentAgent.color} text-white shadow-xl overflow-hidden`}>
              <div className="flex flex-col md:flex-row items-center gap-6 p-8">
                <div className="text-7xl">{currentAgent.icon}</div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-1">{currentAgent.name}</h2>
                  <p className="text-white/80 text-base mb-4">{currentAgent.desc}</p>
                  <a
                    href={currentAgent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg text-base"
                  >
                    🚀 Open {currentAgent.name} <span className="text-slate-400">↗</span>
                  </a>
                </div>
              </div>
              <div className="bg-black/20 px-8 py-3 text-white/60 text-xs">
                ⚠️ These AI services enforce security policies that prevent embedding — clicking the button opens them in a new tab for the best experience.
              </div>
            </div>

            {/* All AI services grid */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">All AI Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(agents).map(([key, agent]) => (
                  <a
                    key={key}
                    href={agent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${agent.color} text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${activeTab === key ? 'ring-4 ring-white/50' : ''}`}
                  >
                    <span className="text-2xl">{agent.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-white/70 text-xs">{agent.desc}</p>
                    </div>
                    <span className="text-white/70 text-lg">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}