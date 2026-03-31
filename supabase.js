import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=es2020";

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

export const STATUS_LABELS = {
  [STATUS_COLLECTING_IN_RUSSIA]: "Россиянда бор чам карсос",
  [STATUS_IN_TRANSIT]: "дар рох",
  [STATUS_AT_BORDER]: "Границанда",
  [STATUS_IN_SHAIDON]: "дар Шайдон",
  [STATUS_UNLOADING]: "бор таксим карсос",
  [STATUS_OFFLINE]: "не на связи",
};

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "";
}

export const RUSSIA_COLLECT_POINT = "ВДНХ";
export const RUSSIA_UNLOAD_POINT = "Есенина 109";
export const ROUTE_POINTS = ["Узбекистон", "Казок"];

export const DRIVER_PROFILES = {
  1: {
    name: "Ахлиддин",
    collectInShaidon: "Зарифи кумур фуруш",
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

  const [driversResult, statusesResult] = await Promise.all([
    supabase
      .from("drivers")
      .select("id, number, name, phone, is_active")
      .eq("is_active", true)
      .order("number", { ascending: true }),
    supabase
      .from("driver_status")
      .select(
        "id, driver_id, status, location_text, lat, lon, is_collecting_in_russia, updated_at, collect_until_date"
      )
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  if (driversResult.error) {
    throw driversResult.error;
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
