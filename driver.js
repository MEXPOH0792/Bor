import {
  DRIVER_STATUSES,
  STATUS_COLLECTING_IN_RUSSIA,
  assertSupabaseConfigured,
  buildDriverPageLink,
  fetchDrivers,
  formatDateTime,
  getDefaultTemplateForStatus,
  getDriverDisplayName,
  getLocationTemplateGroups,
  getRequestedDriverRef,
  getStatusLabel,
  isAdminModeRequested,
  supabase,
} from "./supabase.js";

const QUEUE_KEY = "bor-driver-update-queue-v1";
const DRAFT_KEY = "bor-driver-draft-v1";
const CUSTOM_TEMPLATE = "__custom__";

const TEXT = {
  chooseSelf: "Выберите себя",
  chooseTemplate: "Выберите шаблон",
  customTemplate: "Свой текст",
  noData: "Нет данных",
  noPending: "Нет отложенных обновлений.",
  submitOnline: "Обновить",
  submitOffline: "Сохранить на телефоне",
  submitting: "Отправка...",
  queueRetrying: "Пробую отправить сохраненные обновления...",
  queuePrefix: "Не отправлено обновлений",
  onlineBanner: "Связь есть. Можно отправлять обновления сразу.",
  offlineBanner:
    "Связь слабая или отсутствует. Обновления будут временно сохранены на устройстве.",
  geoUnsupported: "Геолокация не поддерживается в этом браузере.",
  geoLoading: "Запрашиваю координаты...",
  geoSaved: "Координаты сохранены",
  geoFailed: "Не удалось получить координаты. Продолжайте без них.",
  chooseDriver: "Сначала выберите водителя.",
  enterLocation: "Введите местоположение текстом.",
  sentWithGeo: "Обновление отправлено. Координаты сохранены в базе.",
  sentWithoutGeo: "Обновление отправлено.",
  savedOffline: "Интернет слабый. Обновление сохранено на устройстве и будет отправлено позже.",
  loadDriversFailed: "Не удалось загрузить список водителей.",
  updateFailed: "Не удалось обновить статус. Проверьте настройки Supabase.",
  draftRestored: "Черновик формы восстановлен с этого устройства.",
  submitHintOnline: "При слабом интернете обновление сначала сохранится на устройстве.",
  submitHintOffline: "Сейчас связи нет. Кнопка сохранит обновление на этом телефоне.",
  personalTitle: "Обновить свой статус",
  personalText:
    "Укажите статус, место и при необходимости дату. Если интернет пропадет, обновление сохранится локально.",
  coordinatorTitle: "Координатор",
  coordinatorText: "Все водители на одном экране. Каждая карточка обновляется отдельно.",
  personalLinkLabel: "Личная ссылка",
  lastLocationPrefix: "Последнее местоположение",
  invalidDriver: "Ссылка водителя недействительна или водитель отключен.",
  adminCurrentStatus: "Текущий статус",
  adminUpdatedAt: "Обновлено",
  adminCollectUntil: "Сбор до",
  adminSavedOffline: "Сохранено локально. Отправлю, когда появится связь.",
  adminUpdated: "Статус обновлен.",
  adminSubmit: "Обновить водителя",
  adminNoDate: "Не указано",
  queueLineLabel: "Последнее сохранение",
};

const form = document.querySelector("#driverForm");
const driverSelect = document.querySelector("#driverSelect");
const driverField = document.querySelector("#driverField");
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
const heroTitle = document.querySelector("#heroTitle");
const heroText = document.querySelector("#heroText");
const personalSection = document.querySelector("#personalSection");
const adminPanel = document.querySelector("#adminPanel");
const adminForms = document.querySelector("#adminForms");

const requestedDriverRef = getRequestedDriverRef();
const isAdminMode = isAdminModeRequested();

