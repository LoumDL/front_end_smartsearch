// api/chat.ts - Client adapté pour votre FastAPI
interface ApiResponse {
  reponse: string;
  status: string;
  processing_time: number;
  source?: string; // Pour le cache multimodal
}

interface ErrorResponse {
  status: string;
  reponse: string;
}

class SmartSearchApi {
  private baseUrl: string = 'https://smartsearch.myfad.org';
  private timeout: number = 600000; // 10 minutes pour LLM

  private async makeRequest(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🚀 Requête vers:`, url);
    console.log(`📤 Method:`, options.method);
    
    // Timeout manuel compatible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit', // Pas de cookies nécessaires
      });
      
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      const requestTime = endTime - startTime;
      
      console.log(`📡 Statut:`, response.status);
      console.log(`⏱️ Temps requête:`, requestTime, 'ms');
      
      // Lire le contenu de la réponse
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: true, message: text };
      }
      
      // Gérer les erreurs HTTP
      if (!response.ok) {
        console.error('❌ Erreur API:', response.status, data);
        throw new Error(data.reponse || data.detail || `HTTP ${response.status}`);
      }
      
      // Vérifier si l'API a retourné une erreur
      if (data.status === 'error') {
        throw new Error(data.reponse || 'Erreur API');
      }
      
      console.log('✅ Réponse reçue avec succès');
      return data;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout après 10 minutes - Le LLM met trop de temps à répondre');
      }
      
      console.error('❌ Erreur requête:', error);
      throw error;
    }
  }

  async sendTextMessage(question: string): Promise<ApiResponse> {
    if (!question?.trim()) {
      throw new Error('La question ne peut pas être vide');
    }

    console.log('📝 Envoi question au LLM...');
    console.log('💭 Question:', question.substring(0, 50) + (question.length > 50 ? '...' : ''));
    
    return this.makeRequest('/smartsearch/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        question: question.trim() 
      }),
    });
  }

  async sendMultimodalMessage(prompt: string, file: File): Promise<ApiResponse> {
    if (!prompt?.trim()) {
      throw new Error('Le prompt ne peut pas être vide');
    }
    
    if (!file) {
      throw new Error('Un fichier doit être fourni');
    }

    // Validation du fichier selon votre API
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux (max 10MB)');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non supporté: ${file.type}. Types supportés: ${allowedTypes.join(', ')}`);
    }

    console.log('📎 Envoi fichier multimodal au LLM...');
    console.log('💭 Prompt:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));
    console.log('📄 Fichier:', file.name, `(${this.formatFileSize(file.size)})`);
    console.log('🏷️ Type:', file.type);

    // Créer FormData selon votre API FastAPI
    const formData = new FormData();
    formData.append('prompt', prompt.trim());
    formData.append('file', file);

    return this.makeRequest('/smartsearch/multimodal', {
      method: 'POST',
      // Pas de Content-Type header pour FormData - le navigateur le gère
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
  }

  async getConversationHistory(): Promise<{ conversations: any[] }> {
    // Votre API n'a pas cet endpoint, on retourne vide
    return { conversations: [] };
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Test de connexion...');
      await this.sendTextMessage('ping');
      console.log('✅ Connexion OK');
      return true;
    } catch (error) {
      console.error('❌ Test de connexion échoué:', error);
      return false;
    }
  }

  // Méthode utilitaire pour formater la taille des fichiers
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // Méthode pour vérifier si l'API est disponible
  async checkApiHealth(): Promise<{ available: boolean; message: string }> {
    try {
      // Test simple avec une question courte
      const response = await this.sendTextMessage('test');
      return {
        available: true,
        message: `API disponible - Temps de réponse: ${response.processing_time?.toFixed(2)}s`
      };
    } catch (error: any) {
      return {
        available: false,
        message: `API indisponible: ${error.message}`
      };
    }
  }
}

// Export singleton
let apiInstance: SmartSearchApi | null = null;

function getApiInstance(): SmartSearchApi {
  if (!apiInstance) {
    apiInstance = new SmartSearchApi();
  }
  return apiInstance;
}

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
  },

  async checkApiHealth(): Promise<{ available: boolean; message: string }> {
    const api = getApiInstance();
    return api.checkApiHealth();
  }
};