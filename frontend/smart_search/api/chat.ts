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

    console.log('📤 Envoi via proxy Vercel...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch('/api/smartsearch', {
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
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Réponse reçue via proxy');
      return data;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout après 10 minutes');
      }
      
      throw new Error(`Erreur: ${error.message}`);
    }
  }

  async sendMultimodalMessage(prompt: string, file: File): Promise<ApiResponse> {
    throw new Error('Multimodal pas encore implémenté');
  }

  async getConversationHistory(): Promise<{ conversations: any[] }> {
    return { conversations: [] };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendTextMessage('ping');
      return true;
    } catch (error) {
      return false;
    }
  }
}

let apiInstance: SmartSearchApi | null = null;

function getApiInstance(): SmartSearchApi {
  if (!apiInstance) {
    apiInstance = new SmartSearchApi();
  }
  return apiInstance;
}

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
