/**
 * ResumeAI Pro - Frontend API Client
 * Handles all communication with the backend API
 */

const API_BASE_URL = window.API_BASE_URL || '';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(userData) {
    const result = await this.request('POST', '/api/auth/register', userData);
    if (result.token) this.setToken(result.token);
    return result;
  }

  async login(credentials) {
    const result = await this.request('POST', '/api/auth/login', credentials);
    if (result.token) this.setToken(result.token);
    return result;
  }

  async getMe() {
    return this.request('GET', '/api/auth/me');
  }

  async logout() {
    this.clearToken();
    return { success: true };
  }

  async forgotPassword(email) {
    return this.request('POST', '/api/auth/forgot-password', { email });
  }

  async resetPassword(token, password) {
    return this.request('POST', '/api/auth/reset-password', { token, password });
  }

  // Users
  async getProfile() {
    return this.request('GET', '/api/users/profile');
  }

  async updateProfile(data) {
    return this.request('PUT', '/api/users/profile', data);
  }

  async getStats() {
    return this.request('GET', '/api/users/stats');
  }

  async deleteAccount() {
    return this.request('DELETE', '/api/users/account');
  }

  // Resumes
  async getResumes() {
    return this.request('GET', '/api/resumes');
  }

  async createResume(data) {
    return this.request('POST', '/api/resumes', data);
  }

  async getResume(id) {
    return this.request('GET', `/api/resumes/${id}`);
  }

  async updateResume(id, data) {
    return this.request('PUT', `/api/resumes/${id}`, data);
  }

  async deleteResume(id) {
    return this.request('DELETE', `/api/resumes/${id}`);
  }

  async duplicateResume(id) {
    return this.request('POST', `/api/resumes/${id}/duplicate`);
  }

  // Templates
  async getTemplates(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/api/templates?${query}`);
  }

  async getTemplate(id) {
    return this.request('GET', `/api/templates/${id}`);
  }

  // AI
  async generateWithAI(type, data) {
    return this.request('POST', '/api/ai/generate', { type, data });
  }

  async optimizeATS(resumeContent, jobDescription) {
    return this.request('POST', '/api/ai/optimize-ats', { resumeContent, jobDescription });
  }

  async extractKeywords(jobDescription) {
    return this.request('POST', '/api/ai/extract-keywords', { jobDescription });
  }

  async getAIGenerations() {
    return this.request('GET', '/api/ai/generations');
  }

  // Payments
  async getPlans() {
    return this.request('GET', '/api/payments/plans');
  }

  async createPaymentIntent(plan) {
    return this.request('POST', '/api/payments/create-intent', { plan });
  }

  async getPaymentHistory() {
    return this.request('GET', '/api/payments/history');
  }

  async cancelSubscription() {
    return this.request('POST', '/api/payments/cancel');
  }
}

// Singleton instance
const api = new APIClient();

// Check auth on load
api.getMe().catch(() => {
  // Not logged in, that's ok
});

// Export for use in other scripts
window.API = api;
