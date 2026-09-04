# Weather Vue

An offline-first weather app: current conditions, hourly/7-day forecasts, saved
locations with drag-to-reorder, a simulated radar/map view, severe weather
alerts, °C/°F units, dark mode, and a PWA offline fallback — built with Vue 3
(`<script setup>`, TypeScript), Pinia, Vue Router 4, Tailwind CSS, VueUse, and
`idb`.

## Architecture

```
src/
  components/
    alerts/      AlertsBanner — dismissible severity-styled alert cards
    layout/      Sidebar (desktop) + BottomNav (mobile) navigation shells
    locations/   LocationSearch, CurrentLocationCard, LocationsList (drag-reorder)
    map/         RadarMap — Leaflet + OpenStreetMap radar view
    shared/      DarkModeToggle, UnitToggle, OfflineBanner
    weather/     CurrentConditionsCard, WeatherScene, WeatherIcon,
                 HourlyForecastRow, DailyForecastList, CompactWeatherCard
  composables/   useCurrentLocation (geolocation), useWeatherVisuals (condition→theme)
  data/          seed.ts — first-run mock data population
  services/      db.ts (IndexedDB via idb), weatherService.ts (mock weather API)
  stores/        useLocationsStore, useSettingsStore, useUiStore (Pinia setup stores)
  types/         weather.ts — shared domain types
  views/         ForecastView, RadarView, LocationsView, SettingsView
  router/        route table
  App.vue        responsive shell (sidebar+content on desktop, bottom nav on mobile)
```

Routes: `/` and `/location/:id` (`forecast` / `forecast-location`) show the
detail view with an optional saved-locations rail on desktop and swipeable
cards on mobile; `/map` (`map`) is the radar view; `/locations` (`locations`)
is the full saved-locations manager; `/settings` (`settings`) holds units,
theme, and data controls.

## Mock weather service

`src/services/weatherService.ts` mimics a real weather API's async, versioned
response shape (`ForecastBundle` = current + 48h hourly + 7-day daily +
alerts) without calling out to the network. Every value is derived from a
**deterministic PRNG** seeded from `(lat, lon, date[, hour])`, so:

- The same location always produces the same forecast for a given day —
  refreshing doesn't make numbers jump around.
- A simple latitude/day-of-year climate model (`baselineTemperature`) gives
  each location a plausible seasonal cycle (Reykjavik cold, Dubai hot,
  Southern Hemisphere seasons inverted), and a diurnal offset makes
  afternoons warmer than early mornings.
- Conditions are weighted-random from a condition library, biased by
  temperature (no snow above 4°C, no thunderstorms below 8°C) and a humidity
  factor, so the mix of clear/rainy/stormy days looks organic rather than
  uniform.
- `buildAlerts` derives severe weather alerts (thunderstorm/winter
  storm/high wind/UV) from the generated forecast itself, so alerts always
  correlate with the conditions shown.
- A small built-in gazetteer (`GAZETTEER`) backs the mock geocoder
  (`geocodeLocation`) used for city search and for labeling the device's
  geolocation coordinates with the nearest known city name.

Because `fetchForecast`/`geocodeLocation` are `async` and return the same
shapes a real integration would, swapping in a live API later only touches
this one file.

## IndexedDB caching

`src/services/db.ts` wraps a small `idb` schema with three object stores:

- `locations` — saved locations, indexed `by-order` for the drag-to-reorder list.
- `forecasts` — one `ForecastBundle` per location, keyed by `locationId`, acting as the offline cache.
- `meta` — small flags (e.g. whether the first-run seed has run).

`useLocationsStore` (Pinia) is the only consumer: on `init()` it loads
everything from IndexedDB into reactive state, then — if `navigator.onLine` —
kicks off a background refresh. `ensureForecast(id)` serves the cached bundle
immediately and only refetches when it's missing or stale (>30 minutes old)
**and** the browser is online, so the UI never blocks on the network and
degrades gracefully offline. Every successful fetch is immediately persisted
back to `forecasts` via `putForecast`, so a location viewed once stays
available offline afterwards. `src/data/seed.ts` populates a handful of real
cities on first launch so the app is never empty before search/geolocation
have run.

## PWA / offline strategy

`vite-plugin-pwa` (configured in `vite.config.ts`) generates a service worker
(`generateSW` strategy, `autoUpdate`) that precaches the built app shell and
serves `public/offline.html` as the `navigateFallback` for any navigation
that can't be served from cache or network (API-style paths are excluded via
`navigateFallbackDenylist`). Registration is done manually in `src/main.ts`
via the `virtual:pwa-register` module, wrapped in a try/catch so the app still
runs fine in dev or in a context without the plugin's virtual module.

Combined with the IndexedDB forecast cache, this gives two layers of offline
support: the service worker keeps the **app shell** loadable with no network,
and IndexedDB keeps **data** (saved locations + their last-fetched forecasts)
available so a previously visited location still shows real weather while
offline. `OfflineBanner` (via VueUse's `useOnline`) surfaces the current
connectivity state so the offline experience is never silent.

## Responsive layout

`App.vue` picks the shell based on a `useMediaQuery('(min-width: 1024px)')`
breakpoint: a persistent `Sidebar` on desktop (list-plus-detail, navigation,
unit/theme controls) versus a `BottomNav` tab bar on mobile. `ForecastView`
follows the same split — a saved-locations rail alongside the detail panel on
desktop, and a single swipeable card (via VueUse's `useSwipe`) with position
dots on mobile. `CompactWeatherCard` provides the widget-style summary tile
used in both the desktop rail and the mobile locations list.

## Theming

Dark mode and all component colors are driven by CSS variables in
`src/style.css` (HSL tokens mapped through `tailwind.config.ts`, toggled via
the `.dark` class). `useSettingsStore` tracks a `system` / `light` / `dark`
preference (defaulting to the OS preference via VueUse's `usePreferredDark`)
and applies the `dark` class to `<html>` reactively.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build     # type-check (vue-tsc) + production build
npm run preview   # preview the production build
```
