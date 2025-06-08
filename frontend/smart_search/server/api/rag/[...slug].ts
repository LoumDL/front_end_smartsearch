// server/api/rag/[...slug].ts - NOUVEAU NOM pour éviter les conflits
export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  const method = getMethod(event)
  
  console.log('🔄 RAG PROXY - Début')
  console.log('📍 Slug reçu:', slug)
  console.log('📍 URL complète:', event.node.req.url)
  console.log('📍 Method:', method)
  
  // Headers CORS
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  })
  
  // Gérer preflight OPTIONS
  if (method === 'OPTIONS') {
    console.log('✅ OPTIONS handled')
    return ''
  }
  
  // Construire l'URL vers votre API Nginx
  const endpoint = Array.isArray(slug) ? slug.join('/') : slug
  const targetUrl = `https://smartsearch.myfad.org/smartsearch/${endpoint}`
  
  console.log('🎯 URL cible:', targetUrl)
  
  try {
    let requestBody = null
    let requestHeaders: any = {}
    
    if (method !== 'GET') {
      const contentType = getHeader(event, 'content-type') || ''
      
      if (contentType.includes('multipart/form-data')) {
        // Gestion des fichiers multimodaux
        console.log('📁 Processing multipart data')
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
              console.log(`📝 Field: ${field.name} = ${textValue.substring(0, 30)}...`)
            }
          }
          
          requestBody = newFormData
        }
      } else {
        // Gestion des requêtes JSON (/text)
        console.log('📄 Processing JSON request')
        const body = await readBody(event)
        requestBody = JSON.stringify(body)
        requestHeaders['Content-Type'] = 'application/json'
        
        console.log('📤 Body:', JSON.stringify(body))
      }
    }
    
    console.log('🚀 Sending request to:', targetUrl)
    
    // Appel vers votre serveur Nginx
    const response = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body: requestBody,
    })
    
    console.log(`📡 Response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', response.status, errorText)
      
      throw createError({
        statusCode: response.status,
        statusMessage: `API Error: ${response.status} - ${errorText}`
      })
    }
    
    const data = await response.json()
    console.log('✅ Success - Processing time:', data.processing_time, 'seconds')
    
    return data
    
  } catch (error: any) {
    console.error('💥 Proxy Error:', error)
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: `API server unavailable: ${error.message}`
      })
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Internal proxy error: ${error.message}`
    })
  }
})