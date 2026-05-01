export const SUPABASE_URL = "https://wfagftibcjlouxftzevc.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_y3kAiWOXJWjPwHFidUYA1A_inltPpUL";

export const STATUS_COLLECTING_IN_RUSSIA = "собирает в России";
export const STATUS_IN_TRANSIT = "в пути";
export const STATUS_AT_BORDER = "на границе";
export const STATUS_IN_SHAIDON = "в Шайдоне";
export const STATUS_UNLOADING = "разгружает";
export const STATUS_OFFLINE = "не на связи";

export const DRIVER_STATUSES = [
  STATUS_COLLECTING_IN_RUSSIA,
  STATUS_IN_TRANSIT,
  STATUS_AT_BORDER,
  STATUS_IN_SHAIDON,
  STATUS_UNLOADING,
  STATUS_OFFLINE,
];

const LEGACY_STATUS_MAP = {
  "СЃРѕР±РёСЂР°РµС‚ РІ Р РѕСЃСЃРёРё": STATUS_COLLECTING_IN_RUSSIA,
  "РІ РїСѓС‚Рё": STATUS_IN_TRANSIT,
  "РЅР° РіСЂР°РЅРёС†Рµ": STATUS_AT_BORDER,
  "РІ РЁР°Р№РґРѕРЅРµ": STATUS_IN_SHAIDON,
  "СЂР°Р·РіСЂСѓР¶Р°РµС‚": STATUS_UNLOADING,
  "РЅРµ РЅР° СЃРІСЏР·Рё": STATUS_OFFLINE,
};

export const STATUS_LABELS = {
  [STATUS_COLLECTING_IN_RUSSIA]: "Россиянда бор чам карсос",
  [STATUS_IN_TRANSIT]: "дар роҳ",
  [STATUS_AT_BORDER]: "Границаанда",
  [STATUS_IN_SHAIDON]: "дар Шайдон",
  [STATUS_UNLOADING]: "бор таксим карсос",
  [STATUS_OFFLINE]: "не на связи",
};

const TEXT = {
  configureSupabase: "Сначала вставьте Supabase URL и publishable key в файл supabase.js.",
  noUpdate: "Нет обновления",
  noData: "Нет данных",
  fresh: "Свежо",
  warning: "Нужно обновить",
  stale: "Старое обновление",
  collectUntilNoDate: "Не указано",
};

const isConfigured =
  SUPABASE_URL !== "PASTE_YOUR_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "PASTE_YOUR_SUPABASE_ANON_KEY";

const REST_URL = `${SUPABASE_URL}/rest/v1`;

function getSupabaseHeaders(extraHeaders = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extraHeaders,
  };
}

async function parseSupabaseResponse(response) {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    return {
      data: null,
      error: {
        status: response.status,
        message: data?.message || data?.hint || String(data || response.statusText),
        details: data?.details,
        code: data?.code,
      },
    };
  }

  return { data, error: null };
}

