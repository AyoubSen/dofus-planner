export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Effect ID is required",
      });
    }

    return await $fetch(`https://api.dofusdb.fr/effects/${id}`);
  } catch (error: any) {
    console.error("Error fetching DofusDB effect:", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || "Failed to fetch effect",
    });
  }
});
