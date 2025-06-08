// server/api/proxy.post.ts - Proxy unique pour éviter tous conflits
export default defineEventHandler(async (event) => {
  console.log('🔄 PROXY UNIQUE - Début')
  console.log('📍 URL complète:', event.node.req.url)
  
  // Headers CORS
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  })
  
  // Gérer preflight
  if (getMethod(event) === 'OPTIONS') {
    console.log('✅ OPTIONS handled')
    return ''
  }
  
  try {
    const contentType = getHeader(event, 'content-type') || ''
    console.log('📋 Content-Type:', contentType)
    
    let targetUrl = ''
    let requestBody = null
    let requestHeaders: any = {}
    
    if (contentType.includes('multipart/form-data')) {
      // C'est une requête multimodale
      console.log('📁 Détecté: Requête MULTIMODAL')
      targetUrl = 'https://smartsearch.myfad.org/smartsearch/multimodal'
      
      const formData = await readMultipartFormData(event)
      
      if (formData) {
        const newFormData = new FormData()
        
        for (const field of formData) {
          if (field.filename) {
            const blob = new Blob([field.data], { 
              type: field.type || 'application/octet-stream' 
            })
            newFormData.append(field.name || 'file', blob, field.filename)
            console.log(`📎 File: ${field.filename}`)
          } else {
            const textValue = field.data.toString()
            newFormData.append(field.name || 'field', textValue)
            console.log(`📝 Field: ${field.name}`)
          }
        }
        
        requestBody = newFormData
      }
    } else {
      // C'est une requête text
      console.log('📄 Détecté: Requête TEXT')
      targetUrl = 'https://smartsearch.myfad.org/smartsearch/text'
      
      const body = await readBody(event)
      requestBody = JSON.stringify(body)
      requestHeaders['Content-Type'] = 'application/json'
      
      console.log('📤 Question:', body?.question?.substring(0, 50) + '...')
    }
    
    console.log('🚀 Envoi vers:', targetUrl)
    
    // Appel vers votre API Nginx
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
    })
    
    console.log(`📡 Réponse: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API:', response.status, errorText)
      
      throw createError({
        statusCode: response.status,
        statusMessage: `API Error: ${response.status} - ${errorText}`
      })
    }
    
    const data = await response.json()
    console.log('✅ Succès - Temps:', data.processing_time, 's')
    
    return data
    
  } catch (error: any) {
    console.error('💥 Erreur proxy:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Proxy error: ${error.message}`
    })
  }
})