// api/chat.ts
interface ApiResponse {
  reponse: string;
  processing_time: number;
  error?: string;
}

class SmartSearchApi {
  private baseUrl: string = '';
  private fallbackUrl: string = 'https://smartsearch.myfad.org/smartsearch';
  private maxRetries: number = 2;
  private timeout: number = 25000;
  private initialized: boolean = false;

  private ensureInitialized() {
    if (!this.initialized) {
      try {
        // Utiliser la configuration Nuxt seulement si disponible
        if (typeof useRuntimeConfig === 'function') {
          const config = useRuntimeConfig();
          this.baseUrl = config.public.apiBaseUrl || '/api/smartsearch';
          console.log('🔧 API configurée:', this.baseUrl);
        } else {
          this.baseUrl = '/api/smartsearch';
          console.log('🔧 API configurée en mode fallback:', this.baseUrl);
        }
        this.initialized = true;
      } catch (error) {
        this.baseUrl = '/api/smartsearch';
        this.initialized = true;
        console.warn('⚠️ Configuration API par défaut utilisée');
      }
    }
  }

  private async makeRequest(endpoint: string, options: any, useProxy: boolean = true): Promise<any> {
    this.ensureInitialized();
    
    const url = useProxy 
      ? `${this.baseUrl}/${endpoint}`
      : `${this.fallbackUrl}/${endpoint}`;
    
    console.log(`📤 Request to:`, url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await $fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Response received');
      return response;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`❌ Error:`, error);
      throw error;
    }
  }

  async sendTextMessage(question: string): Promise<ApiResponse> {
    this.ensureInitialized();
    
    if (!question?.trim()) {
      throw new Error('La question ne peut pas être vide');
    }

    try {
      return await this.makeRequest('text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { question: question.trim() },
      });
    } catch (error: any) {
      console.error('Erreur API text:', error);
      throw new Error(`Erreur lors de l'envoi du message: ${error.message}`);
    }
  }

  async sendMultimodalMessage(prompt: string, file: File): Promise<ApiResponse> {
    this.ensureInitialized();
    
    if (!prompt?.trim()) {
      throw new Error('Le prompt ne peut pas être vide');
    }
    
    if (!file) {
      throw new Error('Un fichier doit être fourni');
    }

    // Validation du fichier
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux (max 10MB)');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non supporté. Utilisez JPG, PNG ou PDF.');
    }

    const formData = new FormData();
    formData.append('prompt', prompt.trim());
    formData.append('file', file);

    try {
      return await this.makeRequest('multimodal', {
        method: 'POST',
        body: formData,
      });
    } catch (error: any) {
      console.error('Erreur API multimodal:', error);
      throw new Error(`Erreur lors de l'envoi du fichier: ${error.message}`);
    }
  }

  async getConversationHistory(): Promise<{ conversations: any[] }> {
    return { conversations: [] };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendTextMessage('ping');
      return true;
    } catch (error) {
      console.error('Test de connexion échoué:', error);
      return false;
    }
  }
}

// Export de l'instance
let apiInstance: SmartSearchApi | null = null;

function getApiInstance(): SmartSearchApi {
  if (!apiInstance) {
    apiInstance = new SmartSearchApi();
  }
  return apiInstance;
}

// Export par défaut pour la compatibilité
export default {
  async sendTextMessage(question: string): Promise<ApiResponse> {
    const api = getApiInstance();
    return api.sendTextMessage(question);
  },
  
  async sendMultimodalMessage(prompt: string, file: File): Promise<ApiResponse> {
    const api = getApiInstance();
    return api.sendMultimodalMessage(prompt, file);
  },
  
  async getConversationHistory(): Promise<{ conversations: any[] }> {
    return { conversations: [] };
  },
  
  async testConnection(): Promise<boolean> {
    const api = getApiInstance();
    return api.testConnection();
  }
};