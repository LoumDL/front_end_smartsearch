// api/chat.ts
export default {
  // ✅ UTILISE LE PROXY LOCAL - ne pas changer cette valeur
  baseUrl: '/api/smartsearch',

  // Envoyer un message texte à l'API
  async sendTextMessage(question: string) {
    try {
      const fullUrl = `${this.baseUrl}/text`
      console.log('📤 Proxy URL utilisée:', fullUrl) // Doit afficher "/api/smartsearch/text"
      
      const response = await $fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { question },
      })
     
      console.log('✅ Réponse via proxy:', response)
      return response
    } catch (error: any) {
      console.error('❌ Erreur proxy:', error)
      throw error
    }
  },
 
  // Envoyer une requête multimodale (avec fichier)
  async sendMultimodalMessage(prompt: string, file: File) {
    try {
      const fullUrl = `${this.baseUrl}/multimodal`
      console.log('📤 Proxy URL utilisée:', fullUrl) // Doit afficher "/api/smartsearch/multimodal"
      console.log('📁 Fichier:', file.name, 'Taille:', file.size)
      
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('file', file)
     
      const response = await $fetch(fullUrl, {
        method: 'POST',
        body: formData,
      })
     
      console.log('✅ Réponse via proxy:', response)
      return response
    } catch (error: any) {
      console.error('❌ Erreur proxy:', error)
      throw error
    }
  },
 
  // Récupérer l'historique des conversations
  async getConversationHistory() {
    return { conversations: [] }
  }
}