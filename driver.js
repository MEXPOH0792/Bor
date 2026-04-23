import {
  DRIVER_STATUSES,
  STATUS_COLLECTING_IN_RUSSIA,
  assertSupabaseConfigured,
  buildDriverPageLink,
  fetchDrivers,
  formatCollectUntil,
  formatDateTime,
  getDefaultTemplateForStatus,
  getDriverDisplayName,
  getDriverProfile,
  getStatusLabel,
  getLocationTemplateGroups,
  getRequestedDriverRef,
  isAdminModeRequested,
  supabase,
} from "./supabase.js";

const QUEUE_KEY = "bor-driver-update-queue-v1";
const DRAFT_KEY = "bor-driver-draft-v1";
const CUSTOM_TEMPLATE = "__custom__";

const TEXT = {
  chooseSelf: "Р’С‹Р±РµСЂРёС‚Рµ СЃРµР±СЏ",
  noData: "РќРµС‚ РґР°РЅРЅС‹С…",
  chooseTemplate: "Р’С‹Р±РµСЂРёС‚Рµ С€Р°Р±Р»РѕРЅ",
  customTemplate: "РЎРІРѕР№ С‚РµРєСЃС‚",
  geoUnsupported: "Р“РµРѕР»РѕРєР°С†РёСЏ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ.",
  geoLoading: "Р—Р°РїСЂР°С€РёРІР°СЋ РєРѕРѕСЂРґРёРЅР°С‚С‹...",
  geoSaved: "РљРѕРѕСЂРґРёРЅР°С‚С‹ СЃРѕС…СЂР°РЅРµРЅС‹",
  geoFailed: "РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РєРѕРѕСЂРґРёРЅР°С‚С‹. РџСЂРѕРґРѕР»Р¶Р°Р№С‚Рµ Р±РµР· РЅРёС….",
  chooseDriver: "РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ РІРѕРґРёС‚РµР»СЏ.",
  enterLocation: "Р’РІРµРґРёС‚Рµ РјРµСЃС‚РѕРїРѕР»РѕР¶РµРЅРёРµ С‚РµРєСЃС‚РѕРј.",
  submitting: "РћС‚РїСЂР°РІРєР°...",
  submitOnline: "РћР±РЅРѕРІРёС‚СЊ",
  submitOffline: "РЎРѕС…СЂР°РЅРёС‚СЊ РЅР° С‚РµР»РµС„РѕРЅРµ",
  sentWithGeo: "РћР±РЅРѕРІР»РµРЅРёРµ РѕС‚РїСЂР°РІР»РµРЅРѕ. РџРѕСЃР»РµРґРЅРёРµ РєРѕРѕСЂРґРёРЅР°С‚С‹ СЃРѕС…СЂР°РЅРµРЅС‹ РІ Р±Р°Р·Рµ.",
  sentWithoutGeo: "РћР±РЅРѕРІР»РµРЅРёРµ РѕС‚РїСЂР°РІР»РµРЅРѕ Р±РµР· РєРѕРѕСЂРґРёРЅР°С‚.",
  savedOffline:
    "РРЅС‚РµСЂРЅРµС‚ СЃР»Р°Р±С‹Р№. РћР±РЅРѕРІР»РµРЅРёРµ СЃРѕС…СЂР°РЅРµРЅРѕ РЅР° СѓСЃС‚СЂРѕР№СЃС‚РІРµ Рё Р±СѓРґРµС‚ РѕС‚РїСЂР°РІР»РµРЅРѕ РїСЂРё РїРѕСЏРІР»РµРЅРёРё СЃРІСЏР·Рё.",
  loadDriversFailed: "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРїРёСЃРѕРє РІРѕРґРёС‚РµР»РµР№.",
  updateFailed: "РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ СЃС‚Р°С‚СѓСЃ. РџСЂРѕРІРµСЂСЊС‚Рµ РЅР°СЃС‚СЂРѕР№РєРё Supabase.",
  onlineBanner: "РЎРІСЏР·СЊ РµСЃС‚СЊ. РњРѕР¶РЅРѕ РѕС‚РїСЂР°РІР»СЏС‚СЊ РѕР±РЅРѕРІР»РµРЅРёСЏ СЃСЂР°Р·Сѓ.",
  offlineBanner:
    "РЎРІСЏР·СЊ СЃР»Р°Р±Р°СЏ РёР»Рё РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚. РћР±РЅРѕРІР»РµРЅРёСЏ Р±СѓРґСѓС‚ РІСЂРµРјРµРЅРЅРѕ СЃРѕС…СЂР°РЅСЏС‚СЊСЃСЏ РЅР° СѓСЃС‚СЂРѕР№СЃС‚РІРµ.",
  queueEmpty: "РќРµС‚ РѕС‚Р»РѕР¶РµРЅРЅС‹С… РѕР±РЅРѕРІР»РµРЅРёР№.",
  queueCount: "РќРµ РѕС‚РїСЂР°РІР»РµРЅРѕ РѕР±РЅРѕРІР»РµРЅРёР№",
  queueRetrying: "РџСЂРѕР±СѓСЋ РѕС‚РїСЂР°РІРёС‚СЊ СЃРѕС…СЂР°РЅРµРЅРЅС‹Рµ РѕР±РЅРѕРІР»РµРЅРёСЏ...",
  draftRestored: "Р§РµСЂРЅРѕРІРёРє С„РѕСЂРјС‹ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅ СЃ СЌС‚РѕРіРѕ СѓСЃС‚СЂРѕР№СЃС‚РІР°.",
  submitHintOnline: "РџСЂРё СЃР»Р°Р±РѕРј РёРЅС‚РµСЂРЅРµС‚Рµ РѕР±РЅРѕРІР»РµРЅРёРµ СЃРЅР°С‡Р°Р»Р° СЃРѕС…СЂР°РЅРёС‚СЃСЏ РЅР° СѓСЃС‚СЂРѕР№СЃС‚РІРµ.",
  submitHintOffline: "РЎРµР№С‡Р°СЃ СЃРІСЏР·Рё РЅРµС‚. РљРЅРѕРїРєР° СЃРѕС…СЂР°РЅРёС‚ РѕР±РЅРѕРІР»РµРЅРёРµ РЅР° СЌС‚РѕРј С‚РµР»РµС„РѕРЅРµ.",
  coordinatorTitle: "Р РµР¶РёРј РєРѕРѕСЂРґРёРЅР°С‚РѕСЂР°",
  coordinatorText:
    "РњРѕР¶РЅРѕ РІС‹Р±СЂР°С‚СЊ Р»СЋР±РѕРіРѕ РІРѕРґРёС‚РµР»СЏ РёР· СЃРїРёСЃРєР° РёР»Рё РїРµСЂРµР№С‚Рё РЅР° РµРіРѕ Р»РёС‡РЅСѓСЋ СЃСЃС‹Р»РєСѓ.",
  personalTitle: "РћР±РЅРѕРІРёС‚СЊ СЃРІРѕР№ СЃС‚Р°С‚СѓСЃ",
  personalText: "",
  personalLinkLabel: "Р›РёС‡РЅР°СЏ СЃСЃС‹Р»РєР°",
  driverMissing: "Р­С‚РѕС‚ РІРѕРґРёС‚РµР»СЊ СѓРґР°Р»РµРЅ РёР»Рё Р±РѕР»СЊС€Рµ РЅРµРґРѕСЃС‚СѓРїРµРЅ.",
};

