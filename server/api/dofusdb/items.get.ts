export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          searchParams.append(`${key}[${index}]`, String(item));
        });
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = searchParams.toString()
      ? `https://api.dofusdb.fr/items?${searchParams.toString()}`
      : "https://api.dofusdb.fr/items";

    return await $fetch(url);
  } catch (error: any) {
    console.error("Error fetching DofusDB items:", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || "Failed to fetch items",
    });
  }
});
