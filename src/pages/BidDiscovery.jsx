import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrowserProxy from '../components/BrowserProxy';
import { Search, FileText, DollarSign, Calendar, MapPin, Building2, TrendingUp, Plus } from 'lucide-react';

export default function BidDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBid, setSelectedBid] = useState(null);
  const [bids, setBids] = useState([
    {
      id: 1,
      title: 'Fire Alarm System Installation',
      agency: 'California Department of Transportation',
      amount: '$150,000 - $200,000',
      deadline: '2026-03-15',
      location: 'Los Angeles, CA',
      description: 'Installation of fire alarm systems for state facilities'
    },
    {
      id: 2,
      title: 'CCTV Surveillance Network',
      agency: 'City of San Francisco',
      amount: '$75,000 - $100,000',
      deadline: '2026-03-20',
      location: 'San Francisco, CA',
      description: 'CCTV surveillance system upgrade for municipal buildings'
    },
    {
      id: 3,
      title: 'Access Control System',
      agency: 'County of Santa Clara',
      amount: '$50,000 - $75,000',
      deadline: '2026-03-25',
      location: 'San Jose, CA',
      description: 'Modern access control system installation'
    }
  ]);

  const filteredBids = bids.filter(bid =>
    bid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bid.agency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Bid Discovery</h1>
          <p className="text-slate-600 mt-1">Find and track construction and security system bids</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Bid Manually
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="browser" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browser">Web Browser</TabsTrigger>
          <TabsTrigger value="bids">Available Bids</TabsTrigger>
        </TabsList>

        {/* Browser Tab */}
        <TabsContent value="browser" className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-accent" />
                Bid Discovery Browser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                <BrowserProxy />
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Popular Bid Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    // This would navigate in the browser
                    const event = new CustomEvent('navigate-url', { detail: 'sam.gov' });
                    window.dispatchEvent(event);
                  }}
                >
                  <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">SAM.gov</div>
                    <div className="text-xs text-slate-600">Federal opportunities</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    const event = new CustomEvent('navigate-url', { detail: 'sfgov.org' });
                    window.dispatchEvent(event);
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">SF.gov</div>
                    <div className="text-xs text-slate-600">San Francisco bids</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    const event = new CustomEvent('navigate-url', { detail: 'caltrans.ca.gov' });
                    window.dispatchEvent(event);
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Caltrans</div>
                    <div className="text-xs text-slate-600">California transportation</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bids Tab */}
        <TabsContent value="bids" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search bids by title or agency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bids Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBids.map(bid => (
              <Card key={bid.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedBid(bid)}>
                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">{bid.title}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{bid.agency}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="font-semibold">{bid.amount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span>Due: {new Date(bid.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span>{bid.location}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{bid.description}</p>
                  <div className="flex gap-2 pt-2">
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                    <Badge variant="outline" className="text-xs">New</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBids.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No bids found matching your search</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bid Detail Modal */}
      {selectedBid && (
        <Card className="border-accent border-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{selectedBid.title}</CardTitle>
              <p className="text-sm text-slate-600 mt-1">{selectedBid.agency}</p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedBid(null)}>✕</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600 font-semibold">Budget</p>
                <p className="text-lg font-bold text-green-600">{selectedBid.amount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-semibold">Deadline</p>
                <p className="text-lg font-bold text-orange-600">{new Date(selectedBid.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-semibold">Location</p>
                <p className="text-lg font-bold">{selectedBid.location}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-semibold">Status</p>
                <Badge className="mt-1">Active</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Description</p>
              <p className="text-sm text-slate-700">{selectedBid.description}</p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button className="bg-accent hover:bg-accent/90">View Full Details</Button>
              <Button variant="outline">Save Bid</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
