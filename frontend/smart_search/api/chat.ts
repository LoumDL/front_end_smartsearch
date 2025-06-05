import { useRuntimeConfig } from '#app';
import { RequestInit } from 'node-fetch';

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

// Fonction utilitaire pour le timeout
function timeoutPromise(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });
}

async function fetchApi<T extends BaseApiResponse>(
  url: string,
  options: RequestInit = {},
  retries = config.retries
): Promise<T> {
  try {
    // Ajouter un timeout
    const controller = new AbortController();
    const { signal } = controller;
    
    // Créer une promesse qui se résout au premier succès ou échec
    const response = await Promise.race([
      fetch(url, {
        ...options,
        headers: {
          ...config.headers,
          ...options.headers
        },
        credentials: 'include',
        signal
      }),
      timeoutPromise(config.timeout)
    ]);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `Erreur API (${response.status})`,
        await response.json().catch(() => null)
      );
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new ApiError(
        400,
        data.error || 'Erreur API',
        data
      );
    }
    
    return data as T;
  } catch (error: any) {
    if (retries > 0 && error.name === 'NetworkError') {
      // Réessayer en cas d'erreur réseau
      return fetchApi(url, options, retries - 1);
    }
    
    console.error('❌ Erreur:', error);
    throw error;
  }
}

async function sendTextMessage(question: string): Promise<TextResponse> {
  if (!question) {
    throw new ValidationError('Question vide');
  }

  const url = `${config.baseURL}/smartsearch-text`;
  console.log('📤 URL:', url);
  
  return fetchApi<TextResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
}

async function sendMultimodalMessage(prompt: string, file: File): Promise<MultimodalResponse> {
  if (!prompt) {
    throw new ValidationError('Prompt vide');
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new ValidationError('Fichier trop grand (max 50MB)');
  }

  const url = `${config.baseURL}/smartsearch-multimodal`;
  console.log('📤 URL:', url);
  
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('file', file);
  
  return fetchApi<MultimodalResponse>(url, {
    method: 'POST',
    body: formData
  });
}

async function getConversationHistory(): Promise<ConversationResponse> {
  const url = `${config.baseURL}/conversations`;
  return fetchApi<ConversationResponse>(url, { method: 'GET' });
}

export const chatApi = {
  sendTextMessage,
  sendMultimodalMessage,
  getConversationHistory
} as const;