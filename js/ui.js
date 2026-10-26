/* Colourful, filled weather glyphs (matching the Nimbus design) */
const CLOUD = "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z";
const MOON = "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z";

const SUN_COLOR = "#ffc53d";
const RAIN_BLUE = "#4f9df0";
const SLATE = "#9fb4d0";
const LIGHT_CLOUD = "#f7fafd";
const LIGHT_CLOUD_LINE = "#ccdbef";
const SNOW_BLUE = "#7cc0f5";
const STORM = "#8fa6c6";

/* Evenly spaced sun rays around a centre point */
function rays(cx, cy, r1, r2, color = SUN_COLOR, width = 2.2) {
  const dirs = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-0.7071, -0.7071], [0.7071, -0.7071],
    [-0.7071, 0.7071], [0.7071, 0.7071],
  ];
  const d = dirs
    .map(([dx, dy]) => {
      const x1 = (cx + dx * r1).toFixed(1);
      const y1 = (cy + dy * r1).toFixed(1);
      const x2 = (cx + dx * r2).toFixed(1);
      const y2 = (cy + dy * r2).toFixed(1);
      return `M${x1} ${y1}L${x2} ${y2}`;
    })
    .join("");
  return `<g stroke="${color}" stroke-width="${width}" stroke-linecap="round"><path d="${d}"/></g>`;
}

