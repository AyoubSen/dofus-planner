type QueryValue = string | number | boolean | null | undefined;
type QueryInput = Record<string, QueryValue | QueryValue[]>;

export function toURLSearchParams(query: QueryInput = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          // Preserve the original key (e.g. "categoryId[$in][]") for repeated values.
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams;
}
