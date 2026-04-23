import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=es2020";

export const SUPABASE_URL = "https://wfagftibcjlouxftzevc.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_y3kAiWOXJWjPwHFidUYA1A_inltPpUL";

export const STATUS_COLLECTING_IN_RUSSIA = "СЃРѕР±РёСЂР°РµС‚ РІ Р РѕСЃСЃРёРё";
export const STATUS_IN_TRANSIT = "РІ РїСѓС‚Рё";
export const STATUS_AT_BORDER = "РЅР° РіСЂР°РЅРёС†Рµ";
export const STATUS_IN_SHAIDON = "РІ РЁР°Р№РґРѕРЅРµ";
export const STATUS_UNLOADING = "СЂР°Р·РіСЂСѓР¶Р°РµС‚";
export const STATUS_OFFLINE = "РЅРµ РЅР° СЃРІСЏР·Рё";

export const DRIVER_STATUSES = [
  STATUS_COLLECTING_IN_RUSSIA,
  STATUS_IN_TRANSIT,
  STATUS_AT_BORDER,
  STATUS_IN_SHAIDON,
  STATUS_UNLOADING,
  STATUS_OFFLINE,
];

export const STATUS_LABELS = {
  [STATUS_COLLECTING_IN_RUSSIA]: "Р РѕСЃСЃРёСЏРЅРґР° Р±РѕСЂ С‡Р°Рј РєР°СЂСЃРѕСЃ",
  [STATUS_IN_TRANSIT]: "РґР°СЂ СЂРѕС…",
  [STATUS_AT_BORDER]: "Р“СЂР°РЅРёС†Р°РЅРґР°",
  [STATUS_IN_SHAIDON]: "РґР°СЂ РЁР°Р№РґРѕРЅ",
  [STATUS_UNLOADING]: "Р±РѕСЂ С‚Р°РєСЃРёРј РєР°СЂСЃРѕСЃ",
  [STATUS_OFFLINE]: "РЅРµ РЅР° СЃРІСЏР·Рё",
};

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "";
}

export const RUSSIA_COLLECT_POINT = "Р’Р”РќРҐ";
export const RUSSIA_UNLOAD_POINT = "Р•СЃРµРЅРёРЅР° 109";
export const ROUTE_POINTS = ["РЈР·Р±РµРєРёСЃС‚РѕРЅ", "РљР°Р·РѕРє"];

export const DRIVER_PROFILES = {
  1: {
    name: "РђС…Р»РёРґРґРёРЅ",
    collectInShaidon: "Р—Р°СЂРёС„Рё РєСѓРјСѓСЂ С„СѓСЂСѓС€",
    unloadInShaidon: "Р‘РѕР·РѕСЂРё РєСѓС…РЅР°",
  },
  2: {
    name: "РђСЃР»РёРґРґРёРЅ",
    collectInShaidon: "РЎРµ РєСѓС‡Р°РіРё Р»Р°Р±Рё СЃРѕР№",
    unloadInShaidon: "РЎРµ РєСѓС‡Р°РіРё Р»Р°Р±Рё СЃРѕР№",
  },
  3: {
    name: "Р”Р¶Р°РјС€РµРґ",
    collectInShaidon: "РќР°Р·РґРё РђР·РёР·С…СѓС‡Р°",
    unloadInShaidon: "РќР°Р·РґРё РђР·РёР·С…СѓС‡Р°",
  },
  4: {
    name: "Р­СЂР°С‡",
    collectInShaidon: "РҐРѕРЅР°Рё Р­СЂР°С‡",
    unloadInShaidon: "РҐРѕРЅР°Рё Р­СЂР°С‡",
  },
};

function isMissingCollectUntilColumnError(error) {
  const message = String(error?.message || "");
  return /collect_until_date/i.test(message) && /(column|schema cache|does not exist)/i.test(message);
}

const TEXT = {
  configureSupabase: "РЎРЅР°С‡Р°Р»Р° РІСЃС‚Р°РІСЊС‚Рµ Supabase URL Рё publishable key РІ С„Р°Р№Р» supabase.js.",
  noUpdate: "РќРµС‚ РѕР±РЅРѕРІР»РµРЅРёСЏ",
  noData: "РќРµС‚ РґР°РЅРЅС‹С…",
  fresh: "РЎРІРµР¶Рѕ",
  warning: "РќСѓР¶РЅРѕ РѕР±РЅРѕРІРёС‚СЊ",
  stale: "РЎС‚Р°СЂРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ",
  collectUntilNoDate: "РќРµ СѓРєР°Р·Р°РЅРѕ",
};

const isConfigured =
  SUPABASE_URL !== "PASTE_YOUR_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "PASTE_YOUR_SUPABASE_ANON_KEY";

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;


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
  const rawName = driver?.name?.trim();

  if (profile?.name) {
    return profile.name;
  }

  if (rawName && !/^Р’РѕРґРёС‚РµР»СЊ\s+\d+$/i.test(rawName)) {
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
    { label: "Р РѕСЃСЃРёСЏ", options: [RUSSIA_COLLECT_POINT, RUSSIA_UNLOAD_POINT] },
    { label: "РњР°СЂС€СЂСѓС‚", options: ROUTE_POINTS },
  ];

  if (shaidonOptions.length) {
    groups.push({ label: "РЁР°Р№РґРѕРЅ / С‚РѕС‡РєР° РІРѕРґРёС‚РµР»СЏ", options: shaidonOptions });
  }

  return groups;
}

export function getDefaultTemplateForStatus(status, driver) {
  const profile = getDriverProfile(driver);

  if (status === STATUS_COLLECTING_IN_RUSSIA) {
    return RUSSIA_COLLECT_POINT;
  }

  if (status === STATUS_UNLOADING) {
    return profile?.unloadInShaidon ?? "";
  }

  if (status === STATUS_IN_SHAIDON) {
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

export async function fetchDrivers() {
  assertSupabaseConfigured();

  const driversResult = await supabase
    .from("drivers")
    .select("id, number, name, phone, is_active")
    .eq("is_active", true)
    .order("number", { ascending: true });

  if (driversResult.error) {
    throw driversResult.error;
  }

  let statusesResult = await supabase
    .from("driver_status")
    .select(
      "id, driver_id, status, location_text, lat, lon, is_collecting_in_russia, updated_at, collect_until_date"
    )
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false });

  if (isMissingCollectUntilColumnError(statusesResult.error)) {
    statusesResult = await supabase
      .from("driver_status")
      .select(
        "id, driver_id, status, location_text, lat, lon, is_collecting_in_russia, updated_at"
      )
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false });

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

  for (const item of statusesResult.data ?? []) {
    if (!statusesByDriverId.has(item.driver_id)) {
      statusesByDriverId.set(item.driver_id, item);
    }
  }

  return (driversResult.data ?? []).map((driver) => ({
    ...driver,
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