let drivers = [];
let selectedCoordinates = { lat: null, lon: null };
let queueNote = "";
let personalFormLocked = false;

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
  if (!submitButton) {
    return;
  }

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
    queueSummary.textContent = TEXT.noPending;
    queuePanel.classList.add("hidden");
    retryQueueButton.disabled = true;
    retryQueueButton.classList.add("button-muted");
    return;
  }

  const parts = [];

  if (queue.length) {
    const latest = queue[queue.length - 1];
    parts.push(
      `${TEXT.queuePrefix}: ${queue.length}. ${TEXT.queueLineLabel}: ${formatDateTime(
        latest.savedAt
      )}`
    );
  }

  if (queueNote) {
    parts.unshift(queueNote);
  }

  queueSummary.textContent = parts.join(" ");
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
  const existingIndex = queue.findIndex((item) => item.p_driver_id === payload.p_driver_id);

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
  if (isAdminMode) {
    return;
  }

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
  if (isAdminMode) {
    return;
  }

  localStorage.removeItem(getActiveDraftKey());
}

function getSelectedDriver() {
  return drivers.find((driver) => driver.id === Number(driverSelect.value)) ?? null;
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

function getTemplateValues(driver) {
  return getLocationTemplateGroups(driver).flatMap((group) => group.options);
}

function createStatusOptions(selectedValue) {
  return DRIVER_STATUSES.map((status) => {
    const selected = status === selectedValue ? " selected" : "";
    return `<option value="${status}"${selected}>${getStatusLabel(status)}</option>`;
  }).join("");
}

function createTemplateOptions(driver, locationValue) {
  const templateValues = getTemplateValues(driver);
  const normalizedValue = locationValue?.trim() || "";
  const selectedTemplate = !normalizedValue
    ? ""
    : templateValues.includes(normalizedValue)
      ? normalizedValue
      : CUSTOM_TEMPLATE;

  const baseOptions = [
    `<option value="">${TEXT.chooseTemplate}</option>`,
    `<option value="${CUSTOM_TEMPLATE}"${
      selectedTemplate === CUSTOM_TEMPLATE ? " selected" : ""
    }>${TEXT.customTemplate}</option>`,
  ];

  const groupedOptions = getLocationTemplateGroups(driver)
    .map((group) => {
      const options = group.options
        .map((value) => {
          const selected = value === selectedTemplate ? " selected" : "";
          return `<option value="${value}"${selected}>${value}</option>`;
        })
        .join("");

      return `<optgroup label="${group.label}">${options}</optgroup>`;
    })
    .join("");

  return baseOptions.join("") + groupedOptions;
}

function fillStatusOptions() {
  statusSelect.innerHTML = createStatusOptions(STATUS_COLLECTING_IN_RUSSIA);
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

function fillTemplateOptions(driver) {
  locationTemplateSelect.innerHTML = createTemplateOptions(driver, locationInput.value);
}

function syncTemplateSelectFromLocation(selectElement, inputElement, driver) {
  const locationValue = inputElement.value.trim();
  const templateValues = getTemplateValues(driver);

  if (!locationValue) {
    selectElement.value = "";
    return;
  }

  selectElement.value = templateValues.includes(locationValue)
    ? locationValue
    : CUSTOM_TEMPLATE;
}

function applyTemplateValue(selectElement, inputElement, driver, templateValue) {
  if (!templateValue || templateValue === CUSTOM_TEMPLATE) {
    syncTemplateSelectFromLocation(selectElement, inputElement, driver);
    return;
  }

  inputElement.value = templateValue;
  syncTemplateSelectFromLocation(selectElement, inputElement, driver);
}

function applyDefaultTemplateForStatus(selectElement, inputElement, statusValue, driver, force = false) {
  const templateValue = getDefaultTemplateForStatus(statusValue, driver);
  const currentValue = inputElement.value.trim();
  const templateValues = getTemplateValues(driver);

  if (!templateValue) {
    syncTemplateSelectFromLocation(selectElement, inputElement, driver);
    return;
  }

  if (force || !currentValue || templateValues.includes(currentValue)) {
    applyTemplateValue(selectElement, inputElement, driver, templateValue);
    return;
  }

  syncTemplateSelectFromLocation(selectElement, inputElement, driver);
}

function updateHeroForPersonal(driver) {
  if (!requestedDriverRef || !driver) {
    heroTitle.textContent = TEXT.personalTitle;
    heroText.textContent = TEXT.personalText;
    driverField.classList.remove("hidden");
    return;
  }

  heroTitle.textContent = getDriverDisplayName(driver);
  heroText.textContent = TEXT.personalText;
  driverField.classList.add("hidden");
}

function renderSnapshot(driverId) {
  const selectedDriver = drivers.find((driver) => driver.id === Number(driverId));
  const current = selectedDriver?.current_status;
  const locationText = current?.location_text || TEXT.noData;
  lastLocationLine.textContent = `${TEXT.lastLocationPrefix}: ${locationText}`;
}

function restoreDraft() {
  if (isAdminMode) {
    return false;
  }

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
      syncTemplateSelectFromLocation(locationTemplateSelect, locationInput, getSelectedDriver());

      if (selectedCoordinates.lat !== null && selectedCoordinates.lon !== null) {
        geoStatus.textContent = `${TEXT.geoSaved}: ${selectedCoordinates.lat}, ${selectedCoordinates.lon}`;
      }

      setQueueNote(TEXT.draftRestored);
      return true;
    } catch {
      // ignore broken draft
    }
  }

  return false;
}

