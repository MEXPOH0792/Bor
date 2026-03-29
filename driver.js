import {
  DRIVER_STATUSES,
  assertSupabaseConfigured,
  fetchDrivers,
  formatDateTime,
  supabase,
} from "./supabase.js";

const TEXT = {
  chooseSelf: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0431\u044F",
  driver: "\u0412\u043E\u0434\u0438\u0442\u0435\u043B\u044C",
  noData: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445",
  chooseTemplate:
    "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0448\u0430\u0431\u043B\u043E\u043D",
  customTemplate: "\u0421\u0432\u043E\u0439 \u0442\u0435\u043A\u0441\u0442",
  geoUnsupported:
    "\u0413\u0435\u043E\u043B\u043E\u043A\u0430\u0446\u0438\u044F \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u044D\u0442\u043E\u043C \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435.",
  geoLoading: "\u0417\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u044E \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B...",
  geoSaved: "\u041A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B",
  geoFailed:
    "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B. \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0439\u0442\u0435 \u0431\u0435\u0437 \u043D\u0438\u0445.",
  chooseDriver: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044F.",
  enterLocation:
    "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043C\u0435\u0441\u0442\u043E\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u043E\u043C.",
  submitting: "\u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430...",
  submit: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
  sentWithGeo:
    "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E. \u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B \u0432 \u0431\u0430\u0437\u0435.",
  sentWithoutGeo:
    "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u0431\u0435\u0437 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442.",
  loadDriversFailed:
    "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A \u0432\u043E\u0434\u0438\u0442\u0435\u043B\u0435\u0439.",
  updateFailed:
    "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Supabase.",
  shaidonPoint:
    "\u0422\u043E\u0447\u043A\u0430 \u0432 \u0428\u0430\u0439\u0434\u043E\u043D\u0435",
  routePoint:
    "\u041E\u0431\u0449\u0438\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442",
  routeRussia:
    "\u0420\u043E\u0441\u0441\u0438\u044F: \u0412\u0414\u041D\u0425 \u0438 \u0415\u0441\u0435\u043D\u0438\u043D\u0430 109.",
};

const CUSTOM_TEMPLATE = "__custom__";
const COLLECTING_STATUS = DRIVER_STATUSES[0];
const BORDER_STATUS = DRIVER_STATUSES[2];
const SHAIDON_STATUS = DRIVER_STATUSES[3];
const UNLOADING_STATUS = DRIVER_STATUSES[4];

const RUSSIA_COLLECT_POINT = "\u0412\u0414\u041D\u0425";
const RUSSIA_UNLOAD_POINT = "\u0415\u0441\u0435\u043D\u0438\u043D\u0430 109";
const ROUTE_POINTS = ["\u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u043E\u043D", "\u041A\u0430\u0437\u043E\u043A"];

const DRIVER_PROFILES = {
  1: {
    name: "\u0410\u0445\u043B\u0438\u0434\u0434\u0438\u043D",
    shaidonPoint:
      "\u0413\u0430\u0440\u0430\u0436\u0438 \u0417\u0430\u0440\u0438\u0444 (\u043A\u0443\u043C\u0443\u0440 \u0444\u0443\u0440\u0443\u0448)",
  },
  2: {
    name: "\u0410\u0441\u043B\u0438\u0434\u0434\u0438\u043D",
    shaidonPoint: "\u0421\u0435 \u043A\u0443\u0447\u0430\u0433\u0438 \u043B\u0430\u0431\u0438 \u0441\u043E\u0439",
  },
  3: {
    name: "\u0414\u0436\u0430\u043C\u0448\u0435\u0434",
    shaidonPoint: "\u041D\u0430\u0437\u0434\u0438 \u0410\u0437\u0438\u0437\u0445\u0443\u0447\u0430",
  },
  4: {
    name: "\u042D\u0440\u0430\u0447",
    shaidonPoint: "\u0425\u043E\u043D\u0430\u0438 \u042D\u0440\u0430\u0447",
  },
};

const form = document.querySelector("#driverForm");
const driverSelect = document.querySelector("#driverSelect");
const statusSelect = document.querySelector("#statusSelect");
const locationTemplateSelect = document.querySelector("#locationTemplateSelect");
const locationInput = document.querySelector("#locationInput");
const geoButton = document.querySelector("#geoButton");
const geoStatus = document.querySelector("#geoStatus");
const submitButton = document.querySelector("#submitButton");
const errorBanner = document.querySelector("#driverErrorBanner");
const snapshot = document.querySelector("#driverSnapshot");
const heroTitle = document.querySelector("h1");
const heroText = document.querySelector(".hero-text");
const driverField = driverSelect.closest(".field");

let drivers = [];
let selectedCoordinates = { lat: null, lon: null };

