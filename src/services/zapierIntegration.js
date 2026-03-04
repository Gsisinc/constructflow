/**
 * Zapier Integration Service
 * Enables real-time connections to thousands of apps
 * Provides webhook support and API marketplace
 */

import { base44 } from '@/api/base44Client';

/**
 * Get Zapier integration configuration
 * @returns {Promise<Object>} Zapier config
 */
export async function getZapierConfig() {
  try {
    const config = await base44.functions.invoke('getZapierConfig', {});

    return {
      webhookUrl: config.webhookUrl,
      apiKey: config.apiKey,
      status: config.status,
      connectedApps: config.connectedApps || [],
      availableZaps: config.availableZaps || []
    };
  } catch (error) {
    console.error('Failed to get Zapier config:', error);
    throw error;
  }
}

/**
 * Create webhook for real-time data pushes
 * @param {Object} webhookConfig - Webhook configuration
 * @returns {Promise<Object>} Created webhook
 */
export async function createWebhook(webhookConfig) {
  try {
    const {
      eventType,
      targetUrl,
      description,
      active = true
    } = webhookConfig;

    const webhook = await base44.functions.invoke('createWebhook', {
      data: {
        eventType,
        targetUrl,
        description,
        active,
        createdDate: new Date().toISOString()
      }
    });

    return {
      id: webhook.id,
      eventType,
      targetUrl,
      status: webhook.status,
      secret: webhook.secret,
      createdDate: webhook.createdDate
    };
  } catch (error) {
    console.error('Failed to create webhook:', error);
    throw error;
  }
}

/**
 * List all webhooks
 * @returns {Promise<Array>} List of webhooks
 */
export async function listWebhooks() {
  try {
    const webhooks = await base44.functions.invoke('listWebhooks', {});

    return webhooks.map(webhook => ({
      id: webhook.id,
      eventType: webhook.eventType,
      targetUrl: webhook.targetUrl,
      active: webhook.active,
      lastTriggered: webhook.lastTriggered,
      failureCount: webhook.failureCount
    }));
  } catch (error) {
    console.error('Failed to list webhooks:', error);
    throw error;
  }
}

/**
 * Delete webhook
 * @param {string} webhookId - Webhook ID
 * @returns {Promise<void>}
 */
export async function deleteWebhook(webhookId) {
  try {
    await base44.functions.invoke('deleteWebhook', {
      webhookId
    });
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    throw error;
  }
}

/**
 * Register API marketplace provider
 * @param {Object} providerConfig - Provider configuration
 * @returns {Promise<Object>} Registered provider
 */
export async function registerApiProvider(providerConfig) {
  try {
    const {
      name,
      description,
      apiEndpoint,
      apiKey,
      capabilities = [],
      documentation
    } = providerConfig;

    const provider = await base44.functions.invoke('registerApiProvider', {
      data: {
        name,
        description,
        apiEndpoint,
        apiKey,
        capabilities,
        documentation,
        registeredDate: new Date().toISOString()
      }
    });

    return {
      id: provider.id,
      name,
      status: provider.status,
      capabilities,
      apiEndpoint
    };
  } catch (error) {
    console.error('Failed to register API provider:', error);
    throw error;
  }
}

/**
 * List available API providers
 * @returns {Promise<Array>} List of providers
 */
export async function listApiProviders() {
  try {
    const providers = await base44.functions.invoke('listApiProviders', {});

    return providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      capabilities: provider.capabilities,
      status: provider.status,
      documentation: provider.documentation
    }));
  } catch (error) {
    console.error('Failed to list API providers:', error);
    throw error;
  }
}

/**
 * Integrate with Microsoft Project
 * @param {Object} credentials - Microsoft credentials
 * @returns {Promise<Object>} Integration status
 */
