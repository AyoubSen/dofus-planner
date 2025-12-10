export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    
    // Debug: Check if key is loaded
    console.log("API Key loaded:", !!config.metamobApiKey, "Length:", config.metamobApiKey?.length);
    
    const response = await $fetch(`https://api.metamob.fr/monstres`, {
      method: "GET",
      headers: {
        "HTTP-X-APIKEY": config.metamobApiKey, 
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