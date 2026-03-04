/**
 * Accounting Sync Service
 * Handles bidirectional sync with QuickBooks, Xero, and Sage
 * Syncs invoices, expenses, payments, and job costing data
 */

import { base44 } from '@/api/base44Client';

// Configuration for different accounting systems
const ACCOUNTING_SYSTEMS = {
  quickbooks_online: {
    name: 'QuickBooks Online',
    apiVersion: 'v2',
    baseUrl: 'https://quickbooks.api.intuit.com',
    endpoints: {
      invoices: '/v2/company/{realmId}/query?query=select * from Invoice',
      expenses: '/v2/company/{realmId}/query?query=select * from Bill',
      payments: '/v2/company/{realmId}/query?query=select * from Payment'
    }
  },
  quickbooks_desktop: {
    name: 'QuickBooks Desktop',
    apiVersion: 'v1',
    baseUrl: 'https://qbo.intuit.com',
    endpoints: {
      invoices: '/qbo/invoices',
      expenses: '/qbo/bills',
      payments: '/qbo/payments'
    }
  },
  xero: {
    name: 'Xero',
    apiVersion: 'v2',
    baseUrl: 'https://api.xero.com',
    endpoints: {
      invoices: '/api.xro/2.0/Invoices',
      expenses: '/api.xro/2.0/Bills',
      payments: '/api.xro/2.0/Payments'
    }
  },
  sage: {
    name: 'Sage 100/300',
    apiVersion: 'v1',
    baseUrl: 'https://api.sage.com',
    endpoints: {
      invoices: '/v1/invoices',
      expenses: '/v1/expenses',
      payments: '/v1/payments'
    }
  }
};

/**
 * Initialize accounting sync for a provider
 * @param {string} provider - Provider ID (quickbooks_online, xero, sage, etc.)
 * @param {Object} credentials - OAuth credentials
 * @returns {Promise<Object>} Sync configuration
 */
export async function initializeAccountingSync(provider, credentials) {
  try {
    const system = ACCOUNTING_SYSTEMS[provider];
    if (!system) {
      throw new Error(`Unknown accounting system: ${provider}`);
    }

    // Store credentials securely
    const syncConfig = await base44.functions.invoke('storeAccountingCredentials', {
      provider,
      credentials: {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresIn: credentials.expiresIn,
        realmId: credentials.realmId // For QuickBooks
      }
    });

    return {
      provider,
      system,
      syncConfig,
      status: 'initialized',
      lastSync: null
    };
  } catch (error) {
    console.error(`Failed to initialize ${provider} sync:`, error);
    throw error;
  }
}

/**
 * Sync invoices from accounting system to ConstructFlow
 * @param {string} provider - Provider ID
 * @param {Object} options - Sync options
 * @returns {Promise<Array>} Synced invoices
 */
export async function syncInvoices(provider, options = {}) {
  try {
    const system = ACCOUNTING_SYSTEMS[provider];
    if (!system) throw new Error(`Unknown accounting system: ${provider}`);

    const {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      dateTo = new Date(),
      limit = 100
    } = options;

    // Fetch invoices from accounting system
    const invoices = await base44.functions.invoke('fetchAccountingInvoices', {
      provider,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      limit
    });

    // Transform and store in ConstructFlow
    const syncedInvoices = [];
    for (const invoice of invoices) {
      const transformed = transformInvoice(invoice, provider);
      
      // Store in ConstructFlow database
      const stored = await base44.functions.invoke('storeInvoice', {
        data: transformed,
        externalId: invoice.id,
        provider
      });

      syncedInvoices.push(stored);
    }

    // Log sync activity
    await logSyncActivity({
      provider,
      type: 'invoices',
      count: syncedInvoices.length,
      status: 'success',
      timestamp: new Date()
    });

    return syncedInvoices;
  } catch (error) {
    console.error(`Failed to sync invoices from ${provider}:`, error);
    await logSyncActivity({
      provider,
      type: 'invoices',
      status: 'failed',
      error: error.message,
      timestamp: new Date()
    });
    throw error;
  }
}

/**
 * Sync expenses from accounting system
 * @param {string} provider - Provider ID
 * @param {Object} options - Sync options
 * @returns {Promise<Array>} Synced expenses
 */