function seedPersonalForm(driver) {
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
    syncTemplateSelectFromLocation(locationTemplateSelect, locationInput, driver);
  } else {
    applyDefaultTemplateForStatus(
      locationTemplateSelect,
      locationInput,
      statusSelect.value,
      driver,
      true
    );
  }
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
    // no-op
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

async function refreshModeData() {
  if (isAdminMode) {
    await loadAdminData();
    return;
  }

  await loadPersonalData();
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
    await refreshModeData();
  }
}

function buildAdminCard(driver) {
  const current = driver.current_status;
  const statusValue = current?.status || STATUS_COLLECTING_IN_RUSSIA;
  const locationValue =
    current?.location_text || getDefaultTemplateForStatus(statusValue, driver) || "";
  const collectUntil = current?.collect_until_date || "";
  const updatedAt = current?.updated_at ? formatDateTime(current.updated_at) : TEXT.noData;
  const currentStatusLabel = current ? getStatusLabel(current.status) : TEXT.noData;
  const currentLocation = current?.location_text || TEXT.noData;
  const collectUntilText = collectUntil || TEXT.adminNoDate;

  return `
    <article class="admin-driver-card" data-driver-id="${driver.id}">
      <div class="admin-card-head">
        <div>
          <h3>${getDriverDisplayName(driver)}</h3>
          <p class="muted">${TEXT.personalLinkLabel}: <a href="${buildDriverPageLink(
            driver
          )}">${buildDriverPageLink(driver)}</a></p>
        </div>
        <a class="button button-secondary" href="${buildDriverPageLink(driver)}">Открыть личную</a>
      </div>

      <dl class="driver-snapshot admin-driver-snapshot">
        <div>
          <dt>${TEXT.adminCurrentStatus}</dt>
          <dd>${currentStatusLabel}</dd>
        </div>
        <div>
          <dt>${TEXT.lastLocationPrefix}</dt>
          <dd>${currentLocation}</dd>
        </div>
        <div>
          <dt>${TEXT.adminUpdatedAt}</dt>
          <dd>${updatedAt}</dd>
        </div>
      </dl>

      <div class="admin-form-grid">
        <label class="field">
          <span>Статус</span>
          <select class="admin-status-select">${createStatusOptions(statusValue)}</select>
        </label>

        <label class="field">
          <span>Шаблон места</span>
          <select class="admin-template-select">${createTemplateOptions(driver, locationValue)}</select>
        </label>

        <label class="field">
          <span>Местоположение</span>
          <input class="admin-location-input" type="text" maxlength="120" value="${locationValue}" />
        </label>

        <label class="field">
          <span>Сбор до даты</span>
          <input class="admin-collect-until-input" type="date" value="${collectUntil}" />
        </label>
      </div>

      <div class="admin-card-actions">
        <p class="muted admin-card-note">${TEXT.adminCollectUntil}: ${collectUntilText}</p>
        <button class="button button-primary admin-submit-button" type="button">${TEXT.adminSubmit}</button>
      </div>

      <p class="admin-status-line muted" aria-live="polite"></p>
    </article>
  `;
}

