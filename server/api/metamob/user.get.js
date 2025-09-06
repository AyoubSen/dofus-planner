export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch(`https://api.metamob.fr/monstres`, {
      method: "GET",
      headers: {
        "HTTP-X-APIKEY": String(config.metamobApiKey),
        Accept: "application/json",
      },
    });

    return response;
  } catch (error) {
    console.error("Error fetching from Metamob API:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.statusMessage || "Failed to fetch data from Metamob API",
    });
  }
});
