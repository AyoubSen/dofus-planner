import { dofusdbFetch } from "../../services/dofusdb";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as Record<
      string,
      string | number | boolean | null | undefined | Array<string | number | boolean | null | undefined>
    >;

    return await dofusdbFetch("/monsters", {
      lang: "fr",
      ...query,
    });
  } catch (error: any) {
    console.error("Error fetching DofusDB monsters:", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || "Failed to fetch monsters",
    });
  }
});
