// server/api/multimodal.post.ts
export default defineEventHandler(async (event) => {
  console.log('🔄 MULTIMODAL PROXY - Début')
  console.log('📍 URL:', event.node.req.url)
  
  // Headers CORS
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  })
  
  try {
    console.log('📁 Processing multipart form data')
    
    // Lire les données multipart
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data received'
      })
    }
    
    // Reconstruire FormData pour l'API
    const newFormData = new FormData()
    
    for (const field of formData) {
      if (field.filename) {
        // C'est un fichier
        const blob = new Blob([field.data], { 
          type: field.type || 'application/octet-stream' 
        })
        newFormData.append(field.name || 'file', blob, field.filename)
        console.log(`📎 File: ${field.filename} (${field.data.length} bytes)`)
      } else {
        // C'est un champ texte
        const textValue = field.data.toString()
        newFormData.append(field.name || 'field', textValue)
        console.log(`📝 Field: ${field.name} = ${textValue.substring(0, 30)}...`)
      }
    }
    
    // Appel direct vers votre API Nginx
    console.log('🚀 Sending to: https://smartsearch.myfad.org/smartsearch/multimodal')
    
    const response = await fetch('https://smartsearch.myfad.org/smartsearch/multimodal', {
      method: 'POST',
      body: newFormData,
      // Pas de Content-Type - laisse fetch le définir automatiquement
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
      statusMessage: `Multimodal proxy error: ${error.message}`
    })
  }
})