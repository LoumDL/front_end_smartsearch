// server/api/text.post.ts
export default defineEventHandler(async (event) => {
  console.log('🔄 TEXT PROXY - Début')
  console.log('📍 URL:', event.node.req.url)
  
  // Headers CORS
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  })
  
  try {
    const body = await readBody(event)
    console.log('📤 Question:', body?.question?.substring(0, 50) + '...')
    
    // Appel direct vers votre API Nginx
    const response = await fetch('https://smartsearch.myfad.org/smartsearch/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    console.log(`📡 Response: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', response.status, errorText)
      
      throw createError({
        statusCode: response.status,
        statusMessage: errorText
      })
    }
    
    const data = await response.json()
    console.log('✅ Success - Time:', data.processing_time, 's')
    
    return data
    
  } catch (error: any) {
    console.error('💥 Proxy Error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Proxy error: ${error.message}`
    })
  }
})