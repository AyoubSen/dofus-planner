export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const query = getQuery(event);

    const baseUrl = String(config.equipmentsApiBase);
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          searchParams.append(`${key}[${index}]`, item);
        });
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });

    const fullUrl = searchParams.toString()
      ? `${baseUrl}?${searchParams.toString()}`
      : baseUrl;

    const response = await $fetch(fullUrl, {
      method: "GET",
    });

    return response;
  } catch (error) {
    console.error("Error fetching equipments:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch equipments",
    });
  }
});
