const App = {
  state: {
    unit: "celsius",
    location: null,
    data: null,
    searchTimer: null,
    searchActiveIndex: -1,
  },

  init() {
    this.applyMode();
    this.bindEvents();
    this.setDefaultLocation();
  },

  bindEvents() {
    document.getElementById("unit-btn").addEventListener("click", () => {
      this.setUnit(this.state.unit === "celsius" ? "fahrenheit" : "celsius");
    });

    document.getElementById("hours-toggle").addEventListener("click", () => UI.toggleHours());
    document.getElementById("mode-btn").addEventListener("click", () => this.toggleMode());

    const input = document.getElementById("search-input");
    input.addEventListener("input", () => {
      clearTimeout(this.state.searchTimer);
      const q = input.value.trim();
      if (q.length < 2) {
        this.hideResults();
        return;
      }
      this.state.searchTimer = setTimeout(() => this.runSearch(q), 300);
    });
    input.addEventListener("keydown", (e) => this.onSearchKeydown(e));
    input.addEventListener("blur", () => setTimeout(() => this.hideResults(), 150));

    document.getElementById("locate-btn").addEventListener("click", () => this.useGeolocation());

    document.addEventListener("click", (e) => {
      const item = e.target.closest(".search-result");
      if (item) this.selectResult(item.dataset.index);
    });
  },

  /* ---------- Light / dark mode ---------- */

  applyMode() {
    const stored = (() => {
      try {
        return localStorage.getItem("nimbus-mode");
      } catch (e) {
        return null;
      }
    })();
    if (stored === "dark" || stored === "light") {
      document.documentElement.dataset.mode = stored;
    }
    this.updateModeBtn();
  },

  toggleMode() {
    const next = document.documentElement.dataset.mode === "dark" ? "light" : "dark";
    document.documentElement.dataset.mode = next;
    try {
      localStorage.setItem("nimbus-mode", next);
    } catch (e) {}
    this.updateModeBtn();
  },

  updateModeBtn() {
    const dark = document.documentElement.dataset.mode === "dark";
    const btn = document.getElementById("mode-btn");
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.innerHTML = dark
      ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M5.4 18.6l1.7-1.7M16.9 7.1l1.7-1.7"/></svg>`
      : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5 8.6 8.6 0 1 0 20.5 14.6Z"/></svg>`;
  },

  setDefaultLocation() {
    if (navigator.geolocation) {
      this.useGeolocation();
    } else {
      this.loadCity({ name: "Iloilo City", country: "Philippines", latitude: 10.7202, longitude: 122.5621 });
    }
  },

  useGeolocation() {
    this.showStatus("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        this.loadCity({ name: "Your location", latitude: lat, longitude: lon });
      },
      () => {
        this.showStatus("Location unavailable — showing Iloilo City instead.");
        setTimeout(() => this.hideStatus(), 4000);
        this.loadCity({ name: "Iloilo City", country: "Philippines", latitude: 10.7202, longitude: 122.5621 });
      },
      { timeout: 8000 }
    );
  },

  async loadCity(city) {
    this.hideStatus();
    this.state.location = city;
    UI.showSkeleton();
    try {
      const data = await WeatherAPI.getForecast(city.latitude, city.longitude);
      this.state.data = data;
      UI.renderAll(this.state.location, data, this.state.unit);
    } catch (err) {
      console.error(err);
      UI.hideSkeleton();
      this.showStatus("Could not load weather data. Check your connection and try again.");
      setTimeout(() => this.hideStatus(), 5000);
    }
  },

  /* ---------- Search ---------- */

  async runSearch(q) {
    try {
      const results = await WeatherAPI.searchCity(q);
      UI.renderResults(results);
      this.state.searchActiveIndex = results.length ? 0 : -1;
      if (results.length) this.markActive(0);
    } catch (err) {
      console.error(err);
    }
  },

  onSearchKeydown(e) {
    const results = document.querySelectorAll(".search-result");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.state.searchActiveIndex = Math.min(this.state.searchActiveIndex + 1, results.length - 1);
      this.markActive(this.state.searchActiveIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.state.searchActiveIndex = Math.max(this.state.searchActiveIndex - 1, 0);
      this.markActive(this.state.searchActiveIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length) this.selectResult(this.state.searchActiveIndex >= 0 ? this.state.searchActiveIndex : 0);
    } else if (e.key === "Escape") {
      this.hideResults();
    }
  },

  markActive(index) {
    document.querySelectorAll(".search-result").forEach((el, i) => {
      el.classList.toggle("active", i === index);
    });
  },

  selectResult(index) {
    const city = UI.getResults()[index];
    if (!city) return;
    this.hideResults();
    document.getElementById("search-input").value = "";
    this.loadCity(city);
  },

  hideResults() {
    const box = document.getElementById("search-results");
    box.hidden = true;
    box.innerHTML = "";
    document.getElementById("search-input").setAttribute("aria-expanded", "false");
    this.state.searchActiveIndex = -1;
  },

  /* ---------- Units ---------- */

  setUnit(unit) {
    if (unit === this.state.unit) return;
    this.state.unit = unit;
    UI.updateUnitLabel(unit);
    if (this.state.data) {
      UI.renderAll(this.state.location, this.state.data, this.state.unit);
    }
  },

  /* ---------- Status ---------- */

  showStatus(msg) {
    const el = document.getElementById("status");
    el.textContent = msg;
    el.hidden = false;
  },

  hideStatus() {
    document.getElementById("status").hidden = true;
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());

