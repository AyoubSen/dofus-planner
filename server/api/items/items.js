import { toURLSearchParams } from "../../utils/queryParams";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const query = getQuery(event);

    const baseUrl = String(config.equipmentsApiBase);
    const searchParams = toURLSearchParams(query);

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
