import { toURLSearchParams } from "../utils/queryParams";

const DOFUSDB_BASE_URL = "https://api.dofusdb.fr";

type QueryValue = string | number | boolean | null | undefined;
type QueryInput = Record<string, QueryValue | QueryValue[]>;

function buildDofusdbUrl(path: string, query: QueryInput = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, DOFUSDB_BASE_URL);
  const searchParams = toURLSearchParams(query);

  if (searchParams.toString()) {
    url.search = searchParams.toString();
  }

  return url.toString();
}

export async function dofusdbFetch<T = unknown>(
  path: string,
  query: QueryInput = {}
): Promise<T> {
  const url = buildDofusdbUrl(path, query);
  return await $fetch(url, { method: "GET" }) as T;
}