function attachAdminCardEvents(card, driver) {
  const statusField = card.querySelector(".admin-status-select");
  const templateField = card.querySelector(".admin-template-select");
  const locationField = card.querySelector(".admin-location-input");
  const collectUntilField = card.querySelector(".admin-collect-until-input");
  const submitField = card.querySelector(".admin-submit-button");
  const statusLine = card.querySelector(".admin-status-line");
  const noteLine = card.querySelector(".admin-card-note");

  const syncTemplate = () => {
    syncTemplateSelectFromLocation(templateField, locationField, driver);
  };

  const updateCollectUntilNote = () => {
    noteLine.textContent = `${TEXT.adminCollectUntil}: ${
      collectUntilField.value || TEXT.adminNoDate
    }`;
  };

  statusField.addEventListener("change", () => {
    applyDefaultTemplateForStatus(
      templateField,
      locationField,
      statusField.value,
      driver
    );
    updateCollectUntilNote();
  });

  templateField.addEventListener("change", () => {
    if (templateField.value === CUSTOM_TEMPLATE) {
      locationField.focus();
      syncTemplate();
      return;
    }

    applyTemplateValue(templateField, locationField, driver, templateField.value);
    locationField.focus();
  });

  locationField.addEventListener("input", () => {
    syncTemplate();
  });

  collectUntilField.addEventListener("input", updateCollectUntilNote);

  submitField.addEventListener("click", async () => {
    clearError();
    const locationText = locationField.value.trim();

    if (!locationText) {
      statusLine.textContent = TEXT.enterLocation;
      return;
    }

    const payload = {
      p_driver_id: driver.id,
      p_status: statusField.value,
      p_location_text: locationText,
      p_lat: null,
      p_lon: null,
      p_is_collecting_in_russia: statusField.value === STATUS_COLLECTING_IN_RUSSIA,
      p_collect_until_date: collectUntilField.value || null,
    };

    submitField.disabled = true;
    submitField.textContent = TEXT.submitting;

    try {
      assertSupabaseConfigured();

      if (!navigator.onLine) {
        enqueueUpdate(payload);
        statusLine.textContent = TEXT.adminSavedOffline;
        return;
      }

      await sendUpdate(payload);
      statusLine.textContent = TEXT.adminUpdated;
      queueNote = "";
      await loadAdminData();
    } catch (error) {
      if (shouldQueueUpdate(error)) {
        enqueueUpdate(payload);
        statusLine.textContent = TEXT.adminSavedOffline;
      } else {
        statusLine.textContent = error.message || TEXT.updateFailed;
      }
    } finally {
      submitField.disabled = false;
      submitField.textContent = TEXT.adminSubmit;
      updateQueuePanel();
    }
  });
}

function renderAdminForms(items) {
  adminForms.innerHTML = items.map(buildAdminCard).join("");
  adminForms.querySelectorAll(".admin-driver-card").forEach((card) => {
    const driverId = Number(card.dataset.driverId);
    const driver = items.find((item) => item.id === driverId);

    if (driver) {
      attachAdminCardEvents(card, driver);
    }
  });
}

function disablePersonalForm(message) {
  personalFormLocked = true;
  updateHeroForPersonal(null);
  setError(message);
  Array.from(form.elements).forEach((element) => {
    element.disabled = true;
  });
}

function enablePersonalForm() {
  personalFormLocked = false;
  Array.from(form.elements).forEach((element) => {
    element.disabled = false;
  });
}

