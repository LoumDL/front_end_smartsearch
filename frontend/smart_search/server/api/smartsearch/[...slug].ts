export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  const query = getQuery(event)
  
  const API_BASE_URL = process.env.NUXT_API_BASE_URL || 'https://smartsearch.myfad.org'
  const url = `${API_BASE_URL}/smartsearch/${slug.join('/')}`
  
  console.log('🔄 Proxy vers:', url)
  
  try {
    const fetchOptions: RequestInit = {
      method: event.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vercel-Nuxt-Proxy/1.0',
      },
      signal: AbortSignal.timeout(30000)
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
        }
      } else {
        const body = await readBody(event).catch(() => ({}))
        
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/json',
        }
        fetchOptions.body = JSON.stringify(body)
      }
    }

    const response = await fetch(url, fetchOptions)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue')
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
      return { text: await response.text() }
    })
    
    setHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    })
    
    return data
    
  } catch (error: any) {
    console.error('💥 Erreur proxy:', error)
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw createError({
        statusCode: 504,
        statusMessage: 'Timeout - L\'API met trop de temps à répondre',
        data: { error: 'Timeout', url }
      })
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Service indisponible - Impossible de contacter l\'API',
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
