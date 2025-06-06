export default defineEventHandler(async (event) => {
  return {
    message: 'API Server fonctionne !',
    timestamp: new Date().toISOString(),
    method: event.method,
    url: event.path
  }
})
