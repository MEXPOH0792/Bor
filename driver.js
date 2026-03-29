import {
  DRIVER_STATUSES,
  assertSupabaseConfigured,
  fetchDrivers,
  formatDateTime,
  getDriverIdFromUrl,
  supabase,
} from "./supabase.js";

const TEXT = {
  chooseSelf: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0431\u044F",
  driver: "\u0412\u043E\u0434\u0438\u0442\u0435\u043B\u044C",
  noData: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445",
  geoUnsupported:
    "\u0413\u0435\u043E\u043B\u043E\u043A\u0430\u0446\u0438\u044F \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u044D\u0442\u043E\u043C \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435.",
  geoLoading: "\u0417\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u044E \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B...",
  geoSaved: "\u041A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B",
  geoFailed:
    "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B. \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0439\u0442\u0435 \u0431\u0435\u0437 \u043D\u0438\u0445.",
  chooseDriver: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044F.",
  enterCode: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434 \u0434\u043E\u0441\u0442\u0443\u043F\u0430.",
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
    "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043A\u043E\u0434 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 Supabase.",
};

const COLLECTING_STATUS = DRIVER_STATUSES[0];

const form = document.querySelector("#driverForm");
const driverSelect = document.querySelector("#driverSelect");
const accessCodeInput = document.querySelector("#accessCodeInput");
const statusSelect = document.querySelector("#statusSelect");
const locationInput = document.querySelector("#locationInput");
const geoButton = document.querySelector("#geoButton");
const geoStatus = document.querySelector("#geoStatus");
const submitButton = document.querySelector("#submitButton");
const errorBanner = document.querySelector("#driverErrorBanner");
const snapshot = document.querySelector("#driverSnapshot");

let drivers = [];
let selectedCoordinates = { lat: null, lon: null };

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

function fillDriverOptions(items) {
  const currentValue = driverSelect.value;

  driverSelect.innerHTML = `<option value="">${TEXT.chooseSelf}</option>`;

  items.forEach((driver) => {
    const option = document.createElement("option");
    option.value = String(driver.id);
    option.textContent = `${TEXT.driver} ${driver.number} - ${driver.name}`;
    driverSelect.appendChild(option);
  });

  if (currentValue) {
    driverSelect.value = currentValue;
  }
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

  if (current) {
    statusSelect.value = current.status || COLLECTING_STATUS;
    locationInput.value = current.location_text || "";
    return;
  }

  statusSelect.value = COLLECTING_STATUS;
  locationInput.value = "";
}

function updateGeoStatus(message) {
  geoStatus.textContent = message;
}

function selectDriverFromUrl() {
  const driverId = getDriverIdFromUrl();

  if (!driverId) {
    return;
  }

  const exists = drivers.some((driver) => driver.id === driverId);

  if (exists) {
    driverSelect.value = String(driverId);
    updateSnapshot(driverId);
  }
}

async function loadFormData() {
  submitButton.disabled = true;

  try {
    assertSupabaseConfigured();
    clearError();
    drivers = await fetchDrivers();
    fillDriverOptions(drivers);
    fillStatusOptions();
    selectDriverFromUrl();

    if (!driverSelect.value && drivers[0]) {
      driverSelect.value = String(drivers[0].id);
      updateSnapshot(drivers[0].id);
    }
  } catch (error) {
    setError(error.message || TEXT.loadDriversFailed);
  } finally {
    submitButton.disabled = false;
  }
}

driverSelect.addEventListener("change", (event) => {
  updateSnapshot(event.target.value);
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
  const accessCode = accessCodeInput.value.trim();
  const status = statusSelect.value;
  const locationText = locationInput.value.trim();

  if (!driverId) {
    setError(TEXT.chooseDriver);
    return;
  }

  if (!accessCode) {
    setError(TEXT.enterCode);
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

    const { error } = await supabase.rpc("update_driver_status_with_code", {
      p_driver_id: driverId,
      p_access_code: accessCode,
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

    accessCodeInput.value = "";
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
