type QueryValue = string | number;

interface AchievementCategory {
  id: QueryValue;
  parentId: QueryValue;
}

interface FetchAchievementsPageInput {
  limit: number;
  skip: number;
  search?: string;
  selectedCategoryId?: QueryValue | null;
  categories?: AchievementCategory[];
  signal?: AbortSignal;
}

interface PaginatedResponse<T = any> {
  total?: number;
  limit?: number;
  skip?: number;
  data?: T[];
}

interface FetchAllAchievementsForStatsInput {
  signal?: AbortSignal;
  force?: boolean;
  batchLimit?: number;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getChildCategoryIds(
  categories: AchievementCategory[],
  parentId: number
): number[] {
  return categories
    .filter((category) => Number(category.parentId) === parentId)
    .map((category) => Number(category.id))
    .filter((id) => Number.isFinite(id));
}

export const useAchievementsApi = () => {
  const allAchievementsCache = useState<any[]>(
    "achievements-all-cache-data",
    () => []
  );
  const allAchievementsCacheTotal = useState<number>(
    "achievements-all-cache-total",
    () => 0
  );
  const allAchievementsCacheReady = useState<boolean>(
    "achievements-all-cache-ready",
    () => false
  );

  const buildAchievementsQueryParams = ({
    limit,
    skip,
    search,
    selectedCategoryId,
    categories = [],
  }: Omit<FetchAchievementsPageInput, "signal">) => {
    const params = new URLSearchParams();
    params.append("$limit", String(limit));
    params.append("$skip", String(skip));

    if (search) {
      params.append("slug.fr[$search]", search);
    }

    const normalizedCategoryId = toNumberOrNull(selectedCategoryId);
    if (normalizedCategoryId !== null) {
      const childIds = getChildCategoryIds(categories, normalizedCategoryId);
      if (childIds.length > 0) {
        childIds.forEach((id) => {
          params.append("categoryId[$in][]", String(id));
        });
      } else {
        params.append("categoryId", String(normalizedCategoryId));
      }
    }

    return params;
  };

  const fetchAchievementsPage = async ({
    limit,
    skip,
    search,
    selectedCategoryId,
    categories = [],
    signal,
  }: FetchAchievementsPageInput): Promise<PaginatedResponse> => {
    const params = buildAchievementsQueryParams({
      limit,
      skip,
      search,
      selectedCategoryId,
      categories,
    });

    return await $fetch(`/api/achievements?${params.toString()}`, {
      signal,
    });
  };

  const fetchAchievementCategories = async (
    limit = 200,
    signal?: AbortSignal
  ): Promise<PaginatedResponse> => {
    return await $fetch(`/api/achievements/categories?$limit=${limit}`, {
      signal,
    });
  };

  const fetchAllAchievementsForStats = async ({
    signal,
    force = false,
    batchLimit = 50,
  }: FetchAllAchievementsForStatsInput = {}) => {
    if (!force && allAchievementsCacheReady.value) {
      return {
        data: allAchievementsCache.value,
        total: allAchievementsCacheTotal.value,
      };
    }

    const allAchievements: any[] = [];
    let skip = 0;
    let total = 0;

    while (true) {
      const response = await fetchAchievementsPage({
        limit: batchLimit,
        skip,
        categories: [],
        signal,
      });

      const batch = response.data || [];
      total = typeof response.total === "number" ? response.total : total;
      allAchievements.push(...batch);

      if (batch.length < batchLimit) break;
      if (total > 0 && allAchievements.length >= total) break;

      skip += batch.length;
    }

    allAchievementsCache.value = allAchievements;
    allAchievementsCacheTotal.value = total || allAchievements.length;
    allAchievementsCacheReady.value = true;

    return {
      data: allAchievements,
      total: allAchievementsCacheTotal.value,
    };
  };

  return {
    buildAchievementsQueryParams,
    fetchAchievementsPage,
    fetchAchievementCategories,
    fetchAllAchievementsForStats,
  };
};