export async function integrateMicrosoftProject(credentials) {
  try {
    const integration = await base44.functions.invoke('integrateMicrosoftProject', {
      credentials: {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        tenantId: credentials.tenantId
      }
    });

    return {
      status: 'connected',
      provider: 'Microsoft Project',
      syncCapabilities: [
        'projects',
        'tasks',
        'resources',
        'timesheets'
      ],
      lastSync: integration.lastSync
    };
  } catch (error) {
    console.error('Failed to integrate Microsoft Project:', error);
    throw error;
  }
}

/**
 * Sync with Google Drive
 * @param {Object} credentials - Google credentials
 * @returns {Promise<Object>} Sync configuration
 */
export async function syncGoogleDrive(credentials) {
  try {
    const sync = await base44.functions.invoke('syncGoogleDrive', {
      credentials: {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken
      }
    });

    return {
      status: 'connected',
      provider: 'Google Drive',
      syncCapabilities: [
        'documents',
        'spreadsheets',
        'presentations',
        'folders'
      ],
      autoSync: sync.autoSync,
      lastSync: sync.lastSync
    };
  } catch (error) {
    console.error('Failed to sync Google Drive:', error);
    throw error;
  }
}

/**
 * Sync with Dropbox
 * @param {Object} credentials - Dropbox credentials
 * @returns {Promise<Object>} Sync configuration
 */
export async function syncDropbox(credentials) {
  try {
    const sync = await base44.functions.invoke('syncDropbox', {
      credentials: {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken
      }
    });

    return {
      status: 'connected',
      provider: 'Dropbox',
      syncCapabilities: [
        'documents',
        'images',
        'videos',
        'folders'
      ],
      autoSync: sync.autoSync,
      lastSync: sync.lastSync
    };
  } catch (error) {
    console.error('Failed to sync Dropbox:', error);
    throw error;
  }
}

/**
 * Integrate DocuSign for e-signatures
 * @param {Object} credentials - DocuSign credentials
 * @returns {Promise<Object>} Integration status
 */
export async function integrateDocuSign(credentials) {
  try {
    const integration = await base44.functions.invoke('integrateDocuSign', {
      credentials: {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        accountId: credentials.accountId
      }
    });

    return {
      status: 'connected',
      provider: 'DocuSign',
      capabilities: [
        'send_for_signature',
        'request_approval',
        'track_signatures',
        'auto_fill_templates'
      ],
      accountId: integration.accountId,
      lastSync: integration.lastSync
    };
  } catch (error) {
    console.error('Failed to integrate DocuSign:', error);
    throw error;
  }
}

/**
 * Get integration status for all connected services
 * @returns {Promise<Object>} Integration status
 */
export async function getIntegrationStatus() {
  try {
    const status = await base44.functions.invoke('getIntegrationStatus', {});

    return {
      zapier: {
        connected: status.zapier?.connected || false,
        connectedApps: status.zapier?.connectedApps || 0
      },
      webhooks: {
        active: status.webhooks?.active || 0,
        total: status.webhooks?.total || 0
      },
      microsoftProject: {
        connected: status.microsoftProject?.connected || false
      },
      googleDrive: {
        connected: status.googleDrive?.connected || false
      },
      dropbox: {
        connected: status.dropbox?.connected || false
      },
      docuSign: {
        connected: status.docuSign?.connected || false
      },
      apiProviders: {
        registered: status.apiProviders?.registered || 0
      }
    };
  } catch (error) {
    console.error('Failed to get integration status:', error);
    throw error;
  }
}

/**
 * Test webhook
 * @param {string} webhookId - Webhook ID
 * @returns {Promise<Object>} Test result
 */
export async function testWebhook(webhookId) {
  try {
    const result = await base44.functions.invoke('testWebhook', {
      webhookId
    });

    return {
      webhookId,
      status: result.status,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Failed to test webhook:', error);
    throw error;
  }
}

export default {
  getZapierConfig,
  createWebhook,
  listWebhooks,
  deleteWebhook,
  registerApiProvider,
  listApiProviders,
  integrateMicrosoftProject,
  syncGoogleDrive,
  syncDropbox,
  integrateDocuSign,
  getIntegrationStatus,
  testWebhook
};
