import { dofusdbFetch } from "../../services/dofusdb";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as Record<string, string | number | boolean | null | undefined | Array<string | number | boolean | null | undefined>>;
    return await dofusdbFetch("/achievements", query);
  } catch (error: any) {
    console.error("Error fetching achievements:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch achievements",
    });
  }
});
