// server/api/smartsearch/[...slug].ts
export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  const query = getQuery(event)
  
  // URL de votre API RAG - utiliser variable d'environnement
  const API_BASE_URL = process.env.NUXT_API_BASE_URL || 'https://smartsearch.myfad.org'
  const url = `${API_BASE_URL}/smartsearch/${slug.join('/')}`
  
  console.log('🔄 Proxy vers:', url)
  console.log('📦 Method:', event.method)
  
  try {
    // Configuration de base avec timeout
    const fetchOptions: RequestInit = {
      method: event.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vercel-Nuxt-Proxy/1.0',
        // Transférer certains headers du client
        ...(getHeader(event, 'authorization') && { 'Authorization': getHeader(event, 'authorization') }),
        ...(getHeader(event, 'x-api-key') && { 'X-API-Key': getHeader(event, 'x-api-key') }),
      },
      // Timeout de 30 secondes pour Vercel
      signal: AbortSignal.timeout(30000)
    }

    // Gestion du body selon le type de requête
    if (event.method !== 'GET' && event.method !== 'HEAD') {
      const contentType = getHeader(event, 'content-type') || ''
      
      if (contentType.includes('multipart/form-data')) {
        // Gestion des fichiers multipart
        console.log('📁 Traitement fichier multipart')
        const formData = await readMultipartFormData(event)
        
        if (formData) {
          const newFormData = new FormData()
          
          for (const field of formData) {
            if (field.filename) {
              // Fichier
              const blob = new Blob([field.data], { 
                type: field.type || 'application/octet-stream' 
              })
              newFormData.append(field.name || 'file', blob, field.filename)
              console.log(`📎 Fichier ajouté: ${field.filename} (${field.data.length} bytes)`)
            } else {
              // Champ texte
              newFormData.append(field.name || 'field', field.data.toString())
              console.log(`📝 Champ ajouté: ${field.name}`)
            }
          }
          
          fetchOptions.body = newFormData
          // Ne pas définir Content-Type pour FormData
        }
      } else {
        // Requête JSON
        const body = await readBody(event).catch(() => ({}))
        console.log('📦 Body JSON:', body)
        
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/json',
        }
        fetchOptions.body = JSON.stringify(body)
      }
    }

    console.log('🚀 Envoi requête...')
    
    const response = await fetch(url, fetchOptions)
    
    console.log('📡 Statut:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue')
      console.error('❌ Erreur API:', response.status, errorText)
      
      // Retourner une erreur structurée
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

    // Essayer de parser en JSON
    const data = await response.json().catch(async () => {
      // Si ce n'est pas du JSON, retourner le texte
      return { text: await response.text() }
    })
    
    console.log('✅ Réponse reçue avec succès')
    
    // Ajouter des headers CORS pour éviter les problèmes côté client
    setHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    })
    
    return data
    
  } catch (error: any) {
    console.error('💥 Erreur proxy:', error)
    
    // Gestion spécifique des timeouts
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw createError({
        statusCode: 504,
        statusMessage: 'Timeout - L\'API met trop de temps à répondre',
        data: { error: 'Timeout', url }
      })
    }
    
    // Gestion des erreurs réseau
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Service indisponible - Impossible de contacter l\'API',
        data: { error: 'Network error', url }
      })
    }
    
    // Gestion des erreurs fetch
    if (error.name === 'FetchError' || error.name === 'TypeError') {
      throw createError({
        statusCode: 502,
        statusMessage: 'Erreur de communication avec l\'API',
        data: { error: error.message, url }
      })
    }
    
    // Erreur générique
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du proxy',
      data: { error: error.message, url }
    })
  }
})