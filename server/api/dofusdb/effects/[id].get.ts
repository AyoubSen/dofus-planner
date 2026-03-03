import { dofusdbFetch } from "../../../services/dofusdb";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Effect ID is required",
      });
    }

    return await dofusdbFetch(`/effects/${encodeURIComponent(id)}`);
  } catch (error: any) {
    console.error("Error fetching DofusDB effect:", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || "Failed to fetch effect",
    });
  }
});
