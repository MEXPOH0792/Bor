import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=es2020";

export const SUPABASE_URL = "https://wfagftibcjlouxftzevc.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_y3kAiWOXJWjPwHFidUYA1A_inltPpUL";

export const DRIVER_STATUSES = [
  "\u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0432 \u0420\u043E\u0441\u0441\u0438\u0438",
  "\u0432 \u043F\u0443\u0442\u0438",
  "\u043D\u0430 \u0433\u0440\u0430\u043D\u0438\u0446\u0435",
  "\u0432 \u0422\u0430\u0434\u0436\u0438\u043A\u0438\u0441\u0442\u0430\u043D\u0435",
  "\u0432 \u0425\u0443\u0434\u0436\u0430\u043D\u0434\u0435",
  "\u0432 \u0428\u0430\u0439\u0434\u043E\u043D\u0435",
  "\u0440\u0430\u0437\u0433\u0440\u0443\u0436\u0430\u0435\u0442",
  "\u043D\u0435 \u043D\u0430 \u0441\u0432\u044F\u0437\u0438",
];

const TEXT = {
  configureSupabase:
    "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 Supabase URL \u0438 anon key \u0432 \u0444\u0430\u0439\u043B supabase.js.",
  noUpdate: "\u041D\u0435\u0442 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F",
  noData: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445",
  fresh: "\u0421\u0432\u0435\u0436\u043E",
  warning: "\u041D\u0443\u0436\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
  stale: "\u0421\u0442\u0430\u0440\u043E\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435",
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

export function assertSupabaseConfigured() {
  if (!supabase) {
    throw new Error(TEXT.configureSupabase);
  }
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
        "driver_id, status, location_text, lat, lon, is_collecting_in_russia, updated_at"
      ),
  ]);

  if (driversResult.error) {
    throw driversResult.error;
  }

  if (statusesResult.error) {
    throw statusesResult.error;
  }

  const statusesByDriverId = new Map(
    (statusesResult.data ?? []).map((item) => [item.driver_id, item])
  );

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
    return {
      tone: "unknown",
      label: TEXT.noData,
      hours: Number.POSITIVE_INFINITY,
    };
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

export function getDriverIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawValue = params.get("driver_id");
  const driverId = Number(rawValue);

  return Number.isInteger(driverId) && driverId > 0 ? driverId : null;
}
