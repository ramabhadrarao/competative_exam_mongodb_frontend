import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthResponse, User, Question, Test, TestSubmission, LoginData, RegisterData, QuestionData, TestData, GenerateQuestionData } from '../types';

class ApiClient {
  private api: AxiosInstance;
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('eduplatform_token');
    
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('eduplatform_token', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('eduplatform_token');
    localStorage.removeItem('eduplatform_user');
    window.location.href = '/login';
  }

  // Auth endpoints
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    this.setToken(response.data.token);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    this.setToken(response.data.token);
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.api.get<{ user: User }>('/auth/profile');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }

  // Question endpoints
  async getQuestions(params?: {
    page?: number;
    limit?: number;
    subject?: string;
    difficulty?: string;
    type?: string;
    search?: string;
  }): Promise<{
    questions: Question[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    const response = await this.api.get('/questions', { params });
    return response.data;
  }

  async getQuestion(id: string): Promise<Question> {
    const response = await this.api.get<Question>(`/questions/${id}`);
    return response.data;
  }

  async createQuestion(data: QuestionData): Promise<{ message: string; question: Question }> {
    const response = await this.api.post('/questions', data);
    return response.data;
  }

  async updateQuestion(id: string, data: QuestionData): Promise<{ message: string; question: Question }> {
    const response = await this.api.put(`/questions/${id}`, data);
    return response.data;
  }

  async deleteQuestion(id: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/questions/${id}`);
    return response.data;
  }

  async generateQuestions(data: GenerateQuestionData): Promise<{ message: string; jobId: string }> {
    const response = await this.api.post('/questions/generate', data);
    return response.data;
  }

  async getGenerationStatus(jobId: string): Promise<any> {
    const response = await this.api.get(`/questions/generate/status/${jobId}`);
    return response.data;
  }

  // Test endpoints
  async getTests(params?: {
    page?: number;
    limit?: number;
    subject?: string;
    grade?: string;
    status?: string;
  }): Promise<{
    tests: Test[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    const response = await this.api.get('/tests', { params });
    return response.data;
  }

  async getTest(id: string): Promise<Test> {
    const response = await this.api.get<Test>(`/tests/${id}`);
    return response.data;
  }

  async createTest(data: TestData): Promise<{ message: string; test: Test }> {
    const response = await this.api.post('/tests', data);
    return response.data;
  }

  async updateTest(id: string, data: TestData): Promise<{ message: string; test: Test }> {
    const response = await this.api.put(`/tests/${id}`, data);
    return response.data;
  }

  async deleteTest(id: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/tests/${id}`);
    return response.data;
  }

  async startTest(id: string, password?: string): Promise<{
    message: string;
    submission: { id: string; startTime: Date; timeLimit: number };
    test: Test;
  }> {
    const response = await this.api.post(`/tests/${id}/start`, { password });
    return response.data;
  }

  async submitTest(id: string, answers: Array<{
    question: string;
    answer: string | string[] | boolean;
    timeSpent?: number;
  }>): Promise<{
    message: string;
    result: {
      score: number;
      totalPoints: number;
      percentage: number;
      timeSpent: number;
      answers?: Array<any>;
    };
  }> {
    const response = await this.api.post(`/tests/${id}/submit`, { answers });
    return response.data;
  }

  async getTestResults(id: string): Promise<{
    test: { id: string; title: string; totalPoints: number };
    results: TestSubmission[];
  }> {
    const response = await this.api.get(`/tests/${id}/results`);
    return response.data;
  }

  // Upload endpoints
  async uploadDocument(file: File, params: {
    subject?: string;
    topic?: string;
    difficulty?: string;
    grade?: string;
    generateQuestions?: boolean;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('document', file);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await this.api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async uploadImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  // Add these methods to the ApiClient class in src/services/api.ts

  // User management endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
    grade?: string;
    sortBy?: string;
  }): Promise<{
    users: User[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    const response = await this.api.get('/users', { params });
    return response.data;
  }

  async activateUser(id: string): Promise<{ message: string }> {
    const response = await this.api.post(`/users/bulk/activate`, { userIds: [id] });
    return response.data;
  }

  async deactivateUser(id: string): Promise<{ message: string }> {
    const response = await this.api.post(`/users/bulk/deactivate`, { userIds: [id] });
    return response.data;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  async getUserStats(id: string): Promise<any> {
    const response = await this.api.get(`/users/${id}/stats`);
    return response.data;
  }

  async updateProfile(data: any): Promise<{ message: string; user: User }> {
    const response = await this.api.put('/auth/profile', data);
    return response.data;
  }
}

export const api = new ApiClient();