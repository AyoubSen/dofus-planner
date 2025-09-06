export default defineEventHandler(async (event) => {
  return {
    message: 'Server API is working!',
    timestamp: new Date().toISOString()
  }
}) 