/* Cloud scaled + offset, used by the compound icons */
function cloudBody(fill, transform, stroke = "") {
  const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="1.4"` : "";
  return `<g transform="${transform}"><path d="${CLOUD}" fill="${fill}"${strokeAttr}/></g>`;
}

/* Rain-family cloud with drops underneath */
function rainCloud(color, drops) {
  return `${cloudBody(color, "translate(2 -1.6) scale(0.85)")}<g stroke="${color}" stroke-width="2.4" stroke-linecap="round">${drops}</g>`;
}

const ICONS = {
  droplet: '<path d="M12 3.5s5.5 6.2 5.5 10a5.5 5.5 0 1 1-11 0c0-3.8 5.5-10 5.5-10Z" fill="currentColor"/>',
  sun: `<circle cx="12" cy="12" r="4.6" fill="${SUN_COLOR}"/>${rays(12, 12, 6.3, 8.2)}`,
  moon: `<path d="${MOON}" fill="${SUN_COLOR}"/>`,
  "partly-day": `<circle cx="16" cy="7.6" r="4.1" fill="${SUN_COLOR}"/>${rays(16, 7.6, 5.6, 7.2)}${cloudBody(LIGHT_CLOUD, "translate(-1.2 5.4) scale(0.8)", LIGHT_CLOUD_LINE)}`,
  "partly-night": `${cloudBody(LIGHT_CLOUD, "translate(-1.2 5.4) scale(0.8)", LIGHT_CLOUD_LINE)}<g transform="translate(5 0.4) scale(0.6)"><path d="${MOON}" fill="${SUN_COLOR}"/></g>`,
  cloud: `<path d="${CLOUD}" fill="${SLATE}"/>`,
  "cloud-night": `<g transform="translate(0.6 -0.4) scale(0.5)"><path d="${MOON}" fill="${SUN_COLOR}"/></g>${cloudBody(SLATE, "translate(3.6 4.6) scale(0.76)")}`,
  fog: `${cloudBody(SLATE, "translate(0 -2.6)")}<g stroke="${SLATE}" stroke-width="2.4" stroke-linecap="round"><path d="M4.5 19.6h15"/><path d="M7 22.6h10"/></g>`,
  drizzle: rainCloud(RAIN_BLUE, '<path d="M8.5 16.4v1.9"/><path d="M12.5 17.4v1.9"/><path d="M16.5 16.4v1.9"/>'),
  showers: rainCloud(RAIN_BLUE, '<path d="M8.6 16.2 7.6 18.6"/><path d="M12.6 17.4 11.6 19.8"/><path d="M16.6 16.2 15.6 18.6"/>'),
  rain: rainCloud(RAIN_BLUE, '<path d="M8.5 16v3"/><path d="M12.5 17.2v3"/><path d="M16.5 16v3"/>'),
  "rain-heavy": rainCloud(RAIN_BLUE, '<path d="M8.6 15.8 7.2 20.4"/><path d="M12.6 17 11.2 21.6"/><path d="M16.6 15.8 15.2 20.4"/>'),
  snow: `${cloudBody(SLATE, "translate(2 -1.6) scale(0.85)")}<g fill="${SNOW_BLUE}"><circle cx="8.5" cy="17.4" r="1.3"/><circle cx="12.5" cy="19.4" r="1.3"/><circle cx="16.5" cy="17.4" r="1.3"/></g>`,
  "snow-heavy": `${cloudBody(SLATE, "translate(2 -1.6) scale(0.85)")}<g fill="${SNOW_BLUE}"><circle cx="8" cy="16.8" r="1.3"/><circle cx="12.5" cy="19" r="1.3"/><circle cx="17" cy="16.8" r="1.3"/><circle cx="10.2" cy="21" r="1.3"/><circle cx="14.8" cy="21" r="1.3"/></g>`,
  thunder: `${cloudBody(STORM, "translate(2 -1.6) scale(0.85)")}<path d="M13.6 14.4 9.6 20.6h3l-1.4 3.2 4.4-6.6h-3z" fill="${SUN_COLOR}"/>`,
  hail: `${cloudBody(STORM, "translate(2 -1.6) scale(0.85)")}<g fill="${SNOW_BLUE}"><circle cx="8.6" cy="17.6" r="1.4"/><circle cx="13" cy="19.6" r="1.4"/><circle cx="17" cy="17.6" r="1.4"/></g>`,
  unknown: `<circle cx="12" cy="12" r="9" fill="none" stroke="${SLATE}" stroke-width="2"/><path d="M9.3 9.5a2.7 2.7 0 1 1 4 2.4c-.9.5-1.3 1-1.3 2" fill="none" stroke="${SLATE}" stroke-width="2" stroke-linecap="round"/><path d="M12 17.2h.01" stroke="${SLATE}" stroke-width="2.4" stroke-linecap="round"/>`,
};

const UI = {
  _results: [],
  _data: null,
  _unit: "celsius",
  _hours: { today: [] },
  _hoursExpanded: false,

  icon(name, cls = "") {
    const body = ICONS[name] || ICONS.unknown;
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;
  },

  renderAll(location, data, unit) {
    this._data = data;
    this._unit = unit;

    this.renderCurrent(location, data, unit);
    this.renderHours(data, unit);
    this.renderDaily(data, unit);
    this.renderHourPanel();

    ["current", "forecast", "daily"].forEach((id) => {
      const el = document.getElementById(id);
      el.hidden = false;
      el.dataset.rendered = "1";
    });
    this.hideSkeleton();
  },

  renderCurrent(location, data, unit) {
    const c = data.current;
    const w = WeatherCodes.describe(c.weather_code, c.is_day === 1);
    const hourIndex = this.findHourIndex(data.hourly.time, c.time);

    document.getElementById("current-location").textContent = this.locationLabel(location);
    document.getElementById("current-date").textContent = this.mediumDate(c.time);
    document.getElementById("current-temp").textContent = this.temp(c.temperature_2m, unit);
    document.getElementById("current-condition").textContent = w.label;
    document.getElementById("current-summary").textContent = this.summary(c, data, hourIndex);

    const iconBox = document.getElementById("current-icon");
    iconBox.innerHTML = this.icon(w.icon);
    iconBox.setAttribute("aria-label", w.label);

    document.getElementById("current-wind").textContent = `${Math.round(c.wind_speed_10m)} km/h`;
    document.getElementById("current-humidity").textContent = `${Math.round(c.relative_humidity_2m)}%`;
    document.getElementById("current-uv").textContent = this.uvLabel(
      data.hourly.uv_index ? data.hourly.uv_index[hourIndex] : null
    );

    document.getElementById("current-sunrise").textContent = this.timeOnly(data.daily.sunrise[0]);
    document.getElementById("current-sunset").textContent = this.timeOnly(data.daily.sunset[0]);
    document.getElementById("sunrise-sub").textContent = this.relativeTime(data.daily.sunrise[0], c.time);
    document.getElementById("sunset-sub").textContent = this.relativeTime(data.daily.sunset[0], c.time);

    this.updateUnitLabel(unit);
    this.applyTheme(c.weather_code, c.is_day === 1);
  },

  /* Two-sentence readout under the condition, e.g.
     "Clear skies throughout the morning. Light breeze expected this afternoon." */
  summary(c, data, hourIndex) {
    const w = WeatherCodes.describe(c.weather_code, c.is_day === 1);
    const phrases = {
      sun: "Clear skies",
      moon: "Clear skies",
      "partly-day": "Sun and clouds mixing",
      "partly-night": "Clouds drifting through",
      cloud: "Grey, overcast skies",
      "cloud-night": "Overcast skies",
      fog: "Low visibility with fog",
      drizzle: "Light drizzle moving through",
      rain: "Rain moving through",
      showers: "Passing showers",
      "rain-heavy": "Heavy rain falling",
      snow: "Snow moving through",
      "snow-heavy": "Heavy snow falling",
      thunder: "Stormy skies overhead",
      hail: "Hail showers expected",
      unknown: w.label,
    };

    const hour = new Date(c.time).getHours();
    const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
    const nextPart = hour < 12 ? "afternoon" : hour < 17 ? "evening" : "overnight";

    const probs = data.hourly.precipitation_probability;
    let rainLikely = false;
    if (probs) {
      for (let i = hourIndex; i < Math.min(hourIndex + 6, probs.length); i++) {
        if (probs[i] != null && probs[i] >= 60) {
          rainLikely = true;
          break;
        }
      }
    }

    const wind = Math.round(c.wind_speed_10m);
    let second;
    if (rainLikely) second = "Rain expected later today.";
    else if (wind >= 25) second = "Windy conditions expected.";
    else if (wind >= 11) second = `Light breeze expected this ${nextPart}.`;
    else second = `Calm conditions expected this ${nextPart}.`;

    return `${phrases[w.icon] || w.label} throughout the ${part}. ${second}`;
  },

  uvLabel(uv) {
    const n = Number(uv);
    if (uv == null || Number.isNaN(n)) return "--";
    const rounded = Math.round(n);
    const band =
      rounded < 3 ? "Low" : rounded < 6 ? "Moderate" : rounded < 8 ? "High" : rounded < 11 ? "Very high" : "Extreme";
    return `${rounded} ${band}`;
  },

  updateUnitLabel(unit) {
    document.getElementById("unit-btn-label").textContent = unit === "celsius" ? "°C" : "°F";
    document.getElementById("unit-btn").setAttribute(
      "aria-label",
      unit === "celsius" ? "Switch to Fahrenheit" : "Switch to Celsius"
    );
  },

  /* ---------- Hourly (today, from now) ---------- */

  renderHours(data, unit) {
    const hourly = data.hourly;
    const nowKey = data.current.time;
    const todayKey = nowKey.slice(0, 10);
    this._hours.today = this.collectHours(hourly, todayKey, nowKey, unit);
  },

  collectHours(hourly, dayKey, nowKey, unit) {
    const items = [];
    hourly.time.forEach((t, i) => {
      if (t.slice(0, 10) !== dayKey) return;
      if (nowKey && t < nowKey) return;
      const w = WeatherCodes.describe(hourly.weather_code[i], true);
      items.push({
        time: t,
        label: new Date(t).toLocaleTimeString([], { hour: "numeric" }),
        icon: w.icon,
        temp: `${this.temp(hourly.temperature_2m[i], unit)}°`,
      });
    });
    return items;
  },
  renderHourPanel() {
    const list = document.getElementById("hourly-list");
    const all = this._hours.today || [];
    const items = this._hoursExpanded ? all : all.slice(0, 6);

    list.innerHTML = "";
    list.classList.toggle("is-expanded", Boolean(this._hoursExpanded && all.length > 6));
    list.scrollTop = 0;

    if (!all.length) {
      const empty = document.createElement("p");
      empty.className = "panel-empty";
      empty.textContent = "Hourly forecast is unavailable for this location.";
      list.appendChild(empty);
      return;
    }

    items.forEach((item, i) => {
      const el = document.createElement("div");
      el.className = i === 0 ? "hourly-item is-now" : "hourly-item";
      el.innerHTML = `
        <span class="h-time">${i === 0 ? "Now" : item.label}</span>
        <span class="h-icon">${this.icon(item.icon)}</span>
        <span class="h-temp">${item.temp}</span>
      `;
      list.appendChild(el);
    });
  },

  toggleHours() {
    this._hoursExpanded = !this._hoursExpanded;
    const btn = document.getElementById("hours-toggle");
    btn.setAttribute("aria-expanded", String(this._hoursExpanded));
    document.getElementById("hours-toggle-label").textContent = this._hoursExpanded ? "Show less" : "Details";
    this.renderHourPanel();
  },

  /* ---------- 6-day forecast ---------- */

  renderDaily(data, unit) {
    const list = document.getElementById("daily-list");
    const daily = data.daily;

    list.innerHTML = "";
    daily.time.slice(0, 6).forEach((dateStr, i) => {
      const w = WeatherCodes.describe(daily.weather_code[i]);
      const d = new Date(dateStr);
      const isToday = i === 0;
      const min = daily.temperature_2m_min[i];
      const max = daily.temperature_2m_max[i];
      const precip = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null;

      const item = document.createElement("div");
      item.className = isToday ? "daily-item is-today" : "daily-item";
      item.innerHTML = `
        <div class="daily-top">
          <div>
            <span class="daily-day">${isToday ? "Today" : d.toLocaleDateString([], { weekday: "short" })}</span>
            <span class="daily-date">${d.toLocaleDateString([], { day: "numeric", month: "short" })}</span>
          </div>
          <span class="daily-icon" title="${w.label}">${this.icon(w.icon)}</span>
        </div>
        <div class="daily-bot">
          <span class="daily-temps"><span class="daily-high">${this.temp(max, unit)}°</span><span class="daily-low">${this.temp(min, unit)}°</span></span>
          <span class="daily-precip">${precip != null ? `${this.icon("droplet")}${precip}%` : ""}</span>
        </div>
      `;
      list.appendChild(item);
    });
  },

  /* ---------- Loading states ---------- */

  showSkeleton() {
    ["current", "forecast", "daily"].forEach((id) => {
      const sec = document.getElementById(id);
      if (!sec.querySelector(".card-skeleton")) {
        const sk = document.createElement("div");
        sk.className = "card-skeleton";
        sk.setAttribute("aria-hidden", "true");
        sk.innerHTML = '<div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div>';
        sec.appendChild(sk);
      }
      sec.classList.add("is-loading");
      if (!sec.dataset.rendered) sec.hidden = false;
    });
  },

  hideSkeleton() {
    ["current", "forecast", "daily"].forEach((id) => {
      const sec = document.getElementById(id);
      sec.classList.remove("is-loading");
      const sk = sec.querySelector(".card-skeleton");
      if (sk) sk.remove();
    });
  },

  /* ---------- Search results ---------- */

  renderResults(results) {
    this._results = results;
    const box = document.getElementById("search-results");
    box.innerHTML = "";
    document.getElementById("search-input").setAttribute("aria-expanded", "true");
    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "search-result";
      empty.textContent = "No cities found";
      box.appendChild(empty);
      box.hidden = false;
      return;
    }
    results.forEach((r, i) => {
      const el = document.createElement("div");
      el.className = "search-result";
      el.dataset.index = i;
      el.setAttribute("role", "option");
      el.id = `search-option-${i}`;
      const admin = r.admin && r.admin !== r.name ? `, ${r.admin}` : "";
      el.innerHTML = `${r.name}<span class="result-dim">${admin}${r.country ? `, ${r.country}` : ""}</span>`;
      box.appendChild(el);
    });
    box.hidden = false;
  },

  getResults() {
    return this._results;
  },

  /* ---------- Helpers ---------- */

  locationLabel(location) {
    const region = location.admin && location.admin !== location.name ? location.admin : location.country;
    return region ? `${location.name}, ${region}` : location.name;
  },

  findHourIndex(times, currentTime) {
    for (let i = 0; i < times.length; i++) {
      if (times[i] === currentTime) return i;
      if (times[i] > currentTime) return Math.max(0, i - 1);
    }
    return 0;
  },

  timeOnly(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  },

  /* "Monday, June 16" — the intro date in the design */
  mediumDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  },

  /* "2h 18m ago" / "10h 09m left" for the sunrise / sunset tiles */
  relativeTime(iso, nowIso) {
    const diff = new Date(iso) - new Date(nowIso);
    const past = diff <= 0;
    const mins = Math.max(1, Math.round(Math.abs(diff) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const span = h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
    return past ? `${span} ago` : `${span} left`;
  },

  temp(celsius, unit) {
    if (unit === "fahrenheit") {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  },

  applyTheme(code, isDay) {
    const app = document.getElementById("app");
    if (!isDay) {
      app.dataset.theme = "night";
      return;
    }
    let theme = "day";
    if (code === 0 || code === 1) theme = "clear";
    else if (code === 2 || code === 3) theme = "cloudy";
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code === 95) theme = "rain";
    else if ((code >= 71 && code <= 86) || code === 96 || code === 99) theme = "snow";
    app.dataset.theme = theme;
  },
};



