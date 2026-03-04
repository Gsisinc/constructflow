/**
 * ConstructFlow API Client
 * Replaces Base44 SDK with direct HTTP calls to self-hosted backend
 * Uses JWT authentication instead of Base44 tokens
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ConstructFlowClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = this.getToken();
  }

  /**
   * Get JWT token from localStorage
   */
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('jwt_token');
  }

  /**
   * Set JWT token in localStorage
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('jwt_token', token);
      this.token = token;
    } else {
      localStorage.removeItem('jwt_token');
      this.token = null;
    }
  }

  /**
   * Make HTTP request with JWT authentication
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add JWT token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - token expired or invalid
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Authentication Endpoints
  // ============================================

  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
    return { success: true };
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async register(email, password, name) {
    return this.post('/auth/register', { email, password, name });
  }

  // ============================================
  // User Endpoints
  // ============================================

  async getUser(userId) {
    return this.get(`/users/${userId}`);
  }

  async updateUser(userId, data) {
    return this.put(`/users/${userId}`, data);
  }

  async getUserProfile() {
    return this.get('/users/profile');
  }

  // ============================================
  // Projects Endpoints
  // ============================================

  async getProjects(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/projects${query ? `?${query}` : ''}`);
  }

  async getProject(projectId) {
    return this.get(`/projects/${projectId}`);
  }

  async createProject(data) {
    return this.post('/projects', data);
  }

  async updateProject(projectId, data) {
    return this.put(`/projects/${projectId}`, data);
  }

  async deleteProject(projectId) {
    return this.delete(`/projects/${projectId}`);
  }

  // ============================================
  // Bids Endpoints
  // ============================================

  async getBids(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/bids${query ? `?${query}` : ''}`);
  }

  async getBid(bidId) {
    return this.get(`/bids/${bidId}`);
  }

  async createBid(data) {
    return this.post('/bids', data);
  }

  async updateBid(bidId, data) {
    return this.put(`/bids/${bidId}`, data);
  }

  async deleteBid(bidId) {
    return this.delete(`/bids/${bidId}`);
  }

  // ============================================
  // Tasks Endpoints
  // ============================================

  async getTasks(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(taskId) {
    return this.get(`/tasks/${taskId}`);
  }

  async createTask(data) {
    return this.post('/tasks', data);
  }

  async updateTask(taskId, data) {
    return this.put(`/tasks/${taskId}`, data);
  }

  async deleteTask(taskId) {
    return this.delete(`/tasks/${taskId}`);
  }

  // ============================================
  // Contacts Endpoints
  // ============================================

  async getContacts(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/contacts${query ? `?${query}` : ''}`);
  }

  async getContact(contactId) {
    return this.get(`/contacts/${contactId}`);
  }

  async createContact(data) {
    return this.post('/contacts', data);
  }

  async updateContact(contactId, data) {
    return this.put(`/contacts/${contactId}`, data);
  }

  async deleteContact(contactId) {
    return this.delete(`/contacts/${contactId}`);
  }

  // ============================================
  // Documents Endpoints
  // ============================================

  async getDocuments(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/documents${query ? `?${query}` : ''}`);
  }

  async getDocument(documentId) {
    return this.get(`/documents/${documentId}`);
  }

  async createDocument(data) {
    return this.post('/documents', data);
  }

  async updateDocument(documentId, data) {
    return this.put(`/documents/${documentId}`, data);
  }

  async deleteDocument(documentId) {
    return this.delete(`/documents/${documentId}`);
  }

  // ============================================
  // Estimates Endpoints
  // ============================================

  async getEstimates(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/estimates${query ? `?${query}` : ''}`);
  }

  async getEstimate(estimateId) {
    return this.get(`/estimates/${estimateId}`);
  }

  async createEstimate(data) {
    return this.post('/estimates', data);
  }

  async updateEstimate(estimateId, data) {
    return this.put(`/estimates/${estimateId}`, data);
  }

  async deleteEstimate(estimateId) {
    return this.delete(`/estimates/${estimateId}`);
  }

  // ============================================
  // Invoices Endpoints
  // ============================================

  async getInvoices(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/invoices${query ? `?${query}` : ''}`);
  }

  async getInvoice(invoiceId) {
    return this.get(`/invoices/${invoiceId}`);
  }

  async createInvoice(data) {
    return this.post('/invoices', data);
  }

  async updateInvoice(invoiceId, data) {
    return this.put(`/invoices/${invoiceId}`, data);
  }

  async deleteInvoice(invoiceId) {
    return this.delete(`/invoices/${invoiceId}`);
  }

  // ============================================
  // Time Cards Endpoints
  // ============================================

  async getTimeCards(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/timecards${query ? `?${query}` : ''}`);
  }

  async getTimeCard(timeCardId) {
    return this.get(`/timecards/${timeCardId}`);
  }

  async createTimeCard(data) {
    return this.post('/timecards', data);
  }

  async updateTimeCard(timeCardId, data) {
    return this.put(`/timecards/${timeCardId}`, data);
  }

  async deleteTimeCard(timeCardId) {
    return this.delete(`/timecards/${timeCardId}`);
  }

  // ============================================
  // Templates Endpoints
  // ============================================

  async getTemplates(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/templates${query ? `?${query}` : ''}`);
  }

  async getTemplate(templateId) {
    return this.get(`/templates/${templateId}`);
  }

  async createTemplate(data) {
    return this.post('/templates', data);
  }

  async updateTemplate(templateId, data) {
    return this.put(`/templates/${templateId}`, data);
  }

  async deleteTemplate(templateId) {
    return this.delete(`/templates/${templateId}`);
  }

  // ============================================
  // Labor Force Endpoints
  // ============================================

  async getLaborForce(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/labor-force${query ? `?${query}` : ''}`);
  }

  async getLaborForceEntry(entryId) {
    return this.get(`/labor-force/${entryId}`);
  }

  async createLaborForceEntry(data) {
    return this.post('/labor-force', data);
  }

  async updateLaborForceEntry(entryId, data) {
    return this.put(`/labor-force/${entryId}`, data);
  }

  async deleteLaborForceEntry(entryId) {
    return this.delete(`/labor-force/${entryId}`);
  }

  // ============================================
  // System Builder Endpoints
  // ============================================

  async getSystemDesigns() {
    return this.get('/system-designs');
  }

  async getSystemDesign(designId) {
    return this.get(`/system-designs/${designId}`);
  }

  async createSystemDesign(data) {
    return this.post('/system-designs', data);
  }

  async updateSystemDesign(designId, data) {
    return this.put(`/system-designs/${designId}`, data);
  }

  async deleteSystemDesign(designId) {
    return this.delete(`/system-designs/${designId}`);
  }

  // ============================================
  // AI Agents Endpoints
  // ============================================

  async getAgents() {
    return this.get('/agents');
  }

  async getAgent(agentId) {
    return this.get(`/agents/${agentId}`);
  }

  async createAgent(data) {
    return this.post('/agents', data);
  }

  async updateAgent(agentId, data) {
    return this.put(`/agents/${agentId}`, data);
  }

  async deleteAgent(agentId) {
    return this.delete(`/agents/${agentId}`);
  }

  async runAgent(agentId, params) {
    return this.post(`/agents/${agentId}/run`, params);
  }

  // ============================================
  // Bid Discovery Endpoints
  // ============================================

  async searchBids(query) {
    return this.get(`/bid-discovery/search?q=${encodeURIComponent(query)}`);
  }

  async getBidOpportunities(filters = {}) {
    const queryStr = new URLSearchParams(filters).toString();
    return this.get(`/bid-discovery/opportunities${queryStr ? `?${queryStr}` : ''}`);
  }

  // ============================================
  // Directory Endpoints
  // ============================================

  async getDirectory(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/directory${query ? `?${query}` : ''}`);
  }

  async getDirectoryEntry(entryId) {
    return this.get(`/directory/${entryId}`);
  }

  async createDirectoryEntry(data) {
    return this.post('/directory', data);
  }

  async updateDirectoryEntry(entryId, data) {
    return this.put(`/directory/${entryId}`, data);
  }

  async deleteDirectoryEntry(entryId) {
    return this.delete(`/directory/${entryId}`);
  }

  // ============================================
  // E-Signatures Endpoints
  // ============================================

  async getSignatures(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/signatures${query ? `?${query}` : ''}`);
  }

  async getSignature(signatureId) {
    return this.get(`/signatures/${signatureId}`);
  }

  async createSignature(data) {
    return this.post('/signatures', data);
  }

  async updateSignature(signatureId, data) {
    return this.put(`/signatures/${signatureId}`, data);
  }

  async deleteSignature(signatureId) {
    return this.delete(`/signatures/${signatureId}`);
  }

  // ============================================
  // Client Portal Endpoints
  // ============================================

  async getClientPortalAccess(clientId) {
    return this.get(`/client-portal/${clientId}`);
  }

  async createClientPortalAccess(data) {
    return this.post('/client-portal', data);
  }

  async updateClientPortalAccess(clientId, data) {
    return this.put(`/client-portal/${clientId}`, data);
  }

  // ============================================
  // Webmail Endpoints
  // ============================================

  async getEmails(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.get(`/webmail${query ? `?${query}` : ''}`);
  }

  async getEmail(emailId) {
    return this.get(`/webmail/${emailId}`);
  }

  async sendEmail(data) {
    return this.post('/webmail/send', data);
  }

  async deleteEmail(emailId) {
    return this.delete(`/webmail/${emailId}`);
  }
}

// Export singleton instance
export const constructflowClient = new ConstructFlowClient();
export default constructflowClient;
