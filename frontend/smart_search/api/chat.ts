import { useRuntimeConfig } from '#app';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';

// Types spécifiques pour les réponses
interface BaseApiResponse {
  success: boolean;
  error?: string;
  processing_time?: number;
}

interface TextResponse extends BaseApiResponse {
  data: {
    answer: string;
    confidence: number;
    sources?: string[];
  };
}

interface MultimodalResponse extends BaseApiResponse {
  data: {
    answer: string;
    confidence: number;
    visual_elements?: any[];
  };
}

interface ConversationResponse extends BaseApiResponse {
  data: {
    conversations: Array<{
      id: string;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
    }>;
  };
}

// Configuration d'environnement
const config = {
  baseURL: useRuntimeConfig().public.apiUrl || 'https://smartsearch.myfad.org/api',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0'
  },
  timeout: 30000, // 30 secondes par défaut
  retries: 2
};

// Erreurs personnalisées
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class NetworkError extends ApiError {
  constructor(message: string, details?: any) {
    super(0, message, details);
    this.name = 'NetworkError';
  }
}

class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

async function axiosApi<T extends BaseApiResponse>(
  url: string,
  options: AxiosRequestConfig = {},
  retries = config.retries
): Promise<T> {
  try {
    const response = await axios.request({
      ...options,
      baseURL: config.baseURL,
      url,
      headers: {
        ...config.headers,
        ...options.headers
      },
      timeout: config.timeout,
      withCredentials: true
    });

    if (!response.data.success) {
      throw new ApiError(
        400,
        response.data.error || 'Erreur API',
        response.data
      );
    }
    
    return response.data as T;
  } catch (error: any) {
    const axiosError = error as AxiosError;
    
    if (axiosError.isAxiosError) {
      if (retries > 0 && axiosError.code === 'ECONNABORTED') {
        // Réessayer en cas de timeout
        return axiosApi(url, options, retries - 1);
      }
      
      if (axiosError.response) {
        throw new ApiError(
          axiosError.response.status,
          `Erreur API (${axiosError.response.status})`,
          axiosError.response.data
        );
      }
    }
    
    console.error('❌ Erreur:', error);
    throw error;
  }
}

async function sendTextMessage(question: string): Promise<TextResponse> {
  if (!question) {
    throw new ValidationError('Question vide');
  }

  const url = '/smartsearch-text';
  console.log('📤 URL:', url);
  
  return axiosApi<TextResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { question }
  });
}

async function sendMultimodalMessage(prompt: string, file: File): Promise<MultimodalResponse> {
  if (!prompt) {
    throw new ValidationError('Prompt vide');
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new ValidationError('Fichier trop grand (max 50MB)');
  }

  const url = '/smartsearch-multimodal';
  console.log('📤 URL:', url);
  
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('file', file);
  
  return axiosApi<MultimodalResponse>(url, {
    method: 'POST',
    data: formData
  });
}

async function getConversationHistory(): Promise<ConversationResponse> {
  const url = '/conversations';
  return axiosApi<ConversationResponse>(url, { method: 'GET' });
}

export const chatApi = {
  sendTextMessage,
  sendMultimodalMessage,
  getConversationHistory
} as const;