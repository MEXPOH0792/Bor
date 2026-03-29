import {
  fetchDrivers,
  formatDateTime,
  getFreshness,
  assertSupabaseConfigured,
} from "./supabase.js";

const DRIVER_NAMES = {
  1: "\u0410\u0445\u043B\u0438\u0434\u0434\u0438\u043D",
  2: "\u0410\u0441\u043B\u0438\u0434\u0434\u0438\u043D",
  3: "\u0414\u0436\u0430\u043C\u0448\u0435\u0434",
  4: "\u042D\u0440\u0430\u0447",
};

const TEXT = {
  noData: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445",
  noPhone: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
  yes: "\u0414\u0430",
  no: "\u041D\u0435\u0442",
  loading: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...",
  emptyDrivers: "\u0412 \u0431\u0430\u0437\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0432\u043E\u0434\u0438\u0442\u0435\u043B\u0435\u0439.",
  empty: "\u041F\u0443\u0441\u0442\u043E",
  lastCheck: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430",
  loadError:
    "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 Supabase.",
  loadErrorShort: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438",
};

const refreshButton = document.querySelector("#refreshButton");
const driversGrid = document.querySelector("#driversGrid");
const syncInfo = document.querySelector("#syncInfo");
const errorBanner = document.querySelector("#errorBanner");
const driverCardTemplate = document.querySelector("#driverCardTemplate");

let autoRefreshId = null;

function setError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function clearError() {
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
}

function createValue(value, fallback = TEXT.noData) {
  return value && String(value).trim() ? value : fallback;
}

function getDriverDisplayName(driver) {
  const rawName = driver?.name?.trim();

  if (DRIVER_NAMES[driver.number]) {
    return DRIVER_NAMES[driver.number];
  }

  if (rawName && !/^Водитель\s+\d+$/i.test(rawName)) {
    return rawName;
  }

  return `#${driver.number}`;
}

function renderDriverCard(driver) {
  const fragment = driverCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".driver-card");
  const number = fragment.querySelector(".driver-number");
  const name = fragment.querySelector(".driver-name");
  const phone = fragment.querySelector(".driver-phone");
  const status = fragment.querySelector(".driver-status");
  const location = fragment.querySelector(".driver-location");
  const updated = fragment.querySelector(".driver-updated");
  const collecting = fragment.querySelector(".driver-collecting");
  const freshnessPill = fragment.querySelector(".freshness-pill");

  const current = driver.current_status;
  const freshness = getFreshness(current?.updated_at);

  card.dataset.freshness = freshness.tone;
  freshnessPill.dataset.freshness = freshness.tone;

  number.textContent = `#${driver.number}`;
  name.textContent = getDriverDisplayName(driver);
  phone.textContent = createValue(driver.phone, TEXT.noPhone);
  status.textContent = createValue(current?.status);
  location.textContent = createValue(current?.location_text);
  updated.textContent = formatDateTime(current?.updated_at);
  collecting.textContent = current?.is_collecting_in_russia ? TEXT.yes : TEXT.no;
  freshnessPill.textContent = freshness.label;

  return fragment;
}

async function loadDrivers() {
  refreshButton.disabled = true;
  syncInfo.textContent = TEXT.loading;

  try {
    assertSupabaseConfigured();
    clearError();

    const drivers = await fetchDrivers();
    driversGrid.innerHTML = "";

    if (drivers.length === 0) {
      setError(TEXT.emptyDrivers);
      syncInfo.textContent = TEXT.empty;
      return;
    }

    drivers.forEach((driver) => {
      driversGrid.appendChild(renderDriverCard(driver));
    });

    syncInfo.textContent = `${TEXT.lastCheck}: ${formatDateTime(new Date())}`;
  } catch (error) {
    setError(error.message || TEXT.loadError);
    syncInfo.textContent = TEXT.loadErrorShort;
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

loadDrivers();
startAutoRefresh();

window.addEventListener("beforeunload", () => {
  if (autoRefreshId) {
    window.clearInterval(autoRefreshId);
  }
});