export async function syncExpenses(provider, options = {}) {
  try {
    const system = ACCOUNTING_SYSTEMS[provider];
    if (!system) throw new Error(`Unknown accounting system: ${provider}`);

    const {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateTo = new Date(),
      limit = 100
    } = options;

    // Fetch expenses from accounting system
    const expenses = await base44.functions.invoke('fetchAccountingExpenses', {
      provider,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      limit
    });

    // Transform and store
    const syncedExpenses = [];
    for (const expense of expenses) {
      const transformed = transformExpense(expense, provider);
      
      const stored = await base44.functions.invoke('storeExpense', {
        data: transformed,
        externalId: expense.id,
        provider
      });

      syncedExpenses.push(stored);
    }

    await logSyncActivity({
      provider,
      type: 'expenses',
      count: syncedExpenses.length,
      status: 'success',
      timestamp: new Date()
    });

    return syncedExpenses;
  } catch (error) {
    console.error(`Failed to sync expenses from ${provider}:`, error);
    await logSyncActivity({
      provider,
      type: 'expenses',
      status: 'failed',
      error: error.message,
      timestamp: new Date()
    });
    throw error;
  }
}

/**
 * Sync payments from accounting system
 * @param {string} provider - Provider ID
 * @param {Object} options - Sync options
 * @returns {Promise<Array>} Synced payments
 */
export async function syncPayments(provider, options = {}) {
  try {
    const system = ACCOUNTING_SYSTEMS[provider];
    if (!system) throw new Error(`Unknown accounting system: ${provider}`);

    const {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateTo = new Date(),
      limit = 100
    } = options;

    // Fetch payments from accounting system
    const payments = await base44.functions.invoke('fetchAccountingPayments', {
      provider,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      limit
    });

    // Transform and store
    const syncedPayments = [];
    for (const payment of payments) {
      const transformed = transformPayment(payment, provider);
      
      const stored = await base44.functions.invoke('storePayment', {
        data: transformed,
        externalId: payment.id,
        provider
      });

      syncedPayments.push(stored);
    }

    await logSyncActivity({
      provider,
      type: 'payments',
      count: syncedPayments.length,
      status: 'success',
      timestamp: new Date()
    });

    return syncedPayments;
  } catch (error) {
    console.error(`Failed to sync payments from ${provider}:`, error);
    await logSyncActivity({
      provider,
      type: 'payments',
      status: 'failed',
      error: error.message,
      timestamp: new Date()
    });
    throw error;
  }
}

/**
 * Sync job costing data
 * @param {string} provider - Provider ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Job costing data
 */
export async function syncJobCosting(provider, projectId) {
  try {
    const jobCosting = await base44.functions.invoke('fetchJobCosting', {
      provider,
      projectId
    });

    // Transform and store
    const transformed = {
      projectId,
      provider,
      laborCost: jobCosting.labor || 0,
      materialCost: jobCosting.materials || 0,
      equipmentCost: jobCosting.equipment || 0,
      subcontractorCost: jobCosting.subcontractors || 0,
      totalCost: (jobCosting.labor || 0) + (jobCosting.materials || 0) + 
                 (jobCosting.equipment || 0) + (jobCosting.subcontractors || 0),
      lastUpdated: new Date()
    };

    const stored = await base44.functions.invoke('storeJobCosting', {
      data: transformed
    });

    await logSyncActivity({
      provider,
      type: 'job_costing',
      projectId,
      status: 'success',
      timestamp: new Date()
    });

    return stored;
  } catch (error) {
    console.error(`Failed to sync job costing from ${provider}:`, error);
    throw error;
  }
}

/**
 * Sync purchase orders to accounting system
 * @param {string} provider - Provider ID
 * @param {Object} purchaseOrder - PO data
 * @returns {Promise<Object>} Synced PO
 */
export async function syncPurchaseOrder(provider, purchaseOrder) {
  try {
    const transformed = transformPurchaseOrder(purchaseOrder, provider);

    const synced = await base44.functions.invoke('syncPurchaseOrderToAccounting', {
      provider,
      data: transformed
    });

    await logSyncActivity({
      provider,
      type: 'purchase_order',
      poId: purchaseOrder.id,
      status: 'success',
      timestamp: new Date()
    });

    return synced;
  } catch (error) {
    console.error(`Failed to sync PO to ${provider}:`, error);
    throw error;
  }
}

/**
 * Transform invoice data from provider format to ConstructFlow format
 */
