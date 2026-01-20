import axios from 'axios';
import { storage } from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItem('auth_token');
      // Navigation to login will be handled by the auth store
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    birthDate: string;
    gender: string;
    interestedIn: string[];
    interests?: string[];
    lookingFor?: string[];
    bio?: string;
    photos?: string[];
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),
};

// User API
export const userApi = {
  updateProfile: (data: {
    name?: string;
    bio?: string;
    photos?: string[];
    location?: string;
    interestedIn?: string[];
  }) => api.put('/users/profile', data),

  discover: (limit = 20, offset = 0) =>
    api.get(`/users/discover?limit=${limit}&offset=${offset}`),

  getProfile: (id: string) => api.get(`/users/${id}`),
};

// Connection API
export const connectionApi = {
  initiate: (targetUserId: string) =>
    api.post('/connections', { targetUserId }),

  // Get connections with filters
  // status: 'incoming' | 'outgoing' | 'ACTIVE' | 'LATER'
  // sortBy: 'compatibility' | 'newest' | 'oldest'
  // filter: 'later'
  getAll: (params?: { status?: string; sortBy?: string; filter?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.filter) queryParams.append('filter', params.filter);
    const query = queryParams.toString();
    return api.get(`/connections${query ? `?${query}` : ''}`);
  },

  // Get pending/later counts for badges
  getPendingCount: () => api.get('/connections/pending-count'),

  getOne: (connectionId: string) => api.get(`/connections/${connectionId}`),

  accept: (connectionId: string) =>
    api.post(`/connections/${connectionId}/accept`),

  // Postpone for later ("En otro momento")
  postpone: (connectionId: string) =>
    api.post(`/connections/${connectionId}/later`),

  decline: (connectionId: string) =>
    api.post(`/connections/${connectionId}/decline`),
};

// Nucleus API (replaces old missions API)
export const nucleusApi = {
  // Get nucleus overview (progress, categories, etc)
  getOverview: (connectionId: string) =>
    api.get(`/nucleus/${connectionId}`),

  // Get questions for a category
  getCategoryQuestions: (connectionId: string, category: string) =>
    api.get(`/nucleus/${connectionId}/questions/${category}`),

  // Submit answer for a question
  submitAnswer: (connectionId: string, questionId: string, response: any) =>
    api.post(`/nucleus/${connectionId}/questions/${questionId}/answer`, { response }),

  // Get completed responses history
  getHistory: (connectionId: string) =>
    api.get(`/nucleus/${connectionId}/history`),

  // Photos section
  getPhotos: (connectionId: string) =>
    api.get(`/nucleus/${connectionId}/photos`),

  uploadPhoto: (connectionId: string, photoData: FormData) =>
    api.post(`/nucleus/${connectionId}/photos`, photoData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Voice section
  getVoice: (connectionId: string) =>
    api.get(`/nucleus/${connectionId}/voice`),

  uploadVoice: (connectionId: string, voiceData: FormData) =>
    api.post(`/nucleus/${connectionId}/voice`, voiceData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Mini games
  getGames: (connectionId: string) =>
    api.get(`/nucleus/${connectionId}/games`),

  startGame: (connectionId: string, gameType: string) =>
    api.post(`/nucleus/${connectionId}/games/${gameType}/start`),

  submitGameAnswers: (connectionId: string, gameId: string, answers: any) =>
    api.post(`/nucleus/${connectionId}/games/${gameId}/answers`, { answers }),

  // 2 Truths 1 Lie specific
  submit2Truths1Lie: (connectionId: string, gameId: string, statements: any) =>
    api.post(`/nucleus/${connectionId}/games/${gameId}/truth-or-lie`, statements),

  guessTheLie: (connectionId: string, gameId: string, guessIndex: number) =>
    api.post(`/nucleus/${connectionId}/games/${gameId}/guess-lie`, { guessIndex }),
};

// Legacy alias for missionApi (keeping for backward compatibility)
export const missionApi = {
  getCurrentRound: (connectionId: string) => nucleusApi.getOverview(connectionId),
  getCurrent: (connectionId: string) => nucleusApi.getOverview(connectionId),
  vote: (_connectionId: string, _missionOptionId: string) => Promise.resolve({ data: null }),
  respond: (connectionId: string, response: any) =>
    nucleusApi.submitAnswer(connectionId, response.questionId, response.answer),
  getHistory: (connectionId: string) => nucleusApi.getHistory(connectionId),
};

// Message API
export const messageApi = {
  getMessages: (connectionId: string, limit = 50, before?: string) =>
    api.get(
      `/messages/${connectionId}?limit=${limit}${before ? `&before=${before}` : ''}`
    ),

  send: (connectionId: string, content: string, type = 'TEXT') =>
    api.post(`/messages/${connectionId}`, { content, type }),

  getUnreadCount: () => api.get('/messages/unread'),
};

// Sparks API (sistema de chispas/moneda virtual)
export const sparksApi = {
  // Obtener balance actual
  getBalance: () => api.get('/sparks/balance'),

  // Obtener historial de transacciones
  getTransactions: (limit = 20, offset = 0) =>
    api.get(`/sparks/transactions?limit=${limit}&offset=${offset}`),

  // Obtener packs disponibles
  getPacks: () => api.get('/sparks/packs'),

  // Obtener precios de acciones
  getPrices: () => api.get('/sparks/prices'),

  // Comprar pack de chispas
  purchasePack: (packId: string) =>
    api.post('/sparks/purchase', { packId }),

  // Gastar chispas en una accion
  spend: (action: string, targetId?: string) =>
    api.post('/sparks/spend', { action, targetId }),

  // Verificar si puede pagar una accion
  canAfford: (action: string) =>
    api.get(`/sparks/can-afford?action=${action}`),

  // Obtener tipos de regalos disponibles
  getGiftTypes: () => api.get('/sparks/gifts'),

  // Enviar regalo
  sendGift: (connectionId: string, giftTypeId: string, message?: string) =>
    api.post('/sparks/gifts/send', { connectionId, giftTypeId, message }),
};
