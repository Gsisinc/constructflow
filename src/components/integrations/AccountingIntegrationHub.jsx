import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Clock, Settings, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AccountingIntegrationHub() {
  const [integrations, setIntegrations] = useState({
    quickbooksOnline: { enabled: false, connected: false, syncFrequency: 'hourly', lastSync: null },
    quickbooksDesktop: { enabled: false, connected: false, syncFrequency: 'daily', lastSync: null },
    xero: { enabled: false, connected: false, syncFrequency: 'hourly', lastSync: null },
    sage: { enabled: false, connected: false, syncFrequency: 'daily', lastSync: null },
  });

  const [syncStatus, setSyncStatus] = useState({});
  const [selectedIntegration, setSelectedIntegration] = useState('quickbooksOnline');

  const accountingPlatforms = [
    {
      id: 'quickbooksOnline',
      name: 'QuickBooks Online',
      description: 'Cloud-based accounting for small to mid-size businesses',
      features: ['Real-time sync', 'Invoice management', 'Expense tracking', 'Bank connections'],
      status: 'available',
      priority: 'critical',
    },
    {
      id: 'quickbooksDesktop',
      name: 'QuickBooks Desktop',
      description: 'Traditional desktop accounting software',
      features: ['Periodic sync', 'Job costing', 'Invoice management', 'Financial reporting'],
      status: 'available',
      priority: 'critical',
    },
    {
      id: 'xero',
      name: 'Xero',
      description: 'Cloud accounting software with advanced features',
      features: ['Real-time sync', 'Multi-currency', 'Advanced reporting', 'Integration APIs'],
      status: 'available',
      priority: 'critical',
    },
    {
      id: 'sage',
      name: 'Sage 100/300',
      description: 'Enterprise accounting for larger organizations',
      features: ['Job costing', 'Advanced reporting', 'Multi-entity support', 'Compliance tracking'],
      status: 'available',
      priority: 'critical',
    },
  ];

  const syncFeatures = [
    {
      name: 'Invoice Auto-Sync',
      description: 'Automatically sync invoices from projects to accounting system',
      enabled: true,
      icon: '📄',
    },
    {
      name: 'Expense Tracking',
      description: 'Track project expenses and sync to accounting',
      enabled: true,
      icon: '💰',
    },
    {
      name: 'Job Costing Integration',
      description: 'Integrate project costs with job costing in accounting',
      enabled: false,
      icon: '📊',
    },
    {
      name: 'Purchase Order Sync',
      description: 'Sync POs to accounting system for procurement tracking',
      enabled: false,
      icon: '📦',
    },
    {
      name: 'Payment Reconciliation',
      description: 'Automatic matching of payments to invoices',
      enabled: false,
      icon: '✓',
    },
    {
      name: 'Financial Reporting',
      description: 'Real-time financial dashboards and reports',
      enabled: false,
      icon: '📈',
    },
  ];

  const handleConnect = (integrationId) => {
    // Simulate OAuth connection
    setIntegrations(prev => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        connected: !prev[integrationId].connected,
        lastSync: new Date().toISOString(),
      },
    }));
  };

  const handleToggleSync = (integrationId) => {
    setIntegrations(prev => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        enabled: !prev[integrationId].enabled,
      },
    }));
  };

  const handleFrequencyChange = (integrationId, frequency) => {
    setIntegrations(prev => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        syncFrequency: frequency,
      },
    }));
  };

  const triggerManualSync = (integrationId) => {
    setSyncStatus(prev => ({
      ...prev,
      [integrationId]: 'syncing',
    }));

    // Simulate sync
    setTimeout(() => {
      setIntegrations(prev => ({
        ...prev,
        [integrationId]: {
          ...prev[integrationId],
          lastSync: new Date().toISOString(),
        },
      }));
      setSyncStatus(prev => ({
        ...prev,
        [integrationId]: 'success',
      }));

      setTimeout(() => {
        setSyncStatus(prev => ({
          ...prev,
          [integrationId]: null,
        }));
      }, 3000);
    }, 2000);
  };

  const getPlatform = (id) => accountingPlatforms.find(p => p.id === id);
  const platform = getPlatform(selectedIntegration);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Accounting Integration Hub</h1>
        <p className="text-gray-600 mt-2">
          Connect your construction projects with your accounting software for seamless financial management.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Integrations</TabsTrigger>
          <TabsTrigger value="sync">Sync Configuration</TabsTrigger>
          <TabsTrigger value="features">Sync Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accountingPlatforms.map(platform => (
              <Card
                key={platform.id}
                className={`cursor-pointer transition-all ${
                  selectedIntegration === platform.id
                    ? 'ring-2 ring-blue-500'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedIntegration(platform.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                    {integrations[platform.id]?.connected ? (
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    ) : (
                      <Badge variant="outline">Disconnected</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Features:</h4>
                    <ul className="space-y-1">
                      {platform.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">✓</span>{feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(platform.id);
                      }}
                      variant={integrations[platform.id]?.connected ? 'outline' : 'default'}
                      className="flex-1"
                    >
                      {integrations[platform.id]?.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                    {integrations[platform.id]?.connected && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerManualSync(platform.id);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        {syncStatus[platform.id] === 'syncing' ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          {accountingPlatforms.map(platform => (
            <Card key={platform.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {platform.name}
                  {integrations[platform.id]?.connected ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <AlertCircle className="text-yellow-600" size={20} />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Sync Status</label>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={integrations[platform.id]?.enabled || false}
                        onCheckedChange={() => handleToggleSync(platform.id)}
                      />
                      <span className="text-sm">
                        {integrations[platform.id]?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sync Frequency</label>
                    <Select
                      value={integrations[platform.id]?.syncFrequency || 'hourly'}
                      onValueChange={(value) => handleFrequencyChange(platform.id, value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Sync</label>
                    <div className="mt-2 text-sm">
                      {integrations[platform.id]?.lastSync ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-600" />
                          {new Date(integrations[platform.id].lastSync).toLocaleString()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock size={16} />
                          Never synced
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Features Status</CardTitle>
              <CardDescription>
                Current state of accounting synchronization features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {syncFeatures.map((feature, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-2xl mb-2">{feature.icon}</div>
                          <h3 className="font-semibold">{feature.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                        </div>
                        <Badge className={feature.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {feature.enabled ? 'Active' : 'Planned'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
