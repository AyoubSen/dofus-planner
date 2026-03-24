import { dofusdbFetch } from "../../../services/dofusdb";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Monster ID is required",
      });
    }

    const query = getQuery(event) as Record<
      string,
      string | number | boolean | null | undefined | Array<string | number | boolean | null | undefined>
    >;

    return await dofusdbFetch(`/monsters/${encodeURIComponent(id)}`, {
      lang: "fr",
      ...query,
    });
  } catch (error: any) {
    console.error("Error fetching DofusDB monster:", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || "Failed to fetch monster",
    });
  }
});
