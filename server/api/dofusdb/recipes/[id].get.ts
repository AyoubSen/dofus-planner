import { dofusdbFetch } from "../../../services/dofusdb";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Recipe id is required",
      });
    }

    const query = getQuery(event);
    return await dofusdbFetch(`/recipes/${encodeURIComponent(id)}`, query);
  } catch (error: any) {
    console.error("Error fetching DofusDB recipe:", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || "Failed to fetch recipe",
    });
  }
});
