interface ApiResponse {
  reponse: string;
  status: string;
  processing_time: number;
}

class SmartSearchApi {
  private timeout: number = 600000; // 10 minutes

  async sendTextMessage(question: string): Promise<ApiResponse> {
    if (!question?.trim()) {
      throw new Error('La question ne peut pas être vide');
    }
    
    console.log('📤 Envoi requête TEXT via proxy unique Vercel...');
   
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
   
    try {
      // ✅ PROXY UNIQUE - Détecté automatiquement comme TEXT via Content-Type
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
        signal: controller.signal,
      });
     
      clearTimeout(timeoutId);
     
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP TEXT:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
     
      const data = await response.json();
      console.log('✅ Réponse TEXT reçue via proxy unique');
      return data;
     
    } catch (error: any) {
      clearTimeout(timeoutId);
     
      if (error.name === 'AbortError') {
        throw new Error('Timeout après 10 minutes');
      }
     
      console.error('💥 Erreur dans sendTextMessage:', error);
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  async sendMultimodalMessage(prompt: string, file: File): Promise<ApiResponse> {
    if (!prompt?.trim()) {
      throw new Error('Le prompt ne peut pas être vide');
    }
    
    if (!file) {
      throw new Error('Le fichier est requis');
    }

    console.log('📤 Envoi requête MULTIMODAL via proxy unique Vercel...');
    console.log('📁 Fichier:', file.name, 'Taille:', file.size);
   
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
   
    try {
      const formData = new FormData();
      formData.append('prompt', prompt.trim());
      formData.append('file', file);

      // ✅ PROXY UNIQUE - Détecté automatiquement comme MULTIMODAL via multipart/form-data
      const response = await fetch('/api/proxy', {
        method: 'POST',
        body: formData, // Content-Type automatiquement multipart/form-data
        signal: controller.signal,
      });
     
      clearTimeout(timeoutId);
     
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP MULTIMODAL:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
     
      const data = await response.json();
      console.log('✅ Réponse MULTIMODAL reçue via proxy unique');
      return data;
     
    } catch (error: any) {
      clearTimeout(timeoutId);
     
      if (error.name === 'AbortError') {
        throw new Error('Timeout après 10 minutes');
      }
     
      console.error('💥 Erreur dans sendMultimodalMessage:', error);
      throw new Error(`Erreur multimodal: ${error.message}`);
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
      console.error('❌ Test de connexion échoué:', error);
      return false;
    }
  }
}

// Singleton pour éviter les instances multiples
let apiInstance: SmartSearchApi | null = null;

function getApiInstance(): SmartSearchApi {
  if (!apiInstance) {
    apiInstance = new SmartSearchApi();
  }
  return apiInstance;
}

// Export principal - PROXY UNIQUE pour TEXT et MULTIMODAL
export default {
  async sendTextMessage(question: string): Promise<ApiResponse> {
    return getApiInstance().sendTextMessage(question);
  },
 
  async sendMultimodalMessage(prompt: string, file: File): Promise<ApiResponse> {
    return getApiInstance().sendMultimodalMessage(prompt, file);
  },
 
  async getConversationHistory(): Promise<{ conversations: any[] }> {
    return { conversations: [] };
  },
 
  async testConnection(): Promise<boolean> {
    return getApiInstance().testConnection();
  }
};