// server/api/smartsearch-text.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  console.log('🔄 Proxy smartsearch-text vers API')
  console.log('📦 Body reçu:', body)
  
  try {
    const response = await fetch('https://smartsearch.myfad.org/smartsearch/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nuxt-Proxy/1.0',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    console.log('📡 Statut API reçu:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API externe:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `Erreur API RAG: ${response.status} - ${errorText}`
      })
    }

    const data = await response.json()
    console.log('✅ Données reçues de l\'API:', data)
    
    return data
  } catch (error: any) {
    console.error('💥 Erreur dans le proxy:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur proxy: ${error.message}`
    })
  }
})