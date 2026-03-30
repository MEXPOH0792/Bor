import {
  STATUS_IN_SHAIDON,
  assertSupabaseConfigured,
  fetchDrivers,
  formatDateTime,
  getDriverDisplayName,
  getFreshness,
} from "./supabase.js";

const CACHE_KEY = "bor-public-drivers-cache-v1";

const TEXT = {
  noData: "Нет данных",
  noPhone: "Телефон не указан",
  yes: "Да",
  no: "Нет",
  loading: "Загрузка...",
  emptyDrivers: "В базе пока нет активных водителей.",
  empty: "Пусто",
  lastCheck: "Последняя проверка",
  loadError: "Не удалось загрузить данные из Supabase.",
  loadErrorShort: "Ошибка загрузки",
  offlineBanner:
    "Связь слабая или отсутствует. Если загрузка не пройдет, будут показаны последние сохраненные данные с устройства.",
  onlineBanner: "Связь есть. Страница обновляется автоматически.",
  cachedData:
    "Сейчас показаны последние сохраненные данные с этого устройства.",
  justNow: "Только что",
  minutesAgo: "мин назад",
  hoursAgo: "ч назад",
  dayAgo: "более суток назад",
  freshAlert: "Данные свежие.",
  warningAlert: "Данные уже не свежие, желательно перепроверить.",
  staleAlert: "Давно не обновлялся. Нужна проверка по водителю.",
  unknownAlert: "Еще нет отметки от водителя.",
};

const refreshButton = document.querySelector("#refreshButton");
const driversGrid = document.querySelector("#driversGrid");
const syncInfo = document.querySelector("#syncInfo");
const errorBanner = document.querySelector("#errorBanner");
const connectionBanner = document.querySelector("#connectionBanner");
const cacheBanner = document.querySelector("#cacheBanner");
const driverCardTemplate = document.querySelector("#driverCardTemplate");
const freshCount = document.querySelector("#freshCount");
const warningCount = document.querySelector("#warningCount");
const staleCount = document.querySelector("#staleCount");
const shaidonCount = document.querySelector("#shaidonCount");

let autoRefreshId = null;

function setError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function clearError() {
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
}

function setConnectionBanner() {
  connectionBanner.textContent = navigator.onLine
    ? TEXT.onlineBanner
    : TEXT.offlineBanner;
  connectionBanner.classList.remove("hidden");
}

function showCacheBanner(message = TEXT.cachedData) {
  cacheBanner.textContent = message;
  cacheBanner.classList.remove("hidden");
}

function hideCacheBanner() {
  cacheBanner.textContent = "";
  cacheBanner.classList.add("hidden");
}

function createValue(value, fallback = TEXT.noData) {
  return value && String(value).trim() ? value : fallback;
}

function getRelativeAgeLabel(updatedAt, freshness) {
  if (!updatedAt || !Number.isFinite(freshness.hours)) {
    return TEXT.unknownAlert;
  }

  const minutes = Math.round(freshness.hours * 60);

  if (minutes < 2) {
    return TEXT.justNow;
  }

  if (minutes < 60) {
    return `${minutes} ${TEXT.minutesAgo}`;
  }

  if (freshness.hours < 24) {
    return `${Math.round(freshness.hours)} ${TEXT.hoursAgo}`;
  }

  return TEXT.dayAgo;
}

function getAlertText(freshness) {
  if (freshness.tone === "fresh") {
    return TEXT.freshAlert;
  }

  if (freshness.tone === "warning") {
    return TEXT.warningAlert;
  }

  if (freshness.tone === "stale") {
    return TEXT.staleAlert;
  }

  return TEXT.unknownAlert;
}

function updateSummary(drivers) {
  const counts = {
    fresh: 0,
    warning: 0,
    stale: 0,
    shaidon: 0,
  };

  drivers.forEach((driver) => {
    const current = driver.current_status;
    const freshness = getFreshness(current?.updated_at);

    if (freshness.tone === "fresh") {
      counts.fresh += 1;
    } else if (freshness.tone === "warning") {
      counts.warning += 1;
    } else {
      counts.stale += 1;
    }

    if (current?.status === STATUS_IN_SHAIDON) {
      counts.shaidon += 1;
    }
  });

  freshCount.textContent = String(counts.fresh);
  warningCount.textContent = String(counts.warning);
  staleCount.textContent = String(counts.stale);
  shaidonCount.textContent = String(counts.shaidon);
}

