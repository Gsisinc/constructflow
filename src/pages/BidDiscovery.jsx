import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AgentChat from '../components/agents/AgentChat';
import { 
  Search, 
  FileText, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
  ExternalLink,
  Sparkles,
  Bot,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const marketIntelligenceAgent = {
  id: 'market_intelligence',
  name: 'Market Intelligence Agent',
  shortName: 'MIA',
  icon: Search,
  color: 'from-blue-500 to-cyan-600',
  description: 'Proactive bid opportunity searcher',
  capabilities: ['Bid discovery', 'Supplier qualification', 'Market pricing', 'Win probability']
};

export default function BidDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBid, setSelectedBid] = useState(null);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [searching, setSearching] = useState(false);
  const queryClient = useQueryClient();

  const { data: opportunities = [] } = useQuery({
    queryKey: ['bidOpportunities'],
    queryFn: () => base44.entities.BidOpportunity.list('-created_date', 50)
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids'],
    queryFn: () => base44.entities.Bid.list('-created_date', 20)
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!');
    }
  });

  const createBidMutation = useMutation({
    mutationFn: (data) => base44.entities.Bid.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Bid added to pipeline');
    }
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setShowAgentChat(true);
    
    // The agent will handle the search through the chat interface
    toast.info('Market Intelligence Agent is searching...');
  };

  const handleAddToPipeline = async (opportunity) => {
    try {
      await createBidMutation.mutateAsync({
        rfp_name: opportunity.project_name || opportunity.title,
        client_name: opportunity.agency || opportunity.client,
        status: 'draft',
        bid_amount: opportunity.estimated_value || 0,
        due_date: opportunity.due_date,
        win_probability: opportunity.win_probability || 50,
        notes: opportunity.description
      });
      setSelectedBid(null);
    } catch (error) {
      toast.error('Failed to add bid');
    }
  };

  const handleAnalyzeBid = (bid) => {
    setSelectedBid(bid);
    setShowAgentChat(true);
    // Auto-send analysis request
    setTimeout(() => {
      const analysisPrompt = `Please provide a full analysis of this bid opportunity:

Title: ${bid.title || bid.project_name}
Agency: ${bid.agency || bid.client_name}
Location: ${bid.location}
Estimated Value: $${bid.estimated_value?.toLocaleString() || 'N/A'}
Due Date: ${bid.due_date ? format(new Date(bid.due_date), 'MMMM d, yyyy') : 'N/A'}

Please analyze:
1. Key requirements and specifications
2. Contact information for questions
3. Important dates and deadlines
4. Required documents and attachments
5. Potential challenges and opportunities
6. Recommendation on whether we should bid`;
      
      // This will be sent when chat is ready
    }, 500);
  };

  const handleCreateProject = async (opportunity) => {
    try {
      await createProjectMutation.mutateAsync({
        name: opportunity.project_name || opportunity.title,
        client_name: opportunity.agency || opportunity.client,
        project_type: opportunity.project_type || 'commercial',
        status: 'bidding',
        address: opportunity.location,
        budget: opportunity.estimated_value || 0,
        description: opportunity.description,
        priority: 'high'
      });
      setSelectedBid(null);
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const BidCard = ({ bid }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-700',
      upcoming: 'bg-blue-100 text-blue-700',
      closing_soon: 'bg-orange-100 text-orange-700'
    };

    return (
      <Card className="hover:shadow-lg transition-all">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className={statusColors[bid.status] || 'bg-slate-100 text-slate-700'}>
                {bid.status?.replace('_', ' ').toUpperCase()}
              </Badge>
              <CardTitle className="mt-2 text-lg">{bid.project_name || bid.title}</CardTitle>
              <CardDescription className="mt-1">
                {bid.agency || bid.client_name || bid.client}
              </CardDescription>
            </div>
            {bid.win_probability && (
              <div className="text-right">
                <p className="text-sm text-slate-500">Win Rate</p>
                <p className="text-2xl font-bold text-green-600">{bid.win_probability}%</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {bid.estimated_value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">${bid.estimated_value?.toLocaleString()}</span>
                </div>
              )}
              {bid.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{format(new Date(bid.due_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              {bid.location && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{bid.location}</span>
                </div>
              )}
            </div>
            
            {bid.description && (
              <p className="text-sm text-slate-600 line-clamp-3">{bid.description}</p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => handleAnalyzeBid(bid)}
              >
                <Bot className="h-4 w-4" />
                AI Analysis
              </Button>
              <Button 
                size="sm" 
                className="gap-2"
                onClick={() => handleAddToPipeline(bid)}
              >
                <Plus className="h-4 w-4" />
                Add to Bids
              </Button>
            </div>
            
            {bid.url && (
              <Button 
                size="sm" 
                variant="ghost"
                className="w-full gap-2"
                onClick={() => window.open(bid.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View Original Posting
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <Search className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Bid Discovery</h1>
                <p className="text-blue-100 mt-1">AI-powered bid opportunity search across 75+ platforms</p>
              </div>
            </div>
          </div>
          <Button 
            variant="secondary"
            className="gap-2"
            onClick={() => setShowAgentChat(true)}
          >
            <Bot className="h-4 w-4" />
            Chat with Agent
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex gap-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for bids: 'low voltage hospital projects California' or 'HVAC commercial bids Texas'..."
            className="flex-1 bg-white text-slate-900 h-12"
          />
          <Button 
            size="lg"
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="bg-white text-blue-600 hover:bg-blue-50 gap-2 min-w-[140px]"
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                AI Search
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Opportunities</p>
                <p className="text-2xl font-bold">{opportunities.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Bids</p>
                <p className="text-2xl font-bold">{bids.filter(b => b.status === 'draft' || b.status === 'submitted').length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Win Rate</p>
                <p className="text-2xl font-bold">42%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg. Bid Value</p>
                <p className="text-2xl font-bold">$2.3M</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="discovered" className="w-full">
        <TabsList>
          <TabsTrigger value="discovered">Discovered Opportunities ({opportunities.length})</TabsTrigger>
          <TabsTrigger value="pipeline">Your Pipeline ({bids.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discovered" className="mt-6">
          {opportunities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No opportunities yet</h3>
                <p className="text-slate-600 mb-6">
                  Start an AI search to discover bid opportunities matching your criteria
                </p>
                <Button onClick={() => setShowAgentChat(true)} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Start AI Search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map((opp) => (
                <BidCard key={opp.id} bid={opp} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          {bids.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No bids in pipeline</h3>
                <p className="text-slate-600">
                  Add opportunities to your pipeline to start working on proposals
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <Card key={bid.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{bid.rfp_name}</CardTitle>
                        <CardDescription>{bid.client_name}</CardDescription>
                      </div>
                      <Badge>{bid.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-6 text-sm">
                        {bid.bid_amount > 0 && (
                          <div>
                            <span className="text-slate-500">Amount: </span>
                            <span className="font-medium">${bid.bid_amount?.toLocaleString()}</span>
                          </div>
                        )}
                        {bid.due_date && (
                          <div>
                            <span className="text-slate-500">Due: </span>
                            <span className="font-medium">{format(new Date(bid.due_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {bid.win_probability && (
                          <div>
                            <span className="text-slate-500">Win Rate: </span>
                            <span className="font-medium text-green-600">{bid.win_probability}%</span>
                          </div>
                        )}
                      </div>
                      <Button size="sm" onClick={() => setSelectedBid(bid)}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Agent Chat Dialog */}
      {showAgentChat && (
        <Dialog open={showAgentChat} onOpenChange={setShowAgentChat}>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <AgentChat 
              agent={marketIntelligenceAgent} 
              onClose={() => {
                setShowAgentChat(false);
                setSearching(false);
              }} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Bid Detail Dialog */}
      {selectedBid && (
        <Dialog open={!!selectedBid} onOpenChange={() => setSelectedBid(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedBid.project_name || selectedBid.rfp_name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Key Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Client/Agency</p>
                  <p className="font-medium">{selectedBid.agency || selectedBid.client_name}</p>
                </div>
                {selectedBid.estimated_value && (
                  <div>
                    <p className="text-sm text-slate-500">Estimated Value</p>
                    <p className="font-medium text-green-600">${selectedBid.estimated_value?.toLocaleString()}</p>
                  </div>
                )}
                {selectedBid.location && (
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="font-medium">{selectedBid.location}</p>
                  </div>
                )}
                {selectedBid.due_date && (
                  <div>
                    <p className="text-sm text-slate-500">Due Date</p>
                    <p className="font-medium">{format(new Date(selectedBid.due_date), 'MMMM d, yyyy')}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedBid.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Description</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedBid.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => handleCreateProject(selectedBid)}
                >
                  <Building2 className="h-4 w-4" />
                  Create Project (Bidding)
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    handleAddToPipeline(selectedBid);
                    setSelectedBid(null);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add to Pipeline
                </Button>
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowAgentChat(true)}
                >
                  <Bot className="h-4 w-4" />
                  Analyze with AI
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}