async function supabaseGet(table, params) {
  const url = new URL(`${REST_URL}/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getSupabaseHeaders({
        Accept: "application/json",
      }),
    });

    return await parseSupabaseResponse(response);
  } catch (error) {
    return { data: null, error };
  }
}

async function supabaseRpc(functionName, payload) {
  try {
    const response = await fetch(`${REST_URL}/rpc/${functionName}`, {
      method: "POST",
      headers: getSupabaseHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    });

    return await parseSupabaseResponse(response);
  } catch (error) {
    return { data: null, error };
  }
}

export const supabase = isConfigured
  ? {
      rpc: supabaseRpc,
    }
  : null;

export function repairBrokenCyrillic(value) {
  if (typeof value !== "string" || !value) {
    return value ?? "";
  }

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    if (decoded.length < value.length && /[А-Яа-яЁёҚқҒғҲҳӮӯІі]/u.test(decoded)) {
      return decoded;
    }
  } catch {
    // Keep original value when text is already valid or not recoverable.
  }

  return value;
}

export function normalizeStatus(status) {
  const repairedStatus = repairBrokenCyrillic(status);
  return LEGACY_STATUS_MAP[repairedStatus] ?? repairedStatus ?? "";
}

export function getStatusLabel(status) {
  const normalizedStatus = normalizeStatus(status);
  return STATUS_LABELS[normalizedStatus] ?? normalizedStatus ?? "";
}

export const RUSSIA_COLLECT_POINT = "ВДНХ";
export const RUSSIA_UNLOAD_POINT = "Есенина 109";
export const ROUTE_POINTS = ["Узбекистон", "Казок"];

export const DRIVER_PROFILES = {
  1: {
    name: "Ахлиддин",
    collectInShaidon: "Гаражи Зариф (кумур фуруш)",
    unloadInShaidon: "Бозори кухна",
  },
  2: {
    name: "Аслиддин",
    collectInShaidon: "Се кучаги лаби сой",
    unloadInShaidon: "Се кучаги лаби сой",
  },
  3: {
    name: "Джамшед",
    collectInShaidon: "Назди Азизхуча",
    unloadInShaidon: "Назди Азизхуча",
  },
  4: {
    name: "Эрач",
    collectInShaidon: "Хонаи Эрач",
    unloadInShaidon: "Хонаи Эрач",
  },
};

function isMissingCollectUntilColumnError(error) {
  const message = String(error?.message || "");
  return /collect_until_date/i.test(message) && /(column|schema cache|does not exist)/i.test(message);
}

export function formatCollectUntil(value) {
  if (!value) {
    return TEXT.collectUntilNoDate;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function assertSupabaseConfigured() {
  if (!supabase) {
    throw new Error(TEXT.configureSupabase);
  }
}

export function getDriverProfile(driverOrNumber) {
  const driverNumber = typeof driverOrNumber === "number" ? driverOrNumber : driverOrNumber?.number;
  return driverNumber ? DRIVER_PROFILES[driverNumber] ?? null : null;
}

export function getDriverDisplayName(driver) {
  const profile = getDriverProfile(driver);
  const rawName = repairBrokenCyrillic(driver?.name?.trim());

  if (profile?.name) {
    return profile.name;
  }

  if (rawName && !/^Водитель\s+\d+$/i.test(rawName)) {
    return rawName;
  }

  return `#${driver?.number ?? ""}`.trim();
}

export function getLocationTemplateGroups(driver) {
  const profile = getDriverProfile(driver);
  const shaidonOptions = [];

  if (profile?.collectInShaidon) {
    shaidonOptions.push(profile.collectInShaidon);
  }

  if (profile?.unloadInShaidon && profile.unloadInShaidon !== profile.collectInShaidon) {
    shaidonOptions.push(profile.unloadInShaidon);
  }

  const groups = [
    { label: "Россия", options: [RUSSIA_COLLECT_POINT, RUSSIA_UNLOAD_POINT] },
    { label: "Маршрут", options: ROUTE_POINTS },
  ];

  if (shaidonOptions.length) {
    groups.push({ label: "Шайдон / точка водителя", options: shaidonOptions });
  }

  return groups;
}

export function getDefaultTemplateForStatus(status, driver) {
  const normalizedStatus = normalizeStatus(status);
  const profile = getDriverProfile(driver);

  if (normalizedStatus === STATUS_COLLECTING_IN_RUSSIA) {
    return RUSSIA_COLLECT_POINT;
  }

  if (normalizedStatus === STATUS_UNLOADING) {
    return profile?.unloadInShaidon ?? "";
  }

  if (normalizedStatus === STATUS_IN_SHAIDON) {
    return profile?.collectInShaidon ?? "";
  }

  return "";
}

export function getRequestedDriverRef() {
  const params = new URLSearchParams(window.location.search);
  const driverId = Number(params.get("driver_id"));
  const driverNumber = Number(params.get("driver_number") || params.get("driver"));

  if (Number.isInteger(driverNumber) && driverNumber > 0) {
    return { type: "number", value: driverNumber };
  }

  if (Number.isInteger(driverId) && driverId > 0) {
    return { type: "id", value: driverId };
  }

  return null;
}

export function isAdminModeRequested() {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "1";
}

export function buildDriverPageLink(driver) {
  return `./driver.html?driver_number=${driver.number}`;
}

function normalizeDriverStatusRecord(item) {
  return {
    ...item,
    status: normalizeStatus(item.status),
    location_text: repairBrokenCyrillic(item.location_text),
  };
}

export async function fetchDrivers() {
  assertSupabaseConfigured();

  const driversResult = await supabaseGet("drivers", {
    select: "id,number,name,phone,is_active",
    is_active: "eq.true",
    order: "number.asc",
  });

  if (driversResult.error) {
    throw driversResult.error;
  }

  let statusesResult = await supabaseGet("driver_status", {
    select: "id,driver_id,status,location_text,lat,lon,is_collecting_in_russia,updated_at,collect_until_date",
    order: "updated_at.desc,id.desc",
  });

  if (isMissingCollectUntilColumnError(statusesResult.error)) {
    statusesResult = await supabaseGet("driver_status", {
      select: "id,driver_id,status,location_text,lat,lon,is_collecting_in_russia,updated_at",
      order: "updated_at.desc,id.desc",
    });

    if (!statusesResult.error) {
      statusesResult = {
        ...statusesResult,
        data: (statusesResult.data ?? []).map((item) => ({
          ...item,
          collect_until_date: null,
        })),
      };
    }
  }

  if (statusesResult.error) {
    throw statusesResult.error;
  }

  const statusesByDriverId = new Map();

  for (const item of (statusesResult.data ?? []).map(normalizeDriverStatusRecord)) {
    if (!statusesByDriverId.has(item.driver_id)) {
      statusesByDriverId.set(item.driver_id, item);
    }
  }

  return (driversResult.data ?? []).map((driver) => ({
    ...driver,
    name: repairBrokenCyrillic(driver.name),
    current_status: statusesByDriverId.get(driver.id) ?? null,
  }));
}

export function formatDateTime(value) {
  if (!value) {
    return TEXT.noUpdate;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getFreshness(updatedAt) {
  if (!updatedAt) {
    return { tone: "unknown", label: TEXT.noData, hours: Number.POSITIVE_INFINITY };
  }

  const now = Date.now();
  const updated = new Date(updatedAt).getTime();
  const diffHours = (now - updated) / (1000 * 60 * 60);

  if (diffHours < 2) {
    return { tone: "fresh", label: TEXT.fresh, hours: diffHours };
  }

  if (diffHours <= 8) {
    return { tone: "warning", label: TEXT.warning, hours: diffHours };
  }

  return { tone: "stale", label: TEXT.stale, hours: diffHours };
}
