// server/api/smartsearch/text.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // URL de votre API RAG
  const API_BASE_URL = 'https://smartsearch.myfad.org'
  const url = `${API_BASE_URL}/smartsearch/text`
  
  console.log('🔄 Proxy vers:', url)
  console.log('📦 Body reçu:', body)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nuxt-Proxy/1.0',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    console.log('📡 Statut reçu:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `Erreur API: ${response.status} - ${errorText}`
      })
    }

    const data = await response.json()
    console.log('✅ Réponse reçue:', data)
    
    return data
  } catch (error: any) {
    console.error('💥 Erreur lors du proxy:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur proxy: ${error.message}`
    })
  }
})