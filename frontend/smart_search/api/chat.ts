// api/chat.ts
export default {
  // URL de base - sera définie dynamiquement depuis app.vue (maintenant pointe vers le proxy)
  baseUrl: '/api/smartsearch',

  // Envoyer un message texte à l'API
  async sendTextMessage(question: string) {
    try {
      console.log('📤 API URL utilisée:', `${this.baseUrl}/text`)
      
      const response = await $fetch(`${this.baseUrl}/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { question },
      })
     
      console.log('✅ Réponse reçue:', response)
      return response
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi du message:', error)
      throw error
    }
  },
 
  // Envoyer une requête multimodale (avec fichier)
  async sendMultimodalMessage(prompt: string, file: File) {
    try {
      console.log('📤 API URL utilisée:', `${this.baseUrl}/multimodal`)
      console.log('📁 Fichier:', file.name, 'Taille:', file.size)
      
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('file', file)
     
      const response = await $fetch(`${this.baseUrl}/multimodal`, {
        method: 'POST',
        body: formData,
        // Pas de Content-Type pour FormData - laisse le navigateur le définir
      })
     
      console.log('✅ Réponse reçue:', response)
      return response
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi du message multimodal:', error)
      throw error
    }
  },
 
  // Récupérer l'historique des conversations
  async getConversationHistory() {
    return { conversations: [] }
  }
}