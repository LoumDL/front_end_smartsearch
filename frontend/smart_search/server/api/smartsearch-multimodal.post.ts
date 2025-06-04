// server/api/smartsearch-multimodal.post.ts
export default defineEventHandler(async (event) => {
  console.log('🔄 Proxy smartsearch-multimodal vers API')
  
  try {
    // Récupération des données multipart
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucune donnée multipart reçue'
      })
    }

    // Reconstruction du FormData pour l'API
    const newFormData = new FormData()
    
    for (const field of formData) {
      if (field.filename) {
        // C'est un fichier
        const blob = new Blob([field.data], { type: field.type || 'application/octet-stream' })
        newFormData.append(field.name || 'file', blob, field.filename)
        console.log('📁 Fichier traité:', field.filename, field.type)
      } else {
        // C'est un champ texte
        newFormData.append(field.name || 'field', field.data.toString())
        console.log('📝 Champ traité:', field.name, field.data.toString())
      }
    }
    
    const response = await fetch('https://smartsearch.myfad.org/smartsearch/multimodal', {
      method: 'POST',
      body: newFormData,
      headers: {
        'User-Agent': 'Nuxt-Proxy/1.0',
      }
    })
    
    console.log('📡 Statut API multimodal reçu:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API multimodal externe:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `Erreur API RAG multimodal: ${response.status} - ${errorText}`
      })
    }

    const data = await response.json()
    console.log('✅ Données multimodal reçues:', data)
    
    return data
  } catch (error: any) {
    console.error('💥 Erreur dans le proxy multimodal:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur proxy multimodal: ${error.message}`
    })
  }
})