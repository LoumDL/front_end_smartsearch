// api/chat.ts
export default {
  // URL de base - sera définie dynamiquement depuis app.vue
  baseUrl: 'https://smartsearch.myfad.org',

  // Envoyer un message texte à l'API
  async sendTextMessage(question: string) {
    try {
      console.log('API URL utilisée:', `${this.baseUrl}/smartsearch/text`) // Debug
      
      const response = await $fetch(`${this.baseUrl}/smartsearch/text`, {
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
      console.log('API URL utilisée:', `${this.baseUrl}/smartsearch/multimodal`) // Debug
      
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('file', file)
     
      const response = await $fetch(`${this.baseUrl}/smartsearch/multimodal`, {
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