const form = document.querySelector("#driverForm");
const driverSelect = document.querySelector("#driverSelect");
const statusSelect = document.querySelector("#statusSelect");
const locationTemplateSelect = document.querySelector("#locationTemplateSelect");
const locationInput = document.querySelector("#locationInput");
const collectUntilInput = document.querySelector("#collectUntilInput");
const geoButton = document.querySelector("#geoButton");
const geoStatus = document.querySelector("#geoStatus");
const submitButton = document.querySelector("#submitButton");
const submitHint = document.querySelector("#submitHint");
const retryQueueButton = document.querySelector("#retryQueueButton");
const queuePanel = document.querySelector("#queuePanel");
const queueSummary = document.querySelector("#queueSummary");
const connectionBanner = document.querySelector("#connectionBanner");
const errorBanner = document.querySelector("#driverErrorBanner");
const lastLocationLine = document.querySelector("#lastLocationLine");
const heroTitle = document.querySelector("h1");
const heroText = document.querySelector(".hero-text") ?? document.querySelector(".hero-subtitle");
const driverField = driverSelect.closest(".field");
const adminPanel = document.querySelector("#adminPanel");
const driverLinks = document.querySelector("#driverLinks");

const requestedDriverRef = getRequestedDriverRef();
const isAdminMode = isAdminModeRequested();

