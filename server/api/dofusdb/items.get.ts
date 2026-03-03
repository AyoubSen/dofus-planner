import { dofusdbFetch } from "../../services/dofusdb";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    return await dofusdbFetch("/items", query);
  } catch (error: any) {
    console.error("Error fetching DofusDB items:", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || "Failed to fetch items",
    });
  }
});
