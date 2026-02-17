import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, MapPin, DollarSign, Calendar, AlertCircle } from 'lucide-react';

export default function BidDiscoveryMobile() {
  const [samGovKey, setSamGovKey] = useState(localStorage.getItem('sam_gov_api_key') || '');
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [minBudget, setMinBudget] = useState('');

  const fetchBids = async () => {
    if (!samGovKey) {
      alert('Please configure SAM.gov API key in AI Agents settings');
      return;
    }

    setLoading(true);
    try {
      // Mock data for demonstration
      const mockBids = [
        {
          id: 1,
          title: 'Commercial Building Renovation - California',
          location: searchLocation || 'California',
          budget: '$2.5M - $3.5M',
          type: 'General Construction',
          deadline: '2026-03-15',
          source: 'SAM.gov',
          agency: 'GSA'
        },
        {
          id: 2,
          title: 'HVAC System Installation',
          location: searchLocation || 'California',
          budget: '$150K - $250K',
          type: 'HVAC',
          deadline: '2026-03-20',
          source: 'SAM.gov',
          agency: 'Federal'
        },
        {
          id: 3,
          title: 'Infrastructure Repair Project',
          location: searchLocation || 'California',
          budget: '$1M - $2M',
          type: 'Infrastructure',
          deadline: '2026-03-25',
          source: 'SAM.gov',
          agency: 'State'
        }
      ];

      setBids(mockBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      alert('Error fetching bids. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bid Discovery</h1>
        <p className="text-gray-600 text-sm">Find and track construction bid opportunities</p>
      </div>

      {!samGovKey && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            API key not configured. Go to AI Agents to set up SAM.gov API access.
          </AlertDescription>
        </Alert>
      )}

      {/* Search Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search Bids</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="State or city"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Work Type</label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full mt-1 text-sm p-2 border rounded"
            >
              <option value="">All Types</option>
              <option value="general">General Construction</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
              <option value="plumbing">Plumbing</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Min Budget</label>
            <Input
              type="number"
              placeholder="$ amount"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <Button
            onClick={fetchBids}
            disabled={loading || !samGovKey}
            className="w-full text-sm"
          >
            {loading ? 'Searching...' : 'Search Bids'}
          </Button>
        </CardContent>
      </Card>

      {/* Bids List */}
      <div className="space-y-3">
        {bids.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500 text-sm">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click search to find available bids</p>
            </CardContent>
          </Card>
        ) : (
          bids.map((bid) => (
            <Card key={bid.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm">{bid.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{bid.source}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-500" />
                      <span>{bid.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-500" />
                      <span>{bid.budget}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span>{bid.deadline}</span>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">
                      {bid.type}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