let drivers = [];
let selectedCoordinates = { lat: null, lon: null };
let queueNote = "";

if (requestedDriverRef && !isAdminMode) {
  driverField.classList.add("hidden");
  driverSelect.disabled = true;
}

function setError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function clearError() {
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
}

function disableFormBecauseDriverMissing() {
  setError(TEXT.driverMissing);

  driverSelect.value = "";
  driverSelect.disabled = true;
  statusSelect.disabled = true;
  locationTemplateSelect.disabled = true;
  locationInput.disabled = true;
  collectUntilInput.disabled = true;
  geoButton.disabled = true;
  submitButton.disabled = true;
}

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function setQueueNote(message = "") {
  queueNote = message;
  updateQueuePanel();
}

function updateSubmitUi() {
  if (!submitButton.disabled) {
    submitButton.textContent = navigator.onLine ? TEXT.submitOnline : TEXT.submitOffline;
  }

  submitHint.textContent = navigator.onLine
    ? TEXT.submitHintOnline
    : TEXT.submitHintOffline;
}

function setConnectionBanner() {
  connectionBanner.textContent = navigator.onLine
    ? TEXT.onlineBanner
    : TEXT.offlineBanner;
  connectionBanner.classList.remove("hidden");
  updateSubmitUi();
}

function updateQueuePanel() {
  const queue = loadQueue();

  if (!queue.length && !queueNote) {
    queueSummary.textContent = TEXT.queueEmpty;
    queuePanel.classList.add("hidden");
    retryQueueButton.disabled = true;
    retryQueueButton.classList.add("button-muted");
    return;
  }

  const summaryParts = [];

  if (queue.length) {
    const latest = queue[queue.length - 1];
    summaryParts.push(
      `${TEXT.queueCount}: ${queue.length}. РџРѕСЃР»РµРґРЅРµРµ СЃРѕС…СЂР°РЅРµРЅРёРµ: ${formatDateTime(
        latest.savedAt
      )}`
    );
  }

  if (queueNote) {
    summaryParts.unshift(queueNote);
  }

  queueSummary.textContent = summaryParts.join(" ");
  queuePanel.classList.remove("hidden");
  retryQueueButton.disabled = !queue.length || !navigator.onLine;
  retryQueueButton.classList.toggle("button-muted", retryQueueButton.disabled);
}

function enqueueUpdate(payload) {
  const queue = loadQueue();
  const savedItem = {
    ...payload,
    savedAt: new Date().toISOString(),
  };
  const existingIndex = queue.findIndex(
    (item) => item.p_driver_id === payload.p_driver_id
  );

  if (existingIndex >= 0) {
    queue[existingIndex] = savedItem;
  } else {
    queue.push(savedItem);
  }

  saveQueue(queue);
  setQueueNote(TEXT.savedOffline);
}

function shouldQueueUpdate(error) {
  const message = String(error?.message || "");
  return (
    !navigator.onLine ||
    /fetch/i.test(message) ||
    /network/i.test(message) ||
    /Failed to fetch/i.test(message)
  );
}

function getDraftKey(driverRef) {
  if (driverRef?.type === "number") {
    return `${DRAFT_KEY}-number-${driverRef.value}`;
  }

  if (driverRef?.type === "id") {
    return `${DRAFT_KEY}-id-${driverRef.value}`;
  }

  return `${DRAFT_KEY}-generic`;
}

function getActiveDraftKey() {
  const selectedDriverId = Number(driverSelect.value);

  if (selectedDriverId) {
    return `${DRAFT_KEY}-driver-${selectedDriverId}`;
  }

  return getDraftKey(requestedDriverRef);
}

