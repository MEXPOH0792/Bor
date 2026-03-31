import {
  STATUS_IN_SHAIDON,
  assertSupabaseConfigured,
  fetchDrivers,
  formatDateTime,
  getDriverDisplayName,
  getFreshness,
} from "./supabase.js";

const CACHE_KEY = "bor-public-drivers-cache-v2";
const FILTER_STORAGE_KEY = "bor-public-filter-v1";

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
  onlineBanner: "Связь есть. Данные загружаются при открытии страницы, при возврате на вкладку и по кнопке обновления.",
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
  showAll: "Показаны все водители.",
  showAttention: "Показаны водители, по которым нужна проверка.",
  showShaidon: "Показаны только водители в Шайдоне.",
  showCollecting: "Показаны только водители, которые собирают в России.",
  emptyFiltered: "По этому фильтру водителей нет.",
  phoneCall: "Позвонить",
};

const FILTERS = {
  all: {
    info: TEXT.showAll,
    predicate: () => true,
  },
  attention: {
    info: TEXT.showAttention,
    predicate: (driver) => {
      const tone = getFreshness(driver.current_status?.updated_at).tone;
      return tone === "warning" || tone === "stale" || tone === "unknown";
    },
  },
  shaidon: {
    info: TEXT.showShaidon,
    predicate: (driver) => driver.current_status?.status === STATUS_IN_SHAIDON,
  },
  collecting: {
    info: TEXT.showCollecting,
    predicate: (driver) => Boolean(driver.current_status?.is_collecting_in_russia),
  },
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
const filterBar = document.querySelector("#filterBar");
const filterInfo = document.querySelector("#filterInfo");
const emptyState = document.querySelector("#emptyState");
const emptyStateText = document.querySelector("#emptyStateText");

const AUTO_REFRESH_MS = 180_000;
const AUTO_REFRESH_JITTER_MS = 30_000;
const MIN_REQUEST_GAP_MS = 15_000;
const VISIBLE_REFRESH_COOLDOWN_MS = 45_000;

let autoRefreshId = null;
let allDrivers = [];
let currentFilter = "all";
let loadPromise = null;
let lastRequestStartedAt = 0;
let lastSuccessfulLoadAt = 0;

function loadSavedFilter() {
  const saved = localStorage.getItem(FILTER_STORAGE_KEY);
  return FILTERS[saved] ? saved : "all";
}

function saveCurrentFilter() {
  localStorage.setItem(FILTER_STORAGE_KEY, currentFilter);
}

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

function applyFilter(drivers) {
  const activeFilter = FILTERS[currentFilter] || FILTERS.all;
  const filtered = drivers.filter(activeFilter.predicate);

  filterInfo.textContent = activeFilter.info;

  filterBar.querySelectorAll(".filter-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === currentFilter);
  });

  if (!filtered.length) {
    driversGrid.innerHTML = "";
    emptyStateText.textContent = TEXT.emptyFiltered;
    emptyState.classList.remove("hidden");
    return [];
  }

  emptyState.classList.add("hidden");
  return filtered;
}

