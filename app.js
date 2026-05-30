"use strict";

// ── WMO 날씨 코드 → 이모지/설명 매핑 ──────────────────────────
const WX = {
  0:  { e: "☀️", t: "맑음" },
  1:  { e: "🌤️", t: "대체로 맑음" },
  2:  { e: "⛅", t: "구름 조금" },
  3:  { e: "☁️", t: "흐림" },
  45: { e: "🌫️", t: "안개" },
  48: { e: "🌫️", t: "서리 안개" },
  51: { e: "🌦️", t: "약한 이슬비" },
  53: { e: "🌦️", t: "이슬비" },
  55: { e: "🌧️", t: "짙은 이슬비" },
  56: { e: "🌧️", t: "어는 이슬비" },
  57: { e: "🌧️", t: "어는 이슬비" },
  61: { e: "🌦️", t: "약한 비" },
  63: { e: "🌧️", t: "비" },
  65: { e: "🌧️", t: "강한 비" },
  66: { e: "🌧️", t: "어는 비" },
  67: { e: "🌧️", t: "어는 비" },
  71: { e: "🌨️", t: "약한 눈" },
  73: { e: "🌨️", t: "눈" },
  75: { e: "❄️", t: "강한 눈" },
  77: { e: "❄️", t: "싸락눈" },
  80: { e: "🌦️", t: "소나기" },
  81: { e: "🌧️", t: "소나기" },
  82: { e: "⛈️", t: "강한 소나기" },
  85: { e: "🌨️", t: "소낙눈" },
  86: { e: "❄️", t: "강한 소낙눈" },
  95: { e: "⛈️", t: "천둥번개" },
  96: { e: "⛈️", t: "천둥번개·우박" },
  99: { e: "⛈️", t: "천둥번개·우박" },
};
const wx = (code) => WX[code] || { e: "🌡️", t: "정보 없음" };

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

// ── 상태 ──────────────────────────────────────────────────────
let activeRegion = "전체";
let searchTerm = "";
const weatherCache = new Map(); // key: "lat,lon" → forecast data

// ── DOM ───────────────────────────────────────────────────────
const grid = document.getElementById("campgroundGrid");
const chipsEl = document.getElementById("regionChips");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("weatherModal");
const modalBody = document.getElementById("modalBody");

// ── 지역 칩 빌드 ───────────────────────────────────────────────
function buildChips() {
  const regions = ["전체", ...new Set(CAMPGROUNDS.map((c) => c.region))];
  chipsEl.innerHTML = "";
  regions.forEach((r) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (r === activeRegion ? " active" : "");
    chip.textContent = r;
    chip.addEventListener("click", () => {
      activeRegion = r;
      buildChips();
      render();
    });
    chipsEl.appendChild(chip);
  });
}

