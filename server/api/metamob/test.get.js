export default defineEventHandler(() => {
  return {
    message: 'Metamob API route is working!',
    timestamp: new Date().toISOString()
  }
}) 