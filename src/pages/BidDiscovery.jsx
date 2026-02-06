import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Loader2,
  Trash2,
  ListChecks
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
  const [state, setState] = useState('California');
  const [cityCounty, setCityCounty] = useState('');
  const [workType, setWorkType] = useState('low_voltage');
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);
  const queryClient = useQueryClient();

  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const citiesByState = {
    'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Auburn'],
    'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
    'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Tempe', 'Flagstaff'],
    'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'Rogers'],
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Fresno', 'Oakland', 'Long Beach', 'Bakersfield', 'Anaheim', 'Riverside', 'Santa Ana', 'Irvine', 'Stockton', 'Fremont', 'San Bernardino'],
    'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder', 'Pueblo', 'Lakewood'],
    'Connecticut': ['Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury', 'Norwalk'],
    'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'],
    'Florida': ['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'St. Petersburg', 'Fort Lauderdale', 'Tallahassee', 'Cape Coral', 'Port St. Lucie', 'Pembroke Pines', 'Hollywood', 'Gainesville'],
    'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell'],
    'Hawaii': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu', 'Kaneohe'],
    'Idaho': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello', 'Caldwell'],
    'Illinois': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield', 'Peoria', 'Elgin'],
    'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Bloomington'],
    'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo'],
    'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe', 'Lawrence'],
    'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Richmond'],
    'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner'],
    'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford'],
    'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie', 'Annapolis'],
    'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton', 'New Bedford'],
    'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Flint'],
    'Minnesota': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park'],
    'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian'],
    'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit'],
    'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena'],
    'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont'],
    'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City'],
    'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester', 'Dover'],
    'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton', 'Camden', 'Clifton'],
    'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'White Plains'],
    'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington'],
    'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston'],
    'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Canton'],
    'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton', 'Edmond'],
    'Oregon': ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton', 'Bend'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem'],
    'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket'],
    'South Carolina': ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville'],
    'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell'],
    'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro'],
    'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo', 'Lubbock', 'Irving', 'Garland', 'Frisco'],
    'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy'],
    'Vermont': ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier', 'Winooski'],
    'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton'],
    'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton'],
    'West Virginia': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Weirton'],
    'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha'],
    'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan']
  };

  const availableCities = citiesByState[state] || [];

  const { data: opportunities = [] } = useQuery({
    queryKey: ['bidOpportunities'],
    queryFn: async () => {
      const opps = await base44.entities.BidOpportunity.list('-created_date', 200);
      // Sort by due_date (soonest first)
      return opps.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    }
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids'],
    queryFn: () => base44.entities.Bid.list('-created_date', 20)
  });

  // Auto-search on mount and every 5 minutes
  useEffect(() => {
    if (autoSearchEnabled) {
      performAutoSearch();
      const interval = setInterval(performAutoSearch, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoSearchEnabled, workType, state, cityCounty]);

  const performAutoSearch = async () => {
    const query = buildSearchQuery();
    if (query) {
      await executeAISearch(query);
    }
  };

  const executeAISearch = async (query) => {
    setSearching(true);
    try {
      // Use the agent to search and save opportunities directly
      const prompt = `${query}. Search across all major bid websites including SAM.gov, state portals, BidClerk, ConstructConnect, Dodge, and other platforms. Find at least 100 opportunities. For each opportunity found, create a BidOpportunity record with complete details.`;
      
      await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true
      });
      
      // Refresh opportunities list after search
      await queryClient.invalidateQueries({ queryKey: ['bidOpportunities'] });
      toast.success('AI search completed! Check discovered opportunities.');
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const buildSearchQuery = () => {
    const parts = [];
    
    if (workType && workType !== 'all') {
      parts.push(workType);
    }
    
    const location = [];
    if (cityCounty) {
      location.push(cityCounty);
    }
    if (state) {
      location.push(state);
    }
    
    if (location.length > 0) {
      parts.push(`in ${location.join(', ')}`);
    }
    
    parts.push('construction bid opportunities');
    
    return `Find ${parts.join(' ')} posted in the last 7 days`;
  };

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

  const deleteBidMutation = useMutation({
    mutationFn: (bidId) => base44.entities.Bid.delete(bidId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Bid removed from pipeline');
    }
  });

  const updateBidMutation = useMutation({
    mutationFn: ({ bidId, data }) => base44.entities.Bid.update(bidId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    }
  });

  const handleSearch = async () => {
    const query = searchQuery.trim() || buildSearchQuery();
    if (!query) return;
    
    setSearchQuery('');
    await executeAISearch(query);
  };

  const handleAddToPipeline = async (opportunity) => {
    try {
      // Generate checklist from requirements
      const checklist = generateChecklist(opportunity);
      
      await createBidMutation.mutateAsync({
        rfp_name: opportunity.project_name || opportunity.title,
        client_name: opportunity.agency || opportunity.client,
        status: 'draft',
        bid_amount: opportunity.estimated_value || 0,
        due_date: opportunity.due_date,
        win_probability: opportunity.win_probability || 50,
        notes: opportunity.description,
        documents: checklist
      });
      setSelectedBid(null);
    } catch (error) {
      toast.error('Failed to add bid');
    }
  };

  const generateChecklist = (opportunity) => {
    const checklist = [];
    
    // Add requirements as checklist items
    if (opportunity.requirements && opportunity.requirements.length > 0) {
      opportunity.requirements.forEach(req => {
        checklist.push(`☐ ${req}`);
      });
    }
    
    // Add default checklist items
    const defaultItems = [
      '☐ Review project scope and requirements',
      '☐ Gather pricing from suppliers/subcontractors',
      '☐ Prepare technical proposal',
      '☐ Review and verify all certifications',
      '☐ Complete financial proposal',
      '☐ Internal review and approval',
      '☐ Final submission preparation'
    ];
    
    defaultItems.forEach(item => {
      if (!checklist.some(c => c.includes(item.substring(2)))) {
        checklist.push(item);
      }
    });
    
    return checklist;
  };

  const handleDeleteBid = async (bidId) => {
    if (!confirm('Are you sure you want to delete this bid from your pipeline?')) return;
    
    try {
      await deleteBidMutation.mutateAsync(bidId);
    } catch (error) {
      toast.error('Failed to delete bid');
    }
  };

  const handleToggleChecklistItem = async (bid, index) => {
    const updatedDocuments = [...(bid.documents || [])];
    const item = updatedDocuments[index];
    
    // Toggle checkbox
    if (item.startsWith('☐')) {
      updatedDocuments[index] = item.replace('☐', '☑');
    } else {
      updatedDocuments[index] = item.replace('☑', '☐');
    }
    
    try {
      await updateBidMutation.mutateAsync({
        bidId: bid.id,
        data: { documents: updatedDocuments }
      });
    } catch (error) {
      toast.error('Failed to update checklist');
    }
  };

  const [analysisPrompt, setAnalysisPrompt] = useState(null);

  const handleAnalyzeBid = (bid) => {
    const formatDate = (dateStr) => {
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? dateStr : format(date, 'MMMM d, yyyy');
      } catch {
        return dateStr;
      }
    };

    const prompt = `Please provide a comprehensive analysis of this bid opportunity:

**Project:** ${bid.title || bid.project_name}
**Agency:** ${bid.agency || bid.client_name}
**Location:** ${bid.location || 'Not specified'}
**Value:** $${bid.estimated_value?.toLocaleString() || 'TBD'}
**Due Date:** ${bid.due_date ? formatDate(bid.due_date) : 'Not specified'}
**Source:** ${bid.url || 'N/A'}

Please analyze and provide:
1. Detailed scope and requirements
2. Key contact information
3. Important dates and milestones
4. Required documents and attachments
5. Potential challenges and risks
6. Win probability assessment
7. Recommendation on whether to bid`;

    setAnalysisPrompt(prompt);
    setSelectedBid(null);
    setShowAgentChat(true);
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
    const [expanded, setExpanded] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    
    const statusColors = {
      active: 'bg-green-100 text-green-700',
      upcoming: 'bg-blue-100 text-blue-700',
      closing_soon: 'bg-orange-100 text-orange-700'
    };

    const handleAnalyze = async () => {
      if (!expanded && !analysis) {
        setExpanded(true);
        setAnalyzing(true);
        
        const formatDate = (dateStr) => {
          try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? dateStr : format(date, 'MMMM d, yyyy');
          } catch {
            return dateStr;
          }
        };

        const analysisPrompt = `Analyze this bid opportunity and provide a detailed assessment:

**Project:** ${bid.title || bid.project_name}
**Agency:** ${bid.agency || bid.client_name}
**Location:** ${bid.location || 'Not specified'}
**Value:** $${bid.estimated_value?.toLocaleString() || 'TBD'}
**Due Date:** ${bid.due_date ? formatDate(bid.due_date) : 'Not specified'}

Provide:
1. Feasibility Assessment (High/Medium/Low)
2. Key Requirements & Scope
3. Risk Factors
4. Win Probability & Reasoning
5. Recommendation (Bid/No Bid)`;

        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            add_context_from_internet: false
          });
          setAnalysis(response);
        } catch (error) {
          setAnalysis('Failed to generate analysis. Please try again.');
        } finally {
          setAnalyzing(false);
        }
      } else {
        setExpanded(!expanded);
      }
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
                  <span>
                    {(() => {
                      try {
                        const date = new Date(bid.due_date);
                        return isNaN(date.getTime()) ? bid.due_date : format(date, 'MMM d, yyyy');
                      } catch {
                        return bid.due_date;
                      }
                    })()}
                  </span>
                </div>
              )}
              {bid.location && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{bid.location}</span>
                </div>
              )}
            </div>
            
            {bid.description && !expanded && (
              <p className="text-sm text-slate-600 line-clamp-3">{bid.description}</p>
            )}

            {expanded && (
              <div className="space-y-3 pt-2 border-t">
                {bid.description && (
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Description:</p>
                    <p className="text-sm text-slate-600">{bid.description}</p>
                  </div>
                )}
                
                {analyzing ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-600">Generating AI analysis...</p>
                  </div>
                ) : analysis ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Analysis
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{analysis}</p>
                  </div>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
                {expanded ? 'Hide Analysis' : 'AI Analysis'}
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
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              className="gap-2"
              onClick={() => {
                setAnalysisPrompt(null);
                setShowAgentChat(true);
              }}
            >
              <Bot className="h-4 w-4" />
              Chat with Agent
            </Button>
          </div>
        </div>

        {/* Search Filters & Bar */}
        <div className="mt-6 space-y-3">
          <div className="flex gap-3">
            <Select value={workType} onValueChange={setWorkType}>
              <SelectTrigger className="w-[220px] bg-white text-slate-900 h-12">
                <SelectValue placeholder="Type of Work" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="low_voltage">Low Voltage</SelectItem>
                <SelectItem value="data_cabling">Data Cabling</SelectItem>
                <SelectItem value="security_systems">Security Systems</SelectItem>
                <SelectItem value="av_systems">AV Systems</SelectItem>
                <SelectItem value="fiber_optic">Fiber Optic</SelectItem>
                <SelectItem value="access_control">Access Control</SelectItem>
                <SelectItem value="fire_alarm">Fire Alarm</SelectItem>
                <SelectItem value="telecommunications">Telecommunications</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="concrete">Concrete</SelectItem>
                <SelectItem value="masonry">Masonry</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="framing">Framing</SelectItem>
                <SelectItem value="drywall">Drywall</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="flooring">Flooring</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="excavation">Excavation</SelectItem>
                <SelectItem value="sitework">Sitework</SelectItem>
                <SelectItem value="demolition">Demolition</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="asbestos_abatement">Asbestos Abatement</SelectItem>
                <SelectItem value="general_contractor">General Contractor</SelectItem>
                <SelectItem value="design_build">Design-Build</SelectItem>
                <SelectItem value="construction_management">Construction Management</SelectItem>
              </SelectContent>
            </Select>

            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-[200px] bg-white text-slate-900 h-12">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {states.map(st => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityCounty} onValueChange={setCityCounty}>
              <SelectTrigger className="w-[250px] bg-white text-slate-900 h-12">
                <SelectValue placeholder={`City in ${state} (optional)`} />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                <SelectItem value={null}>All Cities</SelectItem>
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={autoSearchEnabled ? "default" : "outline"}
              onClick={() => setAutoSearchEnabled(!autoSearchEnabled)}
              className={`gap-2 ${autoSearchEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-white text-slate-900'}`}
            >
              <Sparkles className="h-4 w-4" />
              {autoSearchEnabled ? 'Auto-Search ON' : 'Enable Auto-Search'}
            </Button>
          </div>

          {/* Recommended Search Display */}
          <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 mb-2">
            <p className="text-xs text-blue-100 mb-1">Recommended Search:</p>
            <p className="text-white text-sm font-medium">{buildSearchQuery()}</p>
          </div>

          <div className="flex gap-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Or enter custom search: 'low voltage hospital projects California' or 'HVAC commercial bids Texas'..."
              className="flex-1 bg-white text-slate-900 h-12"
            />
            <Button 
              size="lg"
              onClick={handleSearch}
              disabled={searching}
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
                      <div className="flex items-center gap-2">
                        <Badge>{bid.status}</Badge>
                        {bid.documents && bid.documents.length > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <ListChecks className="h-3 w-3" />
                            {bid.documents.filter(d => d.startsWith('☑')).length}/{bid.documents.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
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
                              <span className="font-medium">
                                {(() => {
                                  try {
                                    const date = new Date(bid.due_date);
                                    return isNaN(date.getTime()) ? bid.due_date : format(date, 'MMM d, yyyy');
                                  } catch {
                                    return bid.due_date;
                                  }
                                })()}
                              </span>
                            </div>
                          )}
                          {bid.win_probability && (
                            <div>
                              <span className="text-slate-500">Win Rate: </span>
                              <span className="font-medium text-green-600">{bid.win_probability}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedBid(bid)}>
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteBid(bid.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Checklist */}
                      {bid.documents && bid.documents.length > 0 && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <ListChecks className="h-4 w-4" />
                            Bid Requirements Checklist
                          </p>
                          <div className="space-y-1.5">
                            {bid.documents.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleToggleChecklistItem(bid, idx)}
                                className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 transition-colors text-sm flex items-start gap-2"
                              >
                                <span className={item.startsWith('☑') ? 'text-green-600' : 'text-slate-400'}>
                                  {item.startsWith('☑') ? '☑' : '☐'}
                                </span>
                                <span className={item.startsWith('☑') ? 'line-through text-slate-400' : 'text-slate-700'}>
                                  {item.substring(2)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
        <Dialog open={showAgentChat} onOpenChange={(open) => {
          if (!open) {
            setShowAgentChat(false);
            setSearching(false);
            setAnalysisPrompt(null);
          }
        }}>
          <DialogContent className="max-w-4xl h-[85vh] p-0">
            <AgentChat 
              key={analysisPrompt || 'chat'}
              agent={marketIntelligenceAgent}
              initialPrompt={analysisPrompt}
              onClose={() => {
                setShowAgentChat(false);
                setSearching(false);
                setAnalysisPrompt(null);
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
                    <p className="font-medium">
                      {(() => {
                        try {
                          const date = new Date(selectedBid.due_date);
                          return isNaN(date.getTime()) ? selectedBid.due_date : format(date, 'MMMM d, yyyy');
                        } catch {
                          return selectedBid.due_date;
                        }
                      })()}
                    </p>
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