function saveDraft() {
  const draft = {
    driverId: Number(driverSelect.value) || null,
    status: statusSelect.value,
    locationTemplate: locationTemplateSelect.value,
    locationText: locationInput.value,
    collectUntilDate: collectUntilInput.value || null,
    lat: selectedCoordinates.lat,
    lon: selectedCoordinates.lon,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(getActiveDraftKey(), JSON.stringify(draft));
}

function clearDraft() {
  localStorage.removeItem(getActiveDraftKey());
}

function restoreDraft() {
  const selectedDriverId = Number(driverSelect.value);
  const keys = [];

  if (selectedDriverId) {
    keys.push(`${DRAFT_KEY}-driver-${selectedDriverId}`);
  }

  keys.push(getDraftKey(requestedDriverRef));

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        continue;
      }

      const draft = JSON.parse(raw);

      if (draft.driverId) {
        driverSelect.value = String(draft.driverId);
      }

      if (draft.status) {
        statusSelect.value = draft.status;
      }

      if (draft.locationText) {
        locationInput.value = draft.locationText;
      }

      collectUntilInput.value = draft.collectUntilDate || "";

      selectedCoordinates = {
        lat: draft.lat ?? null,
        lon: draft.lon ?? null,
      };

      fillTemplateOptions(getSelectedDriver());
      locationTemplateSelect.value = draft.locationTemplate || "";
      syncTemplateSelectFromLocation();

      if (selectedCoordinates.lat !== null && selectedCoordinates.lon !== null) {
        geoStatus.textContent = `${TEXT.geoSaved}: ${selectedCoordinates.lat}, ${selectedCoordinates.lon}`;
      }

      setQueueNote(TEXT.draftRestored);
      return true;
    } catch {
      // Ignore broken draft.
    }
  }

  return false;
}

function findRequestedDriver() {
  if (!requestedDriverRef) {
    return null;
  }

  if (requestedDriverRef.type === "number") {
    return drivers.find((driver) => driver.number === requestedDriverRef.value) ?? null;
  }

  return drivers.find((driver) => driver.id === requestedDriverRef.value) ?? null;
}

function getSelectedDriver() {
  return drivers.find((driver) => driver.id === Number(driverSelect.value)) ?? null;
}

function getTemplateValues(driver) {
  return getLocationTemplateGroups(driver).flatMap((group) => group.options);
}

function fillStatusOptions() {
  statusSelect.innerHTML = "";

  DRIVER_STATUSES.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = getStatusLabel(status);
    statusSelect.appendChild(option);
  });
}

function fillTemplateOptions(driver) {
  const currentValue = locationInput.value.trim();

  locationTemplateSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = TEXT.chooseTemplate;
  locationTemplateSelect.appendChild(placeholder);

  const custom = document.createElement("option");
  custom.value = CUSTOM_TEMPLATE;
  custom.textContent = TEXT.customTemplate;
  locationTemplateSelect.appendChild(custom);

  getLocationTemplateGroups(driver).forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;

    group.options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      optgroup.appendChild(option);
    });

    locationTemplateSelect.appendChild(optgroup);
  });

  if (!currentValue) {
    locationTemplateSelect.value = "";
    return;
  }

  const templateValues = getTemplateValues(driver);
  locationTemplateSelect.value = templateValues.includes(currentValue)
    ? currentValue
    : CUSTOM_TEMPLATE;
}

function fillDriverOptions(items) {
  const currentValue = driverSelect.value;

  driverSelect.innerHTML = `<option value="">${TEXT.chooseSelf}</option>`;

  items.forEach((driver) => {
    const option = document.createElement("option");
    option.value = String(driver.id);
    option.textContent = getDriverDisplayName(driver);
    driverSelect.appendChild(option);
  });

  if (currentValue) {
    driverSelect.value = currentValue;
  }
}

function renderAdminLinks(items) {
  if (!isAdminMode) {
    adminPanel.classList.add("hidden");
    return;
  }

  driverLinks.innerHTML = "";

  items.forEach((driver) => {
    const link = document.createElement("a");
    link.className = "admin-link-card";
    link.href = buildDriverPageLink(driver);
    link.innerHTML = `
      <strong>${getDriverDisplayName(driver)}</strong>
      <span>${TEXT.personalLinkLabel}</span>
      <span>${buildDriverPageLink(driver)}</span>
    `;
    driverLinks.appendChild(link);
  });

  adminPanel.classList.remove("hidden");
}

function syncTemplateSelectFromLocation() {
  const driver = getSelectedDriver();
  const locationValue = locationInput.value.trim();
  const templateValues = getTemplateValues(driver);

  if (!locationValue) {
    locationTemplateSelect.value = "";
    return;
  }

  locationTemplateSelect.value = templateValues.includes(locationValue)
    ? locationValue
    : CUSTOM_TEMPLATE;
}

function applyTemplateValue(templateValue) {
  if (!templateValue || templateValue === CUSTOM_TEMPLATE) {
    syncTemplateSelectFromLocation();
    return;
  }

  locationInput.value = templateValue;
  syncTemplateSelectFromLocation();
  saveDraft();
}

function applyDefaultTemplateForStatus(force = false) {
  const driver = getSelectedDriver();
  const templateValue = getDefaultTemplateForStatus(statusSelect.value, driver);
  const currentValue = locationInput.value.trim();
  const templateValues = getTemplateValues(driver);

  if (!templateValue) {
    syncTemplateSelectFromLocation();
    return;
  }

  if (force || !currentValue || templateValues.includes(currentValue)) {
    applyTemplateValue(templateValue);
    return;
  }

  syncTemplateSelectFromLocation();
}

function updateHeroForDriver(driver) {
  const displayName = getDriverDisplayName(driver);

  if (isAdminMode) {
    heroTitle.textContent = TEXT.coordinatorTitle;
    if (heroText) heroText.textContent = TEXT.coordinatorText;
    driverField.classList.remove("hidden");
    return;
  }

  if (!requestedDriverRef || !driver) {
    heroTitle.textContent = TEXT.personalTitle;
    if (heroText) heroText.textContent = TEXT.personalText;
    driverField.classList.remove("hidden");
    return;
  }

  heroTitle.textContent = displayName;
  if (heroText) heroText.textContent = "";
  driverField.classList.add("hidden");
}

function renderSnapshot(driverId) {
  if (!lastLocationLine) {
    return;
  }

  const selectedDriver = drivers.find((driver) => driver.id === Number(driverId));
  const current = selectedDriver?.current_status;
  const locationText = current?.location_text || TEXT.noData;
  lastLocationLine.textContent = `РџРѕСЃР»РµРґРЅРµРµ РјРµСЃС‚РѕРїРѕР»РѕР¶РµРЅРёРµ: ${locationText}`;
}

function seedFormForDriver(driver) {
  if (!driver) {
    return;
  }

  const current = driver.current_status;

  if (current) {
    statusSelect.value = current.status || STATUS_COLLECTING_IN_RUSSIA;
    locationInput.value = current.location_text || "";
    collectUntilInput.value = current.collect_until_date || "";
  } else {
    statusSelect.value = STATUS_COLLECTING_IN_RUSSIA;
    locationInput.value = "";
    collectUntilInput.value = "";
  }

  fillTemplateOptions(driver);

  if (current) {
    syncTemplateSelectFromLocation();
    return;
  }

  applyDefaultTemplateForStatus(true);
}

function updateGeoStatus(message) {
  geoStatus.textContent = message;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch {
    // No-op.
  }
}

async function sendUpdate(payload) {
  let { error } = await supabase.rpc("update_driver_status_simple", payload);

  const message = String(error?.message || "");
  const canRetryWithoutCollectUntil =
    payload.p_collect_until_date !== undefined &&
    /p_collect_until_date|function public\.update_driver_status_simple|does not exist|No function matches/i.test(
      message
    );

  if (error && canRetryWithoutCollectUntil) {
    const { p_collect_until_date, ...legacyPayload } = payload;
    ({ error } = await supabase.rpc("update_driver_status_simple", legacyPayload));
  }

  if (error) {
    throw error;
  }
}

async function flushQueue() {
  const queue = loadQueue();

  if (!queue.length || !navigator.onLine) {
    updateQueuePanel();
    return;
  }

  queueSummary.textContent = TEXT.queueRetrying;

  const remaining = [];

  for (const item of queue) {
    try {
      await sendUpdate({
        p_driver_id: item.p_driver_id,
        p_status: item.p_status,
        p_location_text: item.p_location_text,
        p_lat: item.p_lat,
        p_lon: item.p_lon,
        p_is_collecting_in_russia: item.p_is_collecting_in_russia,
        p_collect_until_date: item.p_collect_until_date,
      });
    } catch {
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  queueNote = "";
  updateQueuePanel();

  if (!remaining.length) {
    clearError();
    await loadFormData();
  }
}

async function loadFormData() {
  submitButton.disabled = true;
  updateSubmitUi();

  try {
    assertSupabaseConfigured();
    clearError();
    drivers = await fetchDrivers();
    fillDriverOptions(drivers);
    fillStatusOptions();
    renderAdminLinks(drivers);

    const requestedDriver = findRequestedDriver();
    const initialDriver =
      (!isAdminMode && requestedDriver) ||
      getSelectedDriver() ||
      drivers[0] ||
      null;

    if (initialDriver) {
      driverSelect.value = String(initialDriver.id);
      updateHeroForDriver(initialDriver);
      renderSnapshot(initialDriver.id);
      seedFormForDriver(initialDriver);
    } else {
      updateHeroForDriver(null);
    }

    const restored = restoreDraft();

    if (restored) {
      updateHeroForDriver(getSelectedDriver());
      renderSnapshot(driverSelect.value);
    }

    updateQueuePanel();
  } catch (error) {
    setError(error.message || TEXT.loadDriversFailed);
    restoreDraft();
    updateQueuePanel();
  } finally {
    submitButton.disabled = false;
    updateSubmitUi();
  }
}

driverSelect.addEventListener("change", (event) => {
  const driver = drivers.find((item) => item.id === Number(event.target.value)) ?? null;
  updateHeroForDriver(driver);
  renderSnapshot(event.target.value);
  seedFormForDriver(driver);
  saveDraft();
});

statusSelect.addEventListener("change", () => {
  applyDefaultTemplateForStatus();
  saveDraft();
});

locationTemplateSelect.addEventListener("change", () => {
  if (locationTemplateSelect.value === CUSTOM_TEMPLATE) {
    locationInput.focus();
    syncTemplateSelectFromLocation();
    saveDraft();
    return;
  }

  applyTemplateValue(locationTemplateSelect.value);
  locationInput.focus();
  saveDraft();
});

locationInput.addEventListener("input", () => {
  syncTemplateSelectFromLocation();
  saveDraft();
});

collectUntilInput.addEventListener("input", () => {
  saveDraft();
});

geoButton.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    updateGeoStatus(TEXT.geoUnsupported);
    return;
  }

  geoButton.disabled = true;
  updateGeoStatus(TEXT.geoLoading);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      selectedCoordinates = {
        lat: Number(position.coords.latitude.toFixed(6)),
        lon: Number(position.coords.longitude.toFixed(6)),
      };

      updateGeoStatus(
        `${TEXT.geoSaved}: ${selectedCoordinates.lat}, ${selectedCoordinates.lon}`
      );
      geoButton.disabled = false;
      saveDraft();
    },
    (error) => {
      updateGeoStatus(error.message || TEXT.geoFailed);
      geoButton.disabled = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
});

retryQueueButton.addEventListener("click", () => {
  flushQueue();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const driverId = Number(driverSelect.value);
  const status = statusSelect.value;
  const locationText = locationInput.value.trim();
  const payload = {
    p_driver_id: driverId,
    p_status: status,
    p_location_text: locationText,
    p_lat: selectedCoordinates.lat,
    p_lon: selectedCoordinates.lon,
    p_is_collecting_in_russia: status === STATUS_COLLECTING_IN_RUSSIA,
    p_collect_until_date: collectUntilInput.value || null,
  };

  if (!driverId) {
    setError(TEXT.chooseDriver);
    return;
  }

  if (!locationText) {
    setError(TEXT.enterLocation);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = TEXT.submitting;

  try {
    assertSupabaseConfigured();

    if (!navigator.onLine) {
      enqueueUpdate(payload);
      clearDraft();
      setError(TEXT.savedOffline);
      return;
    }

    await sendUpdate(payload);

    updateGeoStatus(
      selectedCoordinates.lat !== null && selectedCoordinates.lon !== null
        ? TEXT.sentWithGeo
        : TEXT.sentWithoutGeo
    );

    selectedCoordinates = { lat: null, lon: null };
    queueNote = "";
    clearDraft();
    await loadFormData();
  } catch (error) {
    if (shouldQueueUpdate(error)) {
      enqueueUpdate(payload);
      clearDraft();
      setError(TEXT.savedOffline);
    } else {
      setError(error.message || TEXT.updateFailed);
    }
  } finally {
    submitButton.disabled = false;
    updateSubmitUi();
  }
});

window.addEventListener("online", () => {
  setConnectionBanner();
  flushQueue();
});

window.addEventListener("offline", () => {
  setConnectionBanner();
  updateQueuePanel();
});

setConnectionBanner();
registerServiceWorker();
loadFormData();
flushQueue();
