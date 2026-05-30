# ⛺ 캠핏 (CampFit) — 대한민국 캠핑장 날씨 & 예약

가고 싶은 캠핑장을 고르면 **실시간 날씨와 7일 예보**를 한눈에 확인하고, 바로 **예약 페이지**로 이동할 수 있는 웹사이트입니다.

![status](https://img.shields.io/badge/build-static-blueviolet) ![weather](https://img.shields.io/badge/weather-Open--Meteo-6ee7b7)

## ✨ 주요 기능

- 🗺️ **전국 인기 캠핑장 18곳** — 강원·경기·충청·전라·경상·제주
- 🌤️ **실시간 날씨** — 현재 기온·체감온도·습도·바람·일출/일몰
- 📅 **7일 주간 예보** — 일별 날씨·최고/최저 기온·강수확률
- 🔍 **검색 & 지역 필터** — 캠핑장명, 지역, 키워드(바다·계곡·숲 등)
- 🏕️ **바로 예약** — 고캠핑(한국관광공사)·네이버 검색 링크
- 💎 **트렌디한 UI** — 글래스모피즘 · 오로라 그라데이션 · 부드러운 애니메이션

## 🚀 실행 방법

별도 빌드 과정 없는 순수 정적 웹사이트입니다.

```bash
# 방법 1) 그냥 index.html 더블클릭
open index.html

# 방법 2) 로컬 서버 (권장)
python3 -m http.server 8000
# → http://localhost:8000 접속
```

> 날씨 데이터는 사용자의 브라우저에서 [Open-Meteo](https://open-meteo.com/) 무료 API(키 불필요)를 직접 호출합니다.

## 🧱 기술 스택

- **순수 HTML / CSS / JavaScript** (프레임워크·빌드 도구 없음)
- **날씨 API**: [Open-Meteo](https://open-meteo.com/) — 무료, API 키 불필요
- **예약**: [고캠핑](https://www.gocamping.or.kr/) (한국관광공사)

## 📁 구조

```
campWeather/
├── index.html   # 마크업
├── styles.css   # 디자인 (글래스모피즘 테마)
├── app.js       # 날씨 조회 · 필터 · 모달 로직
├── data.js      # 캠핑장 데이터 (좌표 · 예약 링크)
└── README.md
```

## ➕ 캠핑장 추가하기

`data.js`의 `CAMPGROUNDS` 배열에 항목을 추가하면 됩니다.

```js
{
  name: "캠핑장 이름",
  region: "강원",
  tags: ["바다", "가족"],
  desc: "한 줄 소개",
  coords: [37.80, 128.90], // [위도, 경도]
  booking: "https://...",   // 예약 링크
  emoji: "🌊",
}
```

---
즐거운 캠핑 되세요! 🏕️
