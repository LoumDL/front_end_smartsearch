// api/chat.ts
export default {
  // Récupération de l'URL via useRuntimeConfig (uniquement côté client/serveur Nuxt)
  getBaseUrl() {
    if (process.client || process.server) {
      const config = useRuntimeConfig()
      return config.public.apiBaseUrl
    }
    return 'https://smartsearch.myfad.org' // fallback
  },

  // Envoyer un message texte à l'API
  async sendTextMessage(question: string) {
    try {
      const baseUrl = this.getBaseUrl()
      
      const response = await $fetch(`${baseUrl}/smartsearch/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { question },
      })
     
      return response
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error)
      throw error
    }
  },
 
  // Envoyer une requête multimodale (avec fichier)
  async sendMultimodalMessage(prompt: string, file: File) {
    try {
      const baseUrl = this.getBaseUrl()
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('file', file)
     
      const response = await $fetch(`${baseUrl}/smartsearch/multimodal`, {
        method: 'POST',
        body: formData,
      })
     
      return response
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message multimodal:', error)
      throw error
    }
  },
 
  // Récupérer l'historique des conversations
  async getConversationHistory() {
    return { conversations: [] }
  }
}