function getRequestedDriverRef() {
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

const requestedDriverRef = getRequestedDriverRef();

if (requestedDriverRef) {
  driverField.classList.add("hidden");
  driverSelect.disabled = true;
}

function findRequestedDriver() {
  const ref = requestedDriverRef;

  if (!ref) {
    return null;
  }

  if (ref.type === "number") {
    return drivers.find((driver) => driver.number === ref.value) ?? null;
  }

  return drivers.find((driver) => driver.id === ref.value) ?? null;
}

function getDriverProfile(driver) {
  return driver ? DRIVER_PROFILES[driver.number] ?? null : null;
}

function getDriverDisplayName(driver) {
  const profile = getDriverProfile(driver);
  const rawName = driver?.name?.trim();

  if (profile?.name) {
    return profile.name;
  }

  if (rawName && !/^Водитель\s+\d+$/i.test(rawName)) {
    return rawName;
  }

  return `${TEXT.driver} ${driver?.number ?? ""}`.trim();
}

function getSelectedDriver() {
  return drivers.find((driver) => driver.id === Number(driverSelect.value)) ?? null;
}

function getLocationTemplateGroups(driver) {
  const profile = getDriverProfile(driver);
  const groups = [
    {
      label: "\u0420\u043E\u0441\u0441\u0438\u044F",
      options: [RUSSIA_COLLECT_POINT, RUSSIA_UNLOAD_POINT],
    },
    {
      label: "\u041C\u0430\u0440\u0448\u0440\u0443\u0442",
      options: ROUTE_POINTS,
    },
  ];

  if (profile?.shaidonPoint) {
    groups.push({
      label: "\u0428\u0430\u0439\u0434\u043E\u043D / \u0442\u043E\u0447\u043A\u0430 \u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044F",
      options: [profile.shaidonPoint],
    });
  }

  return groups;
}

function getTemplateValues(driver) {
  return getLocationTemplateGroups(driver).flatMap((group) => group.options);
}

function getDefaultTemplateForStatus(status, driver) {
  const profile = getDriverProfile(driver);

  if (status === COLLECTING_STATUS) {
    return RUSSIA_COLLECT_POINT;
  }

  if (status === UNLOADING_STATUS) {
    return RUSSIA_UNLOAD_POINT;
  }

  if (status === SHAIDON_STATUS) {
    return profile?.shaidonPoint ?? "";
  }

  return "";
}

function setError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function clearError() {
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
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
    option.textContent = `${TEXT.driver} ${driver.number} - ${getDriverDisplayName(driver)}`;
    driverSelect.appendChild(option);
  });

  if (currentValue) {
    driverSelect.value = currentValue;
  }
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

function updateHeroForDriver(driver, isPersonalPage) {
  const profile = getDriverProfile(driver);
  const displayName = getDriverDisplayName(driver);

  if (!isPersonalPage || !driver) {
    heroTitle.textContent =
      "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0432\u043E\u0439 \u0441\u0442\u0430\u0442\u0443\u0441";
    heroText.textContent =
      "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0431\u044F, \u0441\u0442\u0430\u0442\u0443\u0441 \u0438 \u0448\u0430\u0431\u043B\u043E\u043D \u043C\u0435\u0441\u0442\u0430. \u041F\u0440\u0438 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442 \u043C\u0435\u0441\u0442\u043E\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043C\u043E\u0436\u043D\u043E \u043F\u043E\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0432\u0440\u0443\u0447\u043D\u0443\u044E.";
    driverField.classList.remove("hidden");
    return;
  }

  heroTitle.textContent = displayName;
  heroText.textContent = `${TEXT.shaidonPoint}: ${profile?.shaidonPoint ?? TEXT.noData}. ${TEXT.routeRussia}`;
  driverField.classList.add("hidden");
}

function updateSnapshot(driverId) {
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

  fillTemplateOptions(selectedDriver);

  if (current) {
    statusSelect.value = current.status || COLLECTING_STATUS;
    locationInput.value = current.location_text || "";
    syncTemplateSelectFromLocation();
    return;
  }

  statusSelect.value = COLLECTING_STATUS;
  locationInput.value = "";
  applyDefaultTemplateForStatus(true);
}

function updateGeoStatus(message) {
  geoStatus.textContent = message;
}

async function loadFormData() {
  submitButton.disabled = true;

  try {
    assertSupabaseConfigured();
    clearError();
    drivers = await fetchDrivers();
    fillDriverOptions(drivers);
    fillStatusOptions();

    const requestedDriver = findRequestedDriver();

    if (requestedDriver) {
      driverSelect.value = String(requestedDriver.id);
      updateHeroForDriver(requestedDriver, true);
      updateSnapshot(requestedDriver.id);
    } else if (drivers[0]) {
      driverSelect.value = String(drivers[0].id);
      updateHeroForDriver(drivers[0], false);
      updateSnapshot(drivers[0].id);
    }
  } catch (error) {
    setError(error.message || TEXT.loadDriversFailed);
  } finally {
    submitButton.disabled = false;
  }
}

driverSelect.addEventListener("change", (event) => {
  const driver = drivers.find((item) => item.id === Number(event.target.value)) ?? null;
  updateHeroForDriver(driver, false);
  updateSnapshot(event.target.value);
});

statusSelect.addEventListener("change", () => {
  applyDefaultTemplateForStatus();
});

locationTemplateSelect.addEventListener("change", () => {
  if (locationTemplateSelect.value === CUSTOM_TEMPLATE) {
    locationInput.focus();
    syncTemplateSelectFromLocation();
    return;
  }

  applyTemplateValue(locationTemplateSelect.value);
  locationInput.focus();
});

locationInput.addEventListener("input", () => {
  syncTemplateSelectFromLocation();
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

  submitButton.disabled = true;
  submitButton.textContent = TEXT.submitting;

  try {
    assertSupabaseConfigured();

    const { error } = await supabase.rpc("update_driver_status_simple", {
      p_driver_id: driverId,
      p_status: status,
      p_location_text: locationText,
      p_lat: selectedCoordinates.lat,
      p_lon: selectedCoordinates.lon,
      p_is_collecting_in_russia: status === COLLECTING_STATUS,
    });

    if (error) {
      throw error;
    }

    updateGeoStatus(
      selectedCoordinates.lat !== null && selectedCoordinates.lon !== null
        ? TEXT.sentWithGeo
        : TEXT.sentWithoutGeo
    );

    selectedCoordinates = { lat: null, lon: null };
    await loadFormData();
  } catch (error) {
    setError(error.message || TEXT.updateFailed);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = TEXT.submit;
  }
});

loadFormData();