function transformInvoice(invoice, provider) {
  const baseTransform = {
    externalId: invoice.id,
    provider,
    invoiceNumber: invoice.docNumber || invoice.number || invoice.invoiceNumber,
    date: new Date(invoice.txnDate || invoice.date || invoice.invoiceDate),
    dueDate: new Date(invoice.dueDate || invoice.due_date),
    customer: invoice.customerRef?.name || invoice.customer?.name || invoice.customer,
    amount: invoice.totalAmt || invoice.total || invoice.amount,
    status: invoice.docStatus || invoice.status || 'draft',
    items: invoice.lineItems || invoice.lines || [],
    description: invoice.description || '',
    lastModified: new Date(invoice.metaData?.lastUpdatedTime || invoice.updated_at || Date.now())
  };

  // Provider-specific transformations
  switch (provider) {
    case 'quickbooks_online':
      return {
        ...baseTransform,
        realmId: invoice.realmId,
        syncToken: invoice.syncToken
      };
    case 'xero':
      return {
        ...baseTransform,
        contactId: invoice.contactID,
        lineAmountTypes: invoice.lineAmountTypes
      };
    case 'sage':
      return {
        ...baseTransform,
        customerId: invoice.customerID,
        reference: invoice.reference
      };
    default:
      return baseTransform;
  }
}

/**
 * Transform expense data
 */
function transformExpense(expense, provider) {
  return {
    externalId: expense.id,
    provider,
    vendorName: expense.vendorRef?.name || expense.vendor?.name || expense.vendor,
    date: new Date(expense.txnDate || expense.date),
    amount: expense.totalAmt || expense.total || expense.amount,
    category: expense.category || expense.accountRef?.name || 'General Expense',
    description: expense.description || '',
    status: expense.docStatus || expense.status || 'draft',
    items: expense.lineItems || expense.lines || [],
    lastModified: new Date(expense.metaData?.lastUpdatedTime || expense.updated_at || Date.now())
  };
}

/**
 * Transform payment data
 */
function transformPayment(payment, provider) {
  return {
    externalId: payment.id,
    provider,
    paymentMethod: payment.paymentMethodRef?.name || payment.method || 'check',
    date: new Date(payment.txnDate || payment.date),
    amount: payment.totalAmt || payment.total || payment.amount,
    reference: payment.docNumber || payment.reference || '',
    status: payment.docStatus || payment.status || 'draft',
    appliedInvoices: payment.lineItems || payment.lines || [],
    lastModified: new Date(payment.metaData?.lastUpdatedTime || payment.updated_at || Date.now())
  };
}

/**
 * Transform purchase order data
 */
function transformPurchaseOrder(po, provider) {
  return {
    externalId: po.id,
    provider,
    poNumber: po.number || po.poNumber,
    vendor: po.vendor || po.vendorName,
    date: new Date(po.date || po.createdDate),
    dueDate: new Date(po.dueDate || po.expectedDelivery),
    amount: po.total || po.amount,
    items: po.items || po.lineItems || [],
    status: po.status || 'draft',
    description: po.description || '',
    projectId: po.projectId || null
  };
}

/**
 * Log sync activity for audit trail
 */
async function logSyncActivity(activity) {
  try {
    await base44.functions.invoke('logAccountingSyncActivity', {
      activity: {
        ...activity,
        timestamp: activity.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log sync activity:', error);
  }
}

/**
 * Get sync status for a provider
 */
export async function getSyncStatus(provider) {
  try {
    const status = await base44.functions.invoke('getAccountingSyncStatus', {
      provider
    });
    return status;
  } catch (error) {
    console.error(`Failed to get sync status for ${provider}:`, error);
    throw error;
  }
}

/**
 * Schedule recurring sync
 */
export async function scheduleRecurringSync(provider, interval = 'hourly') {
  try {
    const scheduled = await base44.functions.invoke('scheduleAccountingSync', {
      provider,
      interval // 'hourly', 'daily', 'weekly'
    });
    return scheduled;
  } catch (error) {
    console.error(`Failed to schedule sync for ${provider}:`, error);
    throw error;
  }
}

export default {
  initializeAccountingSync,
  syncInvoices,
  syncExpenses,
  syncPayments,
  syncJobCosting,
  syncPurchaseOrder,
  getSyncStatus,
  scheduleRecurringSync
};
