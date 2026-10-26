const WeatherAPI = {
  GEO_URL: "https://geocoding-api.open-meteo.com/v1/search",
  FORECAST_URL: "https://api.open-meteo.com/v1/forecast",

  async searchCity(query) {
    const url = `${this.GEO_URL}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return (data.results || []).map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      admin: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }));
  },

  async getForecast(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current:
        "temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m",
      hourly: "temperature_2m,precipitation_probability,weather_code,uv_index",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
      timezone: "auto",
      forecast_days: "10",
    });
    const res = await fetch(`${this.FORECAST_URL}?${params}`);
    if (!res.ok) throw new Error("Forecast fetch failed");
    return res.json();
  },
};

const WeatherCodes = {
  0: { label: "Sunny", icon: "sun" },
  1: { label: "Mostly sunny", icon: "sun" },
  2: { label: "Partly cloudy", icon: "partly-day" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "fog" },
  48: { label: "Rime fog", icon: "fog" },
  51: { label: "Light drizzle", icon: "drizzle" },
  53: { label: "Drizzle", icon: "drizzle" },
  55: { label: "Dense drizzle", icon: "drizzle" },
  56: { label: "Freezing drizzle", icon: "drizzle" },
  57: { label: "Freezing drizzle", icon: "drizzle" },
  61: { label: "Light rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy rain", icon: "rain-heavy" },
  66: { label: "Freezing rain", icon: "rain" },
  67: { label: "Freezing rain", icon: "rain-heavy" },
  71: { label: "Light snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Heavy snow", icon: "snow-heavy" },
  77: { label: "Snow grains", icon: "snow" },
  80: { label: "Light showers", icon: "showers" },
  81: { label: "Showers", icon: "rain" },
  82: { label: "Violent showers", icon: "thunder" },
  85: { label: "Snow showers", icon: "snow" },
  86: { label: "Snow showers", icon: "snow-heavy" },
  95: { label: "Thunderstorm", icon: "thunder" },
  96: { label: "Thunderstorm with hail", icon: "thunder" },
  99: { label: "Thunderstorm with hail", icon: "hail" },
};

WeatherCodes.describe = function (code, isDay = true) {
  const w = this[code] || { label: "Unknown", icon: "unknown" };
  let icon = w.icon;
  let label = w.label;
  if (!isDay) {
    if (icon === "sun") {
      icon = "moon";
      label = code === 0 ? "Clear night" : "Mostly clear";
    } else if (icon === "partly-day") {
      icon = "partly-night";
      label = "Partly cloudy";
    } else if (icon === "cloud") {
      icon = "cloud-night";
    }
  }
  return { label, icon };
};