function renderDrivers(drivers) {
  driversGrid.innerHTML = "";
  updateSummary(drivers);

  const visibleDrivers = applyFilter(drivers);

  visibleDrivers.forEach((driver) => {
    const fragment = driverCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".driver-card");
    const number = fragment.querySelector(".driver-number");
    const name = fragment.querySelector(".driver-name");
    const phoneLink = fragment.querySelector(".driver-phone-link");
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
    const phoneValue = createValue(driver.phone, TEXT.noPhone);

    card.dataset.freshness = freshness.tone;
    freshnessPill.dataset.freshness = freshness.tone;
    statusChip.dataset.freshness = freshness.tone;

    number.textContent = `#${driver.number}`;
    name.textContent = getDriverDisplayName(driver);
    phoneLink.textContent = phoneValue;
    status.textContent = createValue(current?.status);
    statusChip.textContent = createValue(current?.status);
    locationMain.textContent = createValue(current?.location_text);
    updatedMain.textContent = formatDateTime(current?.updated_at);
    ageNote.textContent = getRelativeAgeLabel(current?.updated_at, freshness);
    collecting.textContent = current?.is_collecting_in_russia ? TEXT.yes : TEXT.no;
    freshnessPill.textContent = freshness.label;
    alert.textContent = alertText;
    alert.classList.remove("hidden");

    if (driver.phone && String(driver.phone).trim()) {
      const phoneHref = String(driver.phone).replace(/[^+\d]/g, "");
      phoneLink.href = `tel:${phoneHref}`;
      phoneLink.setAttribute("aria-label", `${TEXT.phoneCall} ${driver.phone}`);
    } else {
      phoneLink.removeAttribute("href");
      phoneLink.classList.add("is-disabled");
    }

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

function renderCachedDriversOnStart() {
  const cached = loadDriversCache();

  if (!cached?.drivers?.length) {
    return false;
  }

  allDrivers = cached.drivers;
  renderDrivers(allDrivers);
  showCacheBanner();
  syncInfo.textContent = `${TEXT.lastCheck}: ${formatDateTime(cached.cachedAt)}`;
  return true;
}

function canStartNetworkRequest(force = false) {
  if (force) {
    return true;
  }

  if (document.hidden) {
    return false;
  }

  return Date.now() - lastRequestStartedAt >= MIN_REQUEST_GAP_MS;
}

function shouldRefreshOnReturn() {
  return Date.now() - lastSuccessfulLoadAt >= VISIBLE_REFRESH_COOLDOWN_MS;
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

async function loadDrivers(options = {}) {
  const { force = false, keepSyncInfo = false } = options;

  if (loadPromise) {
    return loadPromise;
  }

  if (!canStartNetworkRequest(force)) {
    return null;
  }

  lastRequestStartedAt = Date.now();
  refreshButton.disabled = true;

  if (!keepSyncInfo) {
    syncInfo.textContent = TEXT.loading;
  }

  loadPromise = (async () => {
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

      allDrivers = drivers;
      renderDrivers(allDrivers);
      saveDriversCache(allDrivers);
      lastSuccessfulLoadAt = Date.now();
      syncInfo.textContent = `${TEXT.lastCheck}: ${formatDateTime(new Date())}`;
    } catch (error) {
      const cached = loadDriversCache();

      if (cached?.drivers?.length) {
        allDrivers = cached.drivers;
        renderDrivers(allDrivers);
        showCacheBanner();
        syncInfo.textContent = `${TEXT.lastCheck}: ${formatDateTime(cached.cachedAt)}`;
        setError(error.message || TEXT.loadError);
      } else {
        setError(error.message || TEXT.loadError);
        syncInfo.textContent = TEXT.loadErrorShort;
      }
    } finally {
      refreshButton.disabled = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

function startAutoRefresh() {
  const interval = AUTO_REFRESH_MS + Math.floor(Math.random() * AUTO_REFRESH_JITTER_MS);

  autoRefreshId = window.setInterval(() => {
    if (document.hidden) {
      return;
    }

    loadDrivers({ keepSyncInfo: true });
  }, interval);
}

refreshButton.addEventListener("click", () => {
  loadDrivers({ force: true });
});

filterBar.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-button");

  if (!button) {
    return;
  }

  currentFilter = button.dataset.filter || "all";
  saveCurrentFilter();
  renderDrivers(allDrivers);
});

window.addEventListener("online", () => {
  setConnectionBanner();
  loadDrivers({ force: true });
});

window.addEventListener("offline", () => {
  setConnectionBanner();
});

setConnectionBanner();
currentFilter = loadSavedFilter();
registerServiceWorker();
renderCachedDriversOnStart();
loadDrivers({ force: true, keepSyncInfo: true });
startAutoRefresh();

window.addEventListener("visibilitychange", () => {
  if (!document.hidden && shouldRefreshOnReturn()) {
    loadDrivers({ keepSyncInfo: true });
  }
});

window.addEventListener("focus", () => {
  if (shouldRefreshOnReturn()) {
    loadDrivers({ keepSyncInfo: true });
  }
});

window.addEventListener("beforeunload", () => {
  if (autoRefreshId) {
    window.clearInterval(autoRefreshId);
  }
});