async function loadPersonalData() {
  personalSection.classList.remove("hidden");
  adminPanel.classList.add("hidden");
  lastLocationLine.classList.remove("hidden");
  enablePersonalForm();
  submitButton.disabled = true;
  updateSubmitUi();

  try {
    assertSupabaseConfigured();
    clearError();
    drivers = await fetchDrivers();
    fillDriverOptions(drivers);
    fillStatusOptions();

    const requestedDriver = findRequestedDriver();

    if (requestedDriverRef && !requestedDriver) {
      disablePersonalForm(TEXT.invalidDriver);
      updateQueuePanel();
      return;
    }

    const initialDriver =
      requestedDriver ||
      getSelectedDriver() ||
      drivers[0] ||
      null;

    if (initialDriver) {
      driverSelect.value = String(initialDriver.id);
      seedPersonalForm(initialDriver);
      updateHeroForPersonal(initialDriver);
      renderSnapshot(initialDriver.id);
    } else {
      updateHeroForPersonal(null);
      renderSnapshot(null);
    }

    const restored = restoreDraft();

    if (restored) {
      updateHeroForPersonal(getSelectedDriver());
      renderSnapshot(driverSelect.value);
    }

    updateQueuePanel();
  } catch (error) {
    setError(error.message || TEXT.loadDriversFailed);
    updateQueuePanel();
  } finally {
    if (!personalFormLocked) {
      submitButton.disabled = false;
      updateSubmitUi();
    }
  }
}

async function loadAdminData() {
  personalSection.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  lastLocationLine.classList.add("hidden");
  heroTitle.textContent = TEXT.coordinatorTitle;
  heroText.textContent = TEXT.coordinatorText;

  try {
    assertSupabaseConfigured();
    clearError();
    drivers = await fetchDrivers();
    renderAdminForms(drivers);
    updateQueuePanel();
  } catch (error) {
    setError(error.message || TEXT.loadDriversFailed);
    updateQueuePanel();
  }
}

driverSelect.addEventListener("change", (event) => {
  const driver = drivers.find((item) => item.id === Number(event.target.value)) ?? null;

  if (!driver) {
    return;
  }

  updateHeroForPersonal(driver);
  renderSnapshot(event.target.value);
  seedPersonalForm(driver);
  saveDraft();
});

statusSelect.addEventListener("change", () => {
  applyDefaultTemplateForStatus(
    locationTemplateSelect,
    locationInput,
    statusSelect.value,
    getSelectedDriver()
  );
  saveDraft();
});

locationTemplateSelect.addEventListener("change", () => {
  const driver = getSelectedDriver();

  if (locationTemplateSelect.value === CUSTOM_TEMPLATE) {
    locationInput.focus();
    syncTemplateSelectFromLocation(locationTemplateSelect, locationInput, driver);
    saveDraft();
    return;
  }

  applyTemplateValue(locationTemplateSelect, locationInput, driver, locationTemplateSelect.value);
  locationInput.focus();
  saveDraft();
});

locationInput.addEventListener("input", () => {
  syncTemplateSelectFromLocation(locationTemplateSelect, locationInput, getSelectedDriver());
  saveDraft();
});

collectUntilInput.addEventListener("input", saveDraft);

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
      updateGeoStatus(`${TEXT.geoSaved}: ${selectedCoordinates.lat}, ${selectedCoordinates.lon}`);
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

  if (!driverId) {
    setError(TEXT.chooseDriver);
    return;
  }

  if (!locationText) {
    setError(TEXT.enterLocation);
    return;
  }

  const payload = {
    p_driver_id: driverId,
    p_status: status,
    p_location_text: locationText,
    p_lat: selectedCoordinates.lat,
    p_lon: selectedCoordinates.lon,
    p_is_collecting_in_russia: status === STATUS_COLLECTING_IN_RUSSIA,
    p_collect_until_date: collectUntilInput.value || null,
  };

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
    await loadPersonalData();
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

if (requestedDriverRef && !isAdminMode) {
  driverField.classList.add("hidden");
  driverSelect.disabled = true;
}

await refreshModeData();
flushQueue();
