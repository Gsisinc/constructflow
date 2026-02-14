import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Leaf,
  MessageSquare,
  ClipboardCheck,
  Network,
  Sparkles,
  MessageCircle,
  Bot
} from 'lucide-react';
import AgentChat from '../components/agents/AgentChat';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const agents = [
  {
    id: 'central_orchestrator',
    name: 'Central Orchestrator',
    shortName: 'COA',
    icon: Network,
    color: 'from-purple-500 to-indigo-600',
    description: 'Project CEO coordinating all specialist agents',
    capabilities: ['Strategic oversight', 'Agent coordination', 'Decision making', 'Workflow optimization'],
    category: 'core'
  },
  {
    id: 'market_intelligence',
    name: 'Market Intelligence',
    shortName: 'MIA',
    icon: Search,
    color: 'from-blue-500 to-cyan-600',
    description: 'Proactive bid opportunity searcher across 75+ platforms',
    capabilities: ['Bid discovery', 'Supplier qualification', 'Market pricing', 'Win probability'],
    category: 'bidding'
  },
  {
    id: 'bid_package_assembly',
    name: 'Bid Package Assembly',
    shortName: 'BPAA',
    icon: ClipboardCheck,
    color: 'from-cyan-500 to-teal-600',
    description: 'Intelligent document synthesis and pricing optimization',
    capabilities: ['RFP extraction', 'Dynamic pricing', 'Risk adjustment', 'Compliance verification'],
    category: 'bidding'
  },
  {
    id: 'proposal_generation',
    name: 'Proposal Generation',
    shortName: 'PGA',
    icon: FileText,
    color: 'from-teal-500 to-green-600',
    description: 'Client-specific personalized proposals with visual intelligence',
    capabilities: ['Custom proposals', 'Visual content', 'Quality assurance', 'Multi-format output'],
    category: 'bidding'
  },
  {
    id: 'regulatory_intelligence',
    name: 'Regulatory Intelligence',
    shortName: 'RIA',
    icon: Shield,
    color: 'from-indigo-500 to-purple-600',
    description: 'Permit automation and regulatory compliance expert',
    capabilities: ['Permit tracking', 'Regulatory monitoring', 'Compliance automation', 'Agency coordination'],
    category: 'compliance'
  },
  {
    id: 'risk_prediction',
    name: 'Risk Prediction',
    shortName: 'RPA',
    icon: AlertTriangle,
    color: 'from-orange-500 to-red-600',
    description: 'Predicts cost overruns and schedule risks with mitigation strategies',
    capabilities: ['Cost risk analysis', 'Schedule prediction', 'External monitoring', 'Mitigation planning'],
    category: 'operations'
  },
  {
    id: 'quality_assurance',
    name: 'Quality Assurance',
    shortName: 'QAA',
    icon: CheckCircle,
    color: 'from-green-500 to-emerald-600',
    description: 'Automated defect detection and punch list generation',
    capabilities: ['Quality inspection', 'Defect prediction', 'Punch lists', 'Corrective tracking'],
    category: 'operations'
  },
  {
    id: 'safety_compliance',
    name: 'Safety Compliance',
    shortName: 'SCA',
    icon: Shield,
    color: 'from-red-500 to-pink-600',
    description: 'Real-time safety monitoring and training compliance',
    capabilities: ['Safety monitoring', 'Hazard prediction', 'Training tracking', 'Incident management'],
    category: 'operations'
  },
  {
    id: 'sustainability_optimization',
    name: 'Sustainability Optimization',
    shortName: 'SOA',
    icon: Leaf,
    color: 'from-emerald-500 to-green-600',
    description: 'Carbon tracking and green building certification optimization',
    capabilities: ['Carbon footprint', 'Material substitution', 'LEED optimization', 'Lifecycle analysis'],
    category: 'compliance'
  },
  {
    id: 'stakeholder_communication',
    name: 'Stakeholder Communication',
    shortName: 'SCA',
    icon: MessageSquare,
    color: 'from-pink-500 to-rose-600',
    description: 'Personalized communications and relationship management',
    capabilities: ['Custom messaging', 'Technical translation', 'Expectation management', 'Relationship tracking'],
    category: 'operations'
  }
];

export default function AIAgents() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Agents', count: agents.length },
    { id: 'core', name: 'Core', count: agents.filter(a => a.category === 'core').length },
    { id: 'bidding', name: 'Bidding', count: agents.filter(a => a.category === 'bidding').length },
    { id: 'operations', name: 'Operations', count: agents.filter(a => a.category === 'operations').length },
    { id: 'compliance', name: 'Compliance', count: agents.filter(a => a.category === 'compliance').length }
  ];

  const filteredAgents = activeCategory === 'all' 
    ? agents 
    : agents.filter(a => a.category === activeCategory);


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-start gap-2 sm:gap-3 mb-3">
              <div className="p-2 sm:p-3 bg-white/10 backdrop-blur rounded-lg sm:rounded-xl flex-shrink-0">
                <Sparkles className="h-5 w-5 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-3xl font-bold">Nexus Construct AI Agents</h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5 sm:mt-1">Autonomous Project Intelligence Network</p>
              </div>
            </div>
            <p className="text-slate-200 max-w-2xl">
              Multi-agent AI system with specialized agents collaborating to automate complex construction workflows.
              From bid discovery to project closeout, your 24/7 intelligent workforce.
            </p>
          </div>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            {agents.length} Agents Active
          </Badge>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setActiveCategory(cat.id)}
            className="gap-2"
          >
            {cat.name}
            <Badge variant="secondary" className="ml-1">{cat.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {filteredAgents.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${agent.color}`} />
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${agent.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">{agent.shortName}</Badge>
                </div>
                <CardTitle className="text-xl">{agent.name}</CardTitle>
                <CardDescription className="text-sm">{agent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Capabilities */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Key Capabilities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.capabilities.map((cap, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 gap-2"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* How It Works Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-600" />
            How Agent Collaboration Works
          </CardTitle>
          <CardDescription>Example: Low Voltage Bid Automation Pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold">1</div>
              <div>
                <p className="font-semibold">Market Intelligence Agent (MIA)</p>
                <p className="text-sm text-slate-600">Identifies RFP for hospital expansion needing LV work from 75+ platforms</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600 font-bold">2</div>
              <div>
                <p className="font-semibold">Central Orchestrator Agent (COA)</p>
                <p className="text-sm text-slate-600">Assigns Bid Package Assembly Agent to lead and coordinates specialist agents</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-teal-100 rounded-lg text-teal-600 font-bold">3</div>
              <div>
                <p className="font-semibold">Bid Package Assembly Agent (BPAA)</p>
                <p className="text-sm text-slate-600">Requests design specs, regulatory requirements, market pricing, risk assessment, and sustainability options</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg text-green-600 font-bold">4</div>
              <div>
                <p className="font-semibold">Proposal Generation Agent (PGA)</p>
                <p className="text-sm text-slate-600">Creates technical approach, visualizations, pricing, and compliance documentation</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 font-bold">5</div>
              <div>
                <p className="font-semibold">Human Review (15 minutes)</p>
                <p className="text-sm text-slate-600">Quick approval review with AI-prepared comprehensive bid package</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="p-2 bg-green-500 rounded-lg text-white font-bold">✓</div>
              <div>
                <p className="font-semibold text-green-700">Result: Perfect Bid in Hours</p>
                <p className="text-sm text-green-600">40-60% win rate vs. traditional 15-25%, with 90% less effort</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Chat Dialog */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <AgentChat agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}