function renderDrivers(drivers) {
  driversGrid.innerHTML = "";
  updateSummary(drivers);

  drivers.forEach((driver) => {
    const fragment = driverCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".driver-card");
    const number = fragment.querySelector(".driver-number");
    const name = fragment.querySelector(".driver-name");
    const phone = fragment.querySelector(".driver-phone");
    const status = fragment.querySelector(".driver-status");
    const locationMain = fragment.querySelector(".driver-location-main");
    const updatedMain = fragment.querySelector(".driver-updated-main");
    const collecting = fragment.querySelector(".driver-collecting");
    const freshnessPill = fragment.querySelector(".freshness-pill");
    const statusChip = fragment.querySelector(".status-chip");
    const ageNote = fragment.querySelector(".driver-age-note");
    const alert = fragment.querySelector(".driver-alert");

    const current = driver.current_status;
    const freshness = getFreshness(current?.updated_at);
    const alertText = getAlertText(freshness);

    card.dataset.freshness = freshness.tone;
    freshnessPill.dataset.freshness = freshness.tone;
    statusChip.dataset.freshness = freshness.tone;

    number.textContent = `#${driver.number}`;
    name.textContent = getDriverDisplayName(driver);
    phone.textContent = createValue(driver.phone, TEXT.noPhone);
    status.textContent = createValue(current?.status);
    statusChip.textContent = createValue(current?.status);
    locationMain.textContent = createValue(current?.location_text);
    updatedMain.textContent = formatDateTime(current?.updated_at);
    ageNote.textContent = getRelativeAgeLabel(current?.updated_at, freshness);
    collecting.textContent = current?.is_collecting_in_russia ? TEXT.yes : TEXT.no;
    freshnessPill.textContent = freshness.label;
    alert.textContent = alertText;
    alert.classList.remove("hidden");

    driversGrid.appendChild(fragment);
  });
}

function saveDriversCache(drivers) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      cachedAt: new Date().toISOString(),
      drivers,
    })
  );
}

function loadDriversCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch {
    // No-op: app should still work without service worker.
  }
}

async function loadDrivers() {
  refreshButton.disabled = true;
  syncInfo.textContent = TEXT.loading;

  try {
    assertSupabaseConfigured();
    clearError();
    hideCacheBanner();

    const drivers = await fetchDrivers();

    if (drivers.length === 0) {
      setError(TEXT.emptyDrivers);
      syncInfo.textContent = TEXT.empty;
      return;
    }

    renderDrivers(drivers);
    saveDriversCache(drivers);
    syncInfo.textContent = `${TEXT.lastCheck}: ${formatDateTime(new Date())}`;
  } catch (error) {
    const cached = loadDriversCache();

    if (cached?.drivers?.length) {
      renderDrivers(cached.drivers);
      showCacheBanner();
      syncInfo.textContent = `${TEXT.lastCheck}: ${formatDateTime(
        cached.cachedAt
      )}`;
      setError(error.message || TEXT.loadError);
    } else {
      setError(error.message || TEXT.loadError);
      syncInfo.textContent = TEXT.loadErrorShort;
    }
  } finally {
    refreshButton.disabled = false;
  }
}

function startAutoRefresh() {
  autoRefreshId = window.setInterval(loadDrivers, 60_000);
}

refreshButton.addEventListener("click", () => {
  loadDrivers();
});

window.addEventListener("online", () => {
  setConnectionBanner();
  loadDrivers();
});

window.addEventListener("offline", () => {
  setConnectionBanner();
});

setConnectionBanner();
registerServiceWorker();
loadDrivers();
startAutoRefresh();

window.addEventListener("beforeunload", () => {
  if (autoRefreshId) {
    window.clearInterval(autoRefreshId);
  }
});
