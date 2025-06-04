// api/chat.ts
export default {
  // ✅ Utilise les nouvelles routes simplifiées
  baseUrl: '/api',

  async sendTextMessage(question: string) {
    try {
      const fullUrl = `${this.baseUrl}/smartsearch-text`
      console.log('📤 URL Proxy simplifiée:', fullUrl)
      
      const response = await $fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { question },
      })
     
      console.log('✅ Réponse reçue via proxy:', response)
      return response
    } catch (error: any) {
      console.error('❌ Erreur proxy simplifié:', error)
      throw error
    }
  },
 
  async sendMultimodalMessage(prompt: string, file: File) {
    try {
      const fullUrl = `${this.baseUrl}/smartsearch-multimodal`
      console.log('📤 URL Proxy multimodal simplifiée:', fullUrl)
      console.log('📁 Fichier à envoyer:', file.name, 'Taille:', file.size)
      
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('file', file)
     
      const response = await $fetch(fullUrl, {
        method: 'POST',
        body: formData,
      })
     
      console.log('✅ Réponse multimodal reçue:', response)
      return response
    } catch (error: any) {
      console.error('❌ Erreur proxy multimodal:', error)
      throw error
    }
  },
 
  async getConversationHistory() {
    return { conversations: [] }
  }
}