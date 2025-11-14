// Coordinates for Nairobi
const NAIROBI_LAT = -1.286389;
const NAIROBI_LON = 36.817223;

async function fetchWeather() {
  const box = document.getElementById('weather-box');
  box.innerHTML = "<p>Loading weather...</p>";

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${NAIROBI_LAT}&longitude=${NAIROBI_LON}&current=temperature_2m,weather_code`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Network response failed");
    const data = await res.json();

    const temp = data?.current?.temperature_2m;
    const code = data?.current?.weather_code;

    const conditions = weatherCodeToText(code);
    const now = new Date();

    box.innerHTML = `
      <h2>${temp}°C</h2>
      <p class="condition">${conditions}</p>
      <p class="updated">Updated: ${now.toLocaleString("en-KE", { hour: "numeric", minute: "2-digit", weekday: "long" })}</p>
    `;
  } catch (err) {
    box.innerHTML = `<p class="error">Failed to load weather. Check internet and try again.</p>`;
  }
}

// Minimal weather code mapping
function weatherCodeToText(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    61: "Rain",
    80: "Rain showers",
    95: "Thunderstorm"
  };
  return map[code] || "Unknown";
}

document.addEventListener("DOMContentLoaded", () => {
  fetchWeather();
  document.getElementById("refresh-btn").addEventListener("click", fetchWeather);
});
