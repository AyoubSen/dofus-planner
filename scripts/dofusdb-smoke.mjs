#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://api.dofusdb.fr";
const DEFAULT_TIMEOUT_MS = 12000;

const ENDPOINTS = [
  "/achievement-categories",
  "/achievement-objectives",
  "/achievement-rewards",
  "/achievements",
  "/almanax",
  "/almanax-calendars",
  "/alignment-ranks",
  "/alignment-sides",
  "/alliance-rights",
  "/alterations",
  "/areas",
  "/breeds",
  "/challenges",
  "/characteristics",
  "/collectables",
  "/companions",
  "/criterion/{criteria}",
  "/custom-mode-breed-spells",
  "/documents",
  "/dungeons",
  "/effects",
  "/emoticons",
  "/feature-descriptions",
  "/finish-moves",
  "/guild-rights",
  "/havenbag-furnitures",
  "/havenbag-themes",
  "/hints",
  "/img/maps/{scale}/{mapId}.jpg",
  "/info-messages",
  "/interactives",
  "/item-sets",
  "/items",
  "/item-super-types",
  "/item-types",
  "/jobs",
  "/legendary-power-categories",
  "/legendary-treasure-hunts",
  "/living-object-skin-jnt-mood",
  "/map-positions",
  "/map-references",
  "/modsters",
  "/monsters",
  "/monster-races",
  "/monster-super-races",
  "/months",
  "/mount-behaviors",
  "/mount-families",
  "/mounts",
  "/npc-messages",
  "/npcs",
  "/ornaments",
  "/point-of-interest",
  "/quest-categories",
  "/quest-objective-types",
  "/quest-objectives",
  "/quest-step-rewards",
  "/quest-steps",
  "/quests",
  "/random-drop-groups",
  "/recipes",
  "/server-seasons",
  "/servers",
  "/server-game-types",
  "/skills",
  "/smiley-packs",
  "/spells",
  "/spell-levels",
  "/spell-pairs",
  "/spell-states",
  "/spell-types",
  "/spell-variants",
  "/subareas",
  "/super-areas",
  "/titles",
  "/version",
  "/world-events",
  "/world-event-rewards",
  "/worlds",
];

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    save: "reports/dofusdb-smoke-report.json",
    only: [],
    params: {},
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--base-url") args.baseUrl = argv[++i];
    else if (token === "--timeout-ms") args.timeoutMs = Number(argv[++i] || DEFAULT_TIMEOUT_MS);
    else if (token === "--save") args.save = argv[++i];
    else if (token === "--only") args.only = (argv[++i] || "").split(",").map((v) => v.trim()).filter(Boolean);
    else if (token === "--param") {
      const pair = argv[++i] || "";
      const [k, ...rest] = pair.split("=");
      if (k && rest.length) args.params[k.trim()] = rest.join("=").trim();
    }
  }

  return args;
}

function withDefaultQuery(path) {
  if (path.startsWith("/img/")) return path;
  if (path.includes("?")) return path;
  return `${path}?$limit=1`;
}

function applyParams(path, params) {
  const placeholders = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  if (!placeholders.length) return { ok: true, value: path };

  let next = path;
  for (const key of placeholders) {
    const value = params[key];
    if (!value) {
      return {
        ok: false,
        missing: placeholders.filter((p) => !params[p]),
      };
    }
    next = next.replace(`{${key}}`, encodeURIComponent(String(value)));
  }

  return { ok: true, value: next };
}

function summarizeJson(data) {
  if (Array.isArray(data)) {
    return {
      shape: "array",
      size: data.length,
      sampleKeys: data[0] && typeof data[0] === "object" ? Object.keys(data[0]).slice(0, 8) : [],
    };
  }

  if (data && typeof data === "object") {
    const keys = Object.keys(data);
    const nestedData = Array.isArray(data.data) ? data.data : null;
    return {
      shape: "object",
      keys: keys.slice(0, 8),
      dataArraySize: nestedData ? nestedData.length : undefined,
      dataSampleKeys:
        nestedData && nestedData[0] && typeof nestedData[0] === "object"
          ? Object.keys(nestedData[0]).slice(0, 8)
          : [],
    };
  }

  return { shape: typeof data };
}

async function probeOne(baseUrl, endpoint, timeoutMs) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json,image/jpeg,*/*" },
    });

    const contentType = res.headers.get("content-type") || "unknown";
    const durationMs = Date.now() - startedAt;

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return {
        status: res.status,
        ok: res.ok,
        durationMs,
        contentType,
        summary: summarizeJson(data),
      };
    }

    const text = await res.text();
    return {
      status: res.status,
      ok: res.ok,
      durationMs,
      contentType,
      summary: {
        shape: "text/binary",
        preview: text.slice(0, 120),
      },
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      durationMs: Date.now() - startedAt,
      contentType: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function printRow(result) {
  const icon = result.state === "ok" ? "OK" : result.state === "skipped" ? "SKIP" : "FAIL";
  const code = result.status ?? "-";
  const ms = `${result.durationMs ?? 0}ms`;
  console.log(`${icon.padEnd(5)} ${String(code).padEnd(4)} ${ms.padEnd(8)} ${result.endpoint}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets =
    args.only.length > 0
      ? ENDPOINTS.filter((ep) => args.only.some((needle) => ep.includes(needle)))
      : ENDPOINTS;

  if (!targets.length) {
    console.error("No endpoints matched --only filter.");
    process.exit(1);
  }

  const results = [];

  for (const rawPath of targets) {
    const applied = applyParams(rawPath, args.params);
    if (!applied.ok) {
      const result = {
        endpoint: rawPath,
        resolvedEndpoint: null,
        state: "skipped",
        reason: `Missing params: ${applied.missing.join(", ")}`,
      };
      results.push(result);
      printRow(result);
      continue;
    }

    const endpoint = withDefaultQuery(applied.value);
    const probed = await probeOne(args.baseUrl, endpoint, args.timeoutMs);
    const state = probed.ok ? "ok" : "fail";
    const result = {
      endpoint: rawPath,
      resolvedEndpoint: endpoint,
      state,
      ...probed,
    };

    results.push(result);
    printRow(result);
  }

  const totals = {
    total: results.length,
    ok: results.filter((r) => r.state === "ok").length,
    fail: results.filter((r) => r.state === "fail").length,
    skipped: results.filter((r) => r.state === "skipped").length,
  };

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const outFile = path.resolve(process.cwd(), args.save);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(
    outFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: args.baseUrl,
        timeoutMs: args.timeoutMs,
        totals,
        results,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(
    `Done. total=${totals.total} ok=${totals.ok} fail=${totals.fail} skipped=${totals.skipped}`
  );
  console.log(`Report: ${outFile}`);

  if (totals.fail > 0) {
    process.exitCode = 2;
  }
}

await main();
