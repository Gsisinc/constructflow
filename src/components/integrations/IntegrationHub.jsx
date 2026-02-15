import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Link2, CheckCircle, AlertCircle, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationHub() {
  const [integrations, setIntegrations] = useState([]);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [webhooks, setWebhooks] = useState([]);
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'zapier',
    status: 'inactive',
    apiKey: '',
    settings: {}
  });

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [],
    active: true
  });

  const integrationTypes = [
    {
      name: 'Zapier',
      description: 'Connect to 1000+ apps',
      icon: '⚡',
      type: 'zapier'
    },
    {
      name: 'DocuSign',
      description: 'E-signatures on contracts',
      icon: '📝',
      type: 'docusign'
    },
    {
      name: 'Microsoft Project',
      description: 'Desktop project management',
      icon: '📊',
      type: 'ms-project'
    },
    {
      name: 'Google Drive',
      description: 'Cloud file management',
      icon: '☁️',
      type: 'google-drive'
    },
    {
      name: 'Slack',
      description: 'Team communication',
      icon: '💬',
      type: 'slack'
    },
    {
      name: 'Email Parser',
      description: 'Auto-create tasks from emails',
      icon: '📧',
      type: 'email-parser'
    }
  ];

  const eventTypes = [
    'project.created',
    'project.updated',
    'task.completed',
    'estimate.created',
    'bid.submitted',
    'payment.received',
    'invoice.created'
  ];

  const connectIntegration = (type) => {
    if (!newIntegration.apiKey && type !== 'email-parser') {
      toast.error(`Please provide API key for ${type}`);
      return;
    }

    setIntegrations([...integrations, {
      ...newIntegration,
      id: Date.now(),
      type,
      connectedDate: new Date().toISOString().split('T')[0],
      status: 'active'
    }]);

    setNewIntegration({
      name: '',
      type: 'zapier',
      status: 'inactive',
      apiKey: '',
      settings: {}
    });

    toast.success(`${type} connected successfully`);
  };

  const addWebhook = () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast.error('Please fill all webhook fields');
      return;
    }

    setWebhooks([...webhooks, {
      ...newWebhook,
      id: Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
      lastTriggered: null
    }]);

    setNewWebhook({
      name: '',
      url: '',
      events: [],
      active: true
    });

    setShowAddWebhook(false);
    toast.success('Webhook created');
  };

  const toggleIntegration = (id) => {
    setIntegrations(integrations.map(i =>
      i.id === id ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' } : i
    ));
  };

  const deleteIntegration = (id) => {
    setIntegrations(integrations.filter(i => i.id !== id));
    toast.success('Integration removed');
  };

  const deleteWebhook = (id) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast.success('Webhook deleted');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Integration Hub</h2>

      {/* Active Integrations Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Connected Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{integrations.filter(i => i.status === 'active').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{webhooks.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Automations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{integrations.length + webhooks.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrationTypes.map(intType => {
              const isConnected = integrations.some(i => i.type === intType.type && i.status === 'active');
              return (
                <div
                  key={intType.type}
                  className={`border rounded-lg p-4 ${isConnected ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-3xl">{intType.icon}</div>
                    {isConnected && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>

                  <h3 className="font-bold text-sm">{intType.name}</h3>
                  <p className="text-xs text-slate-600 mb-3">{intType.description}</p>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant={isConnected ? 'outline' : 'default'}
                        className="w-full"
                      >
                        {isConnected ? 'Configured' : 'Connect'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Connect {intType.name}</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        {intType.type === 'zapier' && (
                          <>
                            <Input
                              placeholder="Zapier API Key"
                              value={newIntegration.apiKey}
                              onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
                            />
                            <p className="text-xs text-slate-600">
                              Get your API key from https://zapier.com/app/settings/api
                            </p>
                          </>
                        )}

                        {intType.type === 'docusign' && (
                          <>
                            <Input
                              placeholder="DocuSign API Key"
                              value={newIntegration.apiKey}
                              onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
                            />
                            <Input
                              placeholder="Account ID"
                              onChange={(e) => setNewIntegration({
                                ...newIntegration,
                                settings: { ...newIntegration.settings, accountId: e.target.value }
                              })}
                            />
                          </>
                        )}

                        {intType.type === 'slack' && (
                          <>
                            <Input
                              placeholder="Slack Bot Token"
                              value={newIntegration.apiKey}
                              onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
                            />
                            <Input
                              placeholder="Channel name (e.g., #projects)"
                              onChange={(e) => setNewIntegration({
                                ...newIntegration,
                                settings: { ...newIntegration.settings, channel: e.target.value }
                              })}
                            />
                          </>
                        )}

                        {intType.type === 'google-drive' && (
                          <>
                            <Input
                              placeholder="Google OAuth Token"
                              value={newIntegration.apiKey}
                              onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
                            />
                            <Input
                              placeholder="Default folder ID"
                              onChange={(e) => setNewIntegration({
                                ...newIntegration,
                                settings: { ...newIntegration.settings, folderId: e.target.value }
                              })}
                            />
                          </>
                        )}

                        {intType.type === 'email-parser' && (
                          <>
                            <Input
                              placeholder="Email address to monitor"
                              onChange={(e) => setNewIntegration({
                                ...newIntegration,
                                settings: { ...newIntegration.settings, emailAddress: e.target.value }
                              })}
                            />
                            <div>
                              <label className="text-sm font-medium">Auto-create tasks from emails</label>
                              <input type="checkbox" defaultChecked className="mt-2" />
                            </div>
                          </>
                        )}

                        <Button
                          onClick={() => connectIntegration(intType.type)}
                          className="w-full"
                        >
                          Connect {intType.name}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Services ({integrations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.map(integration => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{integration.type.toUpperCase()}</p>
                    <p className="text-xs text-slate-600">
                      Connected: {integration.connectedDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${integration.status === 'active' ? 'bg-green-600' : 'bg-slate-400'}`} />
                    <span className="text-xs font-medium">{integration.status}</span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleIntegration(integration.id)}
                    >
                      {integration.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteIntegration(integration.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Webhooks ({webhooks.length})</CardTitle>
          <Dialog open={showAddWebhook} onOpenChange={setShowAddWebhook}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Webhook name"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                />

                <Input
                  placeholder="Webhook URL (https://...)"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Select Events</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                    {eventTypes.map(event => (
                      <label key={event} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhook({
                                ...newWebhook,
                                events: [...newWebhook.events, event]
                              });
                            } else {
                              setNewWebhook({
                                ...newWebhook,
                                events: newWebhook.events.filter(ev => ev !== event)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddWebhook(false)}>Cancel</Button>
                  <Button onClick={addWebhook}>Create Webhook</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No webhooks configured. Create one to send real-time data to external systems.
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(webhook => (
                <div key={webhook.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{webhook.name}</h3>
                      <p className="text-xs text-slate-600 font-mono break-all">{webhook.url}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${webhook.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {webhook.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-600 mb-1">Events:</p>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map(event => (
                        <span key={event} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  {webhook.lastTriggered && (
                    <p className="text-xs text-slate-500 mb-2">Last triggered: {webhook.lastTriggered}</p>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteWebhook(webhook.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
