// server/api/smartsearch/[...slug].ts
export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  const method = getMethod(event)
  
  // Headers CORS
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  })
  
  // Gérer preflight OPTIONS
  if (method === 'OPTIONS') {
    return ''
  }
  
  // Construire l'URL de destination selon votre config Nginx
  const endpoint = Array.isArray(slug) ? slug.join('/') : slug
  const targetUrl = `https://smartsearch.myfad.org/smartsearch/${endpoint}`
  
  console.log(`🔄 Proxy ${method} vers:`, targetUrl)
  
  try {
    let requestBody = null
    let requestHeaders: any = {}
    
    // Gestion différenciée selon le type de requête
    if (method !== 'GET') {
      const contentType = getHeader(event, 'content-type') || ''
      
      if (contentType.includes('multipart/form-data')) {
        // Pour les fichiers multimodaux
        console.log('📁 Traitement requête multipart/form-data')
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
              const textValue = field.data.toString()
              newFormData.append(field.name || 'field', textValue)
              console.log(`📝 Champ ajouté: ${field.name} = ${textValue.substring(0, 50)}...`)
            }
          }
          
          requestBody = newFormData
          // Ne pas définir Content-Type pour FormData, le fetch le fait automatiquement
        }
      } else {
        // Pour les requêtes JSON (endpoint /text)
        console.log('📄 Traitement requête JSON')
        const body = await readBody(event)
        requestBody = JSON.stringify(body)
        requestHeaders['Content-Type'] = 'application/json'
        
        console.log('📤 Données envoyées:', JSON.stringify(body).substring(0, 100) + '...')
      }
    }
    
    // Effectuer la requête vers l'API externe
    const response = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body: requestBody,
    })
    
    console.log(`📡 Réponse reçue: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API externe:', response.status, errorText)
      
      throw createError({
        statusCode: response.status,
        statusMessage: `Erreur API externe: ${errorText}`
      })
    }
    
    const data = await response.json()
    console.log('✅ Succès - Temps de traitement:', data.processing_time?.toFixed(2) + 's')
    
    return data
    
  } catch (error: any) {
    console.error('💥 Erreur dans le proxy:', error)
    
    // Gestion spécifique des erreurs réseau
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: `API externe inaccessible: ${error.message}`
      })
    }
    
    if (error.name === 'FetchError') {
      throw createError({
        statusCode: 502,
        statusMessage: `Erreur réseau: ${error.message}`
      })
    }
    
    // Relancer l'erreur si c'est déjà une erreur HTTP
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur interne du proxy: ${error.message}`
    })
  }
})