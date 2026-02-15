/**
 * QuickBooks Integration Service
 * Handles two-way sync with QuickBooks Online
 * Syncs invoices, expenses, job costs, and purchase orders
 */

import axios from 'axios';

const QBO_BASE_URL = 'https://quickbooks.api.intuit.com/v2/company';
const QBO_AUTH_URL = 'https://oauth.platform.intuit.com/oauth2';

class QuickBooksService {
  constructor(realmId, accessToken, refreshToken) {
    this.realmId = realmId;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.client = axios.create({
      baseURL: `${QBO_BASE_URL}/${realmId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(clientId, clientSecret) {
    try {
      const response = await axios.post(`${QBO_AUTH_URL}/tokens/refresh`, {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      }, {
        auth: {
          username: clientId,
          password: clientSecret
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      // Update client headers
      this.client.defaults.headers['Authorization'] = `Bearer ${this.accessToken}`;
      
      return response.data;
    } catch (error) {
      console.error('Failed to refresh QBO token:', error);
      throw error;
    }
  }

  /**
   * Create invoice in QuickBooks
   */
  async createInvoice(invoiceData) {
    try {
      const qboInvoice = {
        Line: invoiceData.lineItems.map(item => ({
          DetailType: 'SalesItemLineDetail',
          Amount: item.amount,
          Description: item.description,
          SalesItemLineDetail: {
            ItemRef: {
              value: item.qboItemId || '1'
            },
            TaxCodeRef: {
              value: '1'
            }
          }
        })),
        CustomerRef: {
          value: invoiceData.qboCustomerId
        },
        DueDate: invoiceData.dueDate,
        DocNumber: invoiceData.invoiceNumber,
        TxnDate: invoiceData.date,
        BillEmail: {
          Address: invoiceData.customerEmail
        },
        ShipAddr: invoiceData.shipAddress ? {
          Line1: invoiceData.shipAddress.street,
          City: invoiceData.shipAddress.city,
          StateProvince: invoiceData.shipAddress.state,
          PostalCode: invoiceData.shipAddress.zip,
          Country: 'USA'
        } : undefined
      };

      const response = await this.client.post('/query', {
        query: `SELECT * FROM Invoice WHERE DocNumber = '${invoiceData.invoiceNumber}'`
      });

      if (response.data.QueryResponse.Invoice && response.data.QueryResponse.Invoice.length > 0) {
        // Update existing
        qboInvoice.Id = response.data.QueryResponse.Invoice[0].Id;
        qboInvoice.SyncToken = response.data.QueryResponse.Invoice[0].SyncToken;
        return await this.client.post('/invoice', qboInvoice);
      } else {
        // Create new
        return await this.client.post('/invoice', qboInvoice);
      }
    } catch (error) {
      console.error('Failed to create QBO invoice:', error);
      throw error;
    }
  }

  /**
   * Create expense in QuickBooks
   */
  async createExpense(expenseData) {
    try {
      const qboExpense = {
        Line: expenseData.lineItems.map(item => ({
          DetailType: 'AccountBasedExpenseLineDetail',
          Amount: item.amount,
          Description: item.description,
          AccountBasedExpenseLineDetail: {
            AccountRef: {
              value: item.qboAccountId
            },
            TaxCodeRef: {
              value: '1'
            }
          }
        })),
        EntityRef: {
          value: expenseData.qboVendorId,
          type: 'Vendor'
        },
        TxnDate: expenseData.date,
        DocNumber: expenseData.receiptNumber
      };

      return await this.client.post('/bill', qboExpense);
    } catch (error) {
      console.error('Failed to create QBO expense:', error);
      throw error;
    }
  }

  /**
   * Create job costing entry (use Class for job tracking)
   */
  async createJobCost(jobCostData) {
    try {
      const qboBill = {
        Line: jobCostData.lineItems.map(item => ({
          DetailType: 'ItemBasedExpenseLineDetail',
          Amount: item.amount,
          Description: item.description,
          ItemBasedExpenseLineDetail: {
            ItemRef: {
              value: item.qboItemId
            },
            ClassRef: {
              value: jobCostData.qboJobId // Job ID stored as Class
            },
            Qty: item.quantity
          }
        })),
        EntityRef: {
          value: jobCostData.qboVendorId,
          type: 'Vendor'
        },
        TxnDate: jobCostData.date,
        ClassRef: {
          value: jobCostData.qboJobId
        }
      };

      return await this.client.post('/bill', qboBill);
    } catch (error) {
      console.error('Failed to create QBO job cost:', error);
      throw error;
    }
  }

  /**
   * Get customer from QuickBooks
   */
  async getCustomer(customerId) {
    try {
      const response = await this.client.get(`/customer/${customerId}`);
      return response.data.Customer;
    } catch (error) {
      console.error('Failed to get QBO customer:', error);
      throw error;
    }
  }

  /**
   * Create purchase order in QuickBooks
   */
  async createPurchaseOrder(poData) {
    try {
      const qboPO = {
        Line: poData.lineItems.map(item => ({
          DetailType: 'ItemBasedExpenseLineDetail',
          Amount: item.amount,
          Description: item.description,
          ItemBasedExpenseLineDetail: {
            ItemRef: {
              value: item.qboItemId
            },
            Qty: item.quantity
          }
        })),
        VendorRef: {
          value: poData.qboVendorId
        },
        DueDate: poData.dueDate,
        DocNumber: poData.poNumber,
        TxnDate: poData.date,
        ClassRef: {
          value: poData.qboJobId
        }
      };

      return await this.client.post('/purchaseorder', qboPO);
    } catch (error) {
      console.error('Failed to create QBO PO:', error);
      throw error;
    }
  }

  /**
   * Get job costs summary from QuickBooks
   */
  async getJobCostsSummary(jobId) {
    try {
      const response = await this.client.post('/query', {
        query: `SELECT * FROM Bill WHERE ClassRef = '${jobId}'`
      });

      const bills = response.data.QueryResponse.Bill || [];
      const totalCosts = bills.reduce((sum, bill) => {
        return sum + bill.Line.reduce((lineSum, line) => lineSum + line.Amount, 0);
      }, 0);

      return {
        jobId,
        totalCosts,
        bills: bills.length,
        expenses: bills
      };
    } catch (error) {
      console.error('Failed to get job costs:', error);
      throw error;
    }
  }

  /**
   * Sync payment from QuickBooks
   */
  async syncPayment(paymentData) {
    try {
      const qboPayment = {
        Line: [{
          DetailType: 'SalesItemLineDetail',
          Amount: paymentData.amount,
          LinkedTxn: [{
            TxnId: paymentData.qboInvoiceId,
            TxnType: 'Invoice'
          }]
        }],
        CustomerRef: {
          value: paymentData.qboCustomerId
        },
        TxnDate: paymentData.date,
        DepositToAccountRef: {
          value: paymentData.qboAccountId
        },
        PaymentMethodRef: {
          value: paymentData.paymentMethod // 'Check', 'Cash', 'CreditCard', etc.
        }
      };

      return await this.client.post('/payment', qboPayment);
    } catch (error) {
      console.error('Failed to sync QBO payment:', error);
      throw error;
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(startDate, endDate) {
    try {
      const response = await this.client.get('/reports/ProfitAndLossDetail', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get financial summary:', error);
      throw error;
    }
  }
}

export default QuickBooksService;