// ── 필터 ──────────────────────────────────────────────────────
function filtered() {
  const q = searchTerm.trim().toLowerCase();
  return CAMPGROUNDS.filter((c) => {
    const regionOk = activeRegion === "전체" || c.region === activeRegion;
    if (!regionOk) return false;
    if (!q) return true;
    const hay = [c.name, c.region, c.desc, ...c.tags].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

// ── 카드 렌더 ──────────────────────────────────────────────────
function render() {
  const list = filtered();
  grid.innerHTML = "";
  emptyState.hidden = list.length > 0;
  resultCount.textContent = `${list.length}곳`;

  list.forEach((c, i) => {
    const card = document.createElement("article");
    card.className = "card";
    card.style.animationDelay = `${Math.min(i * 0.04, 0.4)}s`;
    card.innerHTML = `
      <div class="card__top">
        <span class="card__emoji">${c.emoji}</span>
        <span class="card__region">${c.region}</span>
      </div>
      <h3 class="card__name">${c.name}</h3>
      ${c.address ? `<p class="card__addr">📍 ${c.address}</p>` : ""}
      <p class="card__desc">${c.desc}</p>
      <div class="card__tags">${c.tags.map((t) => `<span class="tag">#${t}</span>`).join("")}</div>
      <div class="card__weather"><span class="wx-loading">날씨 불러오는 중…</span></div>
      <div class="card__cta">
        <button class="btn btn--primary" data-detail>7일 예보 보기</button>
        <a class="btn" href="${c.booking}" target="_blank" rel="noopener">예약하기</a>
      </div>
    `;
    card.querySelector("[data-detail]").addEventListener("click", () => openModal(c));
    // 카드 빈 영역 클릭 시에도 모달
    card.addEventListener("click", (e) => {
      if (e.target.closest("a") || e.target.closest("[data-detail]")) return;
      openModal(c);
    });
    grid.appendChild(card);

    loadMiniWeather(c, card.querySelector(".card__weather"));
  });
}

// ── 카드 미니 날씨 ─────────────────────────────────────────────
async function loadMiniWeather(c, el) {
  try {
    const data = await getForecast(c.coords);
    const cur = data.current;
    const info = wx(cur.weather_code);
    const today = data.daily;
    el.innerHTML = `
      <span class="wx-emoji">${info.e}</span>
      <div>
        <div class="wx-temp">${Math.round(cur.temperature_2m)}°</div>
        <div class="wx-desc">${info.t}</div>
      </div>
      <div class="wx-range">
        <div>최고 <b>${Math.round(today.temperature_2m_max[0])}°</b></div>
        <div>최저 ${Math.round(today.temperature_2m_min[0])}°</div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<span class="wx-loading">날씨 정보를 불러올 수 없어요 😢</span>`;
  }
}

// ── Open-Meteo 호출 (캐시) ─────────────────────────────────────
async function getForecast([lat, lon]) {
  const key = `${lat},${lon}`;
  if (weatherCache.has(key)) return weatherCache.get(key);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
    `&timezone=Asia%2FSeoul&forecast_days=7`;

  const promise = fetch(url).then((r) => {
    if (!r.ok) throw new Error("weather fetch failed");
    return r.json();
  });
  weatherCache.set(key, promise);
  try {
    const data = await promise;
    weatherCache.set(key, data); // resolve된 데이터로 교체
    return data;
  } catch (e) {
    weatherCache.delete(key);
    throw e;
  }
}

// ── 모달 ──────────────────────────────────────────────────────
async function openModal(c) {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  modalBody.innerHTML = `
    <div class="m-head">
      <span class="m-emoji">${c.emoji}</span>
      <div>
        <h2 class="m-title">${c.name}</h2>
        <span class="m-region">📍 ${c.address || c.region}</span>
      </div>
    </div>
    <p class="m-desc">${c.desc}</p>
    <div class="m-now skeleton" style="height:120px;border:none"></div>
    <p class="m-section-title">주간 예보</p>
    <div class="forecast">${'<div class="fc-day skeleton" style="height:120px;border:none"></div>'.repeat(7)}</div>
  `;

  try {
    const data = await getForecast(c.coords);
    renderModalWeather(c, data);
  } catch (err) {
    modalBody.querySelector(".m-now").outerHTML =
      `<div class="m-error">⚠️ 날씨 정보를 불러오지 못했어요.<br/>인터넷 연결을 확인하고 다시 시도해 주세요.</div>`;
    modalBody.querySelector(".forecast").remove();
    modalBody.querySelector(".m-section-title").remove();
    appendCta(c);
  }
}

function renderModalWeather(c, data) {
  const cur = data.current;
  const d = data.daily;
  const info = wx(cur.weather_code);
  const sunrise = new Date(d.sunrise[0]).toTimeString().slice(0, 5);
  const sunset = new Date(d.sunset[0]).toTimeString().slice(0, 5);

  const days = d.time
    .map((iso, i) => {
      const date = new Date(iso);
      const dow = date.getDay();
      const di = wx(d.weather_code[i]);
      const label = i === 0 ? "오늘" : `${date.getMonth() + 1}.${date.getDate()}`;
      const weekendCls = dow === 0 || dow === 6 ? " weekend" : "";
      return `
        <div class="fc-day">
          <div class="d${weekendCls}">${label}<br/>(${DOW[dow]})</div>
          <div class="e">${di.e}</div>
          <div class="hi">${Math.round(d.temperature_2m_max[i])}°</div>
          <div class="lo">${Math.round(d.temperature_2m_min[i])}°</div>
          <div class="rain">💧${d.precipitation_probability_max[i] ?? 0}%</div>
        </div>`;
    })
    .join("");

  modalBody.innerHTML = `
    <div class="m-head">
      <span class="m-emoji">${c.emoji}</span>
      <div>
        <h2 class="m-title">${c.name}</h2>
        <span class="m-region">📍 ${c.address || c.region}</span>
      </div>
    </div>
    <p class="m-desc">${c.desc}</p>

    <div class="m-now">
      <span class="m-now__emoji">${info.e}</span>
      <div>
        <div class="m-now__temp">${Math.round(cur.temperature_2m)}°</div>
        <div class="m-now__desc">${info.t} · 체감 ${Math.round(cur.apparent_temperature)}°</div>
      </div>
      <div class="m-now__meta">
        <span>💧 습도 <b>${cur.relative_humidity_2m}%</b></span>
        <span>🌬️ 바람 <b>${Math.round(cur.wind_speed_10m)}km/h</b></span>
        <span>🌅 ${sunrise} · 🌇 ${sunset}</span>
      </div>
    </div>

    <p class="m-section-title">주간 예보 (7일)</p>
    <div class="forecast">${days}</div>
  `;
  appendCta(c);
}

function appendCta(c) {
  const cta = document.createElement("div");
  cta.className = "m-cta";
  const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(c.name + " 캠핑장 예약")}`;
  cta.innerHTML = `
    <a class="btn btn--primary" href="${c.booking}" target="_blank" rel="noopener">🏕️ 예약 / 정보 보기</a>
    <a class="btn" href="${naverUrl}" target="_blank" rel="noopener">🔎 네이버 검색</a>
  `;
  modalBody.appendChild(cta);
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

// ── 이벤트 ────────────────────────────────────────────────────
modal.addEventListener("click", (e) => {
  if (e.target.hasAttribute("data-close")) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

let debounce;
searchInput.addEventListener("input", (e) => {
  clearTimeout(debounce);
  searchTerm = e.target.value;
  debounce = setTimeout(render, 180);
});

// ── 초기화 ────────────────────────────────────────────────────
buildChips();
render();
