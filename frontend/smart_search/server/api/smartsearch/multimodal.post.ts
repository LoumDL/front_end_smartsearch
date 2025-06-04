// server/api/smartsearch/multimodal.post.ts
export default defineEventHandler(async (event) => {
  // URL de votre API RAG
  const API_BASE_URL = 'https://smartsearch.myfad.org'
  const url = `${API_BASE_URL}/smartsearch/multimodal`
  
  console.log('🔄 Proxy multimodal vers:', url)
  
  try {
    // Récupération des données multipart
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucune donnée reçue'
      })
    }

    // Reconstruction du FormData pour l'API
    const newFormData = new FormData()
    
    for (const field of formData) {
      if (field.filename) {
        // C'est un fichier
        const blob = new Blob([field.data], { type: field.type || 'application/octet-stream' })
        newFormData.append(field.name || 'file', blob, field.filename)
        console.log('📁 Fichier ajouté:', field.filename, field.type)
      } else {
        // C'est un champ texte
        newFormData.append(field.name || 'field', field.data.toString())
        console.log('📝 Champ ajouté:', field.name, field.data.toString())
      }
    }
    
    const response = await fetch(url, {
      method: 'POST',
      body: newFormData,
      headers: {
        'User-Agent': 'Nuxt-Proxy/1.0',
      }
    })
    
    console.log('📡 Statut multimodal reçu:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API multimodal:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `Erreur API: ${response.status} - ${errorText}`
      })
    }

    const data = await response.json()
    console.log('✅ Réponse multimodal reçue:', data)
    
    return data
  } catch (error: any) {
    console.error('💥 Erreur lors du proxy multimodal:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur proxy multimodal: ${error.message}`
    })
  }
})