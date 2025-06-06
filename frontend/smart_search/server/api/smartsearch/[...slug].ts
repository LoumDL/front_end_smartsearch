// server/api/smartsearch/[...slug].ts
export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  const body = await readBody(event).catch(() => ({}))
  const query = getQuery(event)
  
  // URL de votre API RAG
  const API_BASE_URL = 'https://smartsearch.myfad.org'
  const url = `${API_BASE_URL}/smartsearch/${slug.join('/')}`
  
  console.log('🔄 Proxy vers:', url)
  console.log('📦 Body reçu:', body)
  
  try {
    // Configuration de la requête vers l'API
    const fetchOptions: any = {
      method: event.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nuxt-Proxy/1.0',
        'Accept': 'application/json',
      }
    }

    // Gestion du body pour les requêtes POST
    if (event.method !== 'GET') {
      // Vérification si c'est une requête multipart (fichier)
      const contentType = getHeader(event, 'content-type') || ''
      
      if (contentType.includes('multipart/form-data')) {
        // Pour les fichiers - on récupère le body brut
        const formData = await readMultipartFormData(event)
        if (formData) {
          const newFormData = new FormData()
          
          for (const field of formData) {
            if (field.filename) {
              // C'est un fichier
              const blob = new Blob([field.data], { type: field.type || 'application/octet-stream' })
              newFormData.append(field.name || 'file', blob, field.filename)
            } else {
              // C'est un champ texte
              newFormData.append(field.name || 'field', field.data.toString())
            }
          }
          
          fetchOptions.body = newFormData
          delete fetchOptions.headers['Content-Type'] // Laisse fetch définir le Content-Type
        }
      } else {
        // Pour les requêtes JSON
        fetchOptions.body = JSON.stringify(body)
      }
    }

    console.log('🚀 Envoi requête avec options:', fetchOptions)
    
    const response = await fetch(url, fetchOptions)
    
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
    
    // Gestion spécifique des erreurs réseau
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: `Impossible de contacter l'API RAG: ${error.message}`
      })
    }
    
    if (error.name === 'FetchError') {
      throw createError({
        statusCode: 502,
        statusMessage: `Erreur de réseau avec l'API RAG: ${error.message}`
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur interne du proxy: ${error.message}`
    })
  }
})