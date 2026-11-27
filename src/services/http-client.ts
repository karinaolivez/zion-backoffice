import axios, { AxiosInstance } from 'axios';
import storageService from '@/lib/storage';

/**
 * Instância customizada do Axios compartilhada por todos os serviços
 * Inclui interceptors para autenticação e tratamento de erros
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor para adicionar token de autenticação
httpClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = storageService.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor para tratamento de erros
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      if (typeof window !== 'undefined') {
        storageService.removeAuthToken();
        storageService.removeUserProfile();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default httpClient;