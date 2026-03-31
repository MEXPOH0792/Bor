import {
  DRIVER_STATUSES,
  STATUS_COLLECTING_IN_RUSSIA,
  assertSupabaseConfigured,
  buildDriverPageLink,
  fetchDrivers,
  formatDateTime,
  getDefaultTemplateForStatus,
  getDriverDisplayName,
  getDriverProfile,
  getLocationTemplateGroups,
  getRequestedDriverRef,
  isAdminModeRequested,
  supabase,
} from "./supabase.js";

const QUEUE_KEY = "bor-driver-update-queue-v1";
const DRAFT_KEY = "bor-driver-draft-v1";
const CUSTOM_TEMPLATE = "__custom__";

const TEXT = {
  chooseSelf: "Выберите себя",
  noData: "Нет данных",
  chooseTemplate: "Выберите шаблон",
  customTemplate: "Свой текст",
  geoUnsupported: "Геолокация не поддерживается в этом браузере.",
  geoLoading: "Запрашиваю координаты...",
  geoSaved: "Координаты сохранены",
  geoFailed: "Не удалось получить координаты. Продолжайте без них.",
  chooseDriver: "Сначала выберите водителя.",
  enterLocation: "Введите местоположение текстом.",
  submitting: "Отправка...",
  submitOnline: "Обновить",
  submitOffline: "Сохранить на телефоне",
  sentWithGeo: "Обновление отправлено. Последние координаты сохранены в базе.",
  sentWithoutGeo: "Обновление отправлено без координат.",
  savedOffline:
    "Интернет слабый. Обновление сохранено на устройстве и будет отправлено при появлении связи.",
  loadDriversFailed: "Не удалось загрузить список водителей.",
  updateFailed: "Не удалось обновить статус. Проверьте настройки Supabase.",
  shaidonPoint: "Точка в Шайдоне",
  routeRussia: "Россия: ВДНХ и Есенина 109.",
  onlineBanner: "Связь есть. Можно отправлять обновления сразу.",
  offlineBanner:
    "Связь слабая или отсутствует. Обновления будут временно сохраняться на устройстве.",
  queueEmpty: "Нет отложенных обновлений.",
  queueCount: "Не отправлено обновлений",
  queueRetrying: "Пробую отправить сохраненные обновления...",
  draftRestored: "Черновик формы восстановлен с этого устройства.",
  submitHintOnline: "При слабом интернете обновление сначала сохранится на устройстве.",
  submitHintOffline: "Сейчас связи нет. Кнопка сохранит обновление на этом телефоне.",
  coordinatorTitle: "Режим координатора",
  coordinatorText:
    "Можно выбрать любого водителя из списка или перейти на его личную ссылку.",
  personalTitle: "Обновить свой статус",
  personalText:
    "Выберите статус и шаблон места. Если интернет пропадет, обновление будет сохранено на устройстве и отправлено позже.",
  personalLinkLabel: "Личная ссылка",
};

const form = document.querySelector("#driverForm");
const driverSelect = document.querySelector("#driverSelect");
const statusSelect = document.querySelector("#statusSelect");
const locationTemplateSelect = document.querySelector("#locationTemplateSelect");
const locationInput = document.querySelector("#locationInput");
const geoButton = document.querySelector("#geoButton");
const geoStatus = document.querySelector("#geoStatus");
const submitButton = document.querySelector("#submitButton");
const submitHint = document.querySelector("#submitHint");
const retryQueueButton = document.querySelector("#retryQueueButton");
const queuePanel = document.querySelector("#queuePanel");
const queueSummary = document.querySelector("#queueSummary");
const connectionBanner = document.querySelector("#connectionBanner");
const errorBanner = document.querySelector("#driverErrorBanner");
const snapshot = document.querySelector("#driverSnapshot");
const heroTitle = document.querySelector("h1");
const heroText = document.querySelector(".hero-text");
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
      `${TEXT.queueCount}: ${queue.length}. Последнее сохранение: ${formatDateTime(
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
    option.textContent = status;
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
  const profile = getDriverProfile(driver);
  const displayName = getDriverDisplayName(driver);

  if (isAdminMode) {
    heroTitle.textContent = TEXT.coordinatorTitle;
    heroText.textContent = TEXT.coordinatorText;
    driverField.classList.remove("hidden");
    return;
  }

  if (!requestedDriverRef || !driver) {
    heroTitle.textContent = TEXT.personalTitle;
    heroText.textContent = TEXT.personalText;
    driverField.classList.remove("hidden");
    return;
  }

  heroTitle.textContent = displayName;
  heroText.textContent = `${TEXT.shaidonPoint}: ${profile?.shaidonPoint ?? TEXT.noData}. ${TEXT.routeRussia}`;
  driverField.classList.add("hidden");
}

function renderSnapshot(driverId) {
  const selectedDriver = drivers.find((driver) => driver.id === Number(driverId));
  const current = selectedDriver?.current_status;
  const values = [
    current?.status || TEXT.noData,
    current?.location_text || TEXT.noData,
    formatDateTime(current?.updated_at),
  ];

  snapshot.querySelectorAll("dd").forEach((node, index) => {
    node.textContent = values[index];
  });
}

function seedFormForDriver(driver) {
  if (!driver) {
    return;
  }

  const current = driver.current_status;

  if (current) {
    statusSelect.value = current.status || STATUS_COLLECTING_IN_RUSSIA;
    locationInput.value = current.location_text || "";
  } else {
    statusSelect.value = STATUS_COLLECTING_IN_RUSSIA;
    locationInput.value = "";
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
  const { error } = await supabase.rpc("update_driver_status_simple", payload);

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
