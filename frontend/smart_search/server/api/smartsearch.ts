export default defineEventHandler(async (event) => {
  console.log('🔄 Proxy Vercel vers smartsearch.myfad.org')
  
  // Headers CORS explicites
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  })

  // Gérer preflight OPTIONS
  if (getMethod(event) === 'OPTIONS') {
    return ''
  }

  try {
    const body = await readBody(event)
    console.log('📤 Question:', body?.question?.substring(0, 30) + '...')
    
    const response = await fetch('https://smartsearch.myfad.org/smartsearch/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API:', response.status, errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: errorText
      })
    }

    const data = await response.json()
    console.log('✅ Réponse LLM reçue après', data.processing_time?.toFixed(2), 'secondes')
    
    return data
    
  } catch (error: any) {
    console.error('💥 Erreur proxy:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erreur proxy'
    })
  }
})
