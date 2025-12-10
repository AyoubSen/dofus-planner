export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    
    console.log("config:", config)
    
    const response = await $fetch(`https://api.metamob.fr/monstres`, {
      method: "GET",
      headers: {
        "HTTP-X-APIKEY": "8b6111-32b90a-4c12fe-81c4a7-5ed061 ", 
        "Accept": "application/json",
      },
    });

    return response;
  } catch (error) {
    console.error("Error fetching from Metamob API:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Failed to fetch data from Metamob API",
    });
  }
});