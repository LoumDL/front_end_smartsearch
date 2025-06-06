export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  
  const slugArray = Array.isArray(slug) ? slug : [slug]
  const endpoint = slugArray.join('/')
  
  const API_BASE_URL = 'https://smartsearch.myfad.org'
  const url = `${API_BASE_URL}/smartsearch/${endpoint}`
  
  console.log('🔄 Proxy vers:', url)
  console.log('📦 Method:', event.method)
  
  try {
    // ✅ TIMEOUT COMPATIBLE avec AbortController manuel
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 secondes
    
    const fetchOptions: RequestInit = {
      method: event.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vercel-Nuxt-Proxy/1.0',
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    }

    if (event.method !== 'GET' && event.method !== 'HEAD') {
      const contentType = getHeader(event, 'content-type') || ''
      
      if (contentType.includes('multipart/form-data')) {
        const formData = await readMultipartFormData(event)
        
        if (formData) {
          const newFormData = new FormData()
          
          for (const field of formData) {
            if (field.filename) {
              const blob = new Blob([field.data], { 
                type: field.type || 'application/octet-stream' 
              })
              newFormData.append(field.name || 'file', blob, field.filename)
            } else {
              newFormData.append(field.name || 'field', field.data.toString())
            }
          }
          
          fetchOptions.body = newFormData
          // Supprimer Content-Type pour FormData
          delete fetchOptions.headers['Content-Type']
        }
      } else {
        const body = await readBody(event).catch(() => ({}))
        fetchOptions.body = JSON.stringify(body)
        console.log('📤 Body envoyé:', fetchOptions.body)
      }
    }

    console.log('🚀 Envoi requête...')
    
    const startTime = Date.now()
    const response = await fetch(url, fetchOptions)
    const endTime = Date.now()
    
    // Nettoyer le timeout
    clearTimeout(timeoutId)
    
    console.log('📡 Statut:', response.status)
    console.log('⏱️ Temps de réponse:', endTime - startTime, 'ms')
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue')
      console.error('❌ Erreur API:', response.status, errorText)
      
      throw createError({
        statusCode: response.status,
        statusMessage: `API Error: ${response.status}`,
        data: {
          error: errorText,
          url: url,
          status: response.status
        }
      })
    }

    const data = await response.json().catch(async () => {
      const text = await response.text()
      return { text: text }
    })
    
    console.log('✅ Réponse reçue avec succès')
    
    // Headers CORS
    setHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    })
    
    return data
    
  } catch (error: any) {
    console.error('💥 Erreur proxy:', error.name, error.message)
    
    if (error.name === 'AbortError') {
      throw createError({
        statusCode: 504,
        statusMessage: 'Timeout - L\'API met trop de temps à répondre',
        data: { error: 'Timeout', url }
      })
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Service indisponible',
        data: { error: 'Network error', url }
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du proxy',
      data: { error: error.message, url }
    })
  }
})
