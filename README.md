# Manga Hub

A single-page JavaScript web app that lets you **search manga** using the **Jikan API** and save favorites into **My List** using **localStorage**.

## Features
- **Search + pagination**: Search manga and move pages with Prev/Next.
- **Details panel**: Click a manga card to open a side panel with more info.
- **My List**: Save manga to your list (it stays after refresh with localStorage).
- **Status + filter**: Filter My List and click the status chip to cycle **Plan to Read → Reading → Completed**.
- **Loading UI**: Retro loading meter, skeleton cards, and disabled buttons during fetch.

## Demo (what to try)
- Search “one piece”, then click a card to see details.
- Save a manga to **My List**, then try the filter buttons.
- Click the status chip on a saved card to change the status.

## Tech stack
- **Vanilla JavaScript (ES Modules)**: `type="module"`
- **Bootstrap 5 (CDN)**: layout + offcanvas panel
- **Jikan REST API**: manga data (GET requests)
- **localStorage**: saves My List on your computer

## How to run
1. Open the folder in VS Code (recommended).
2. Run with **Live Server** (recommended) OR just open `index.html` in your browser.

## API usage (Jikan)
This app uses **GET** requests only:
- **Search manga**: `/v4/manga?q={query}&page={page}&limit={limit}`
- **Manga details**: `/v4/manga/{id}`

Notes:
- Sometimes Jikan can rate-limit or time out (like `429` or `504`). If that happens, just try again.

## App architecture (modules)
- **`js/api/jikan.mjs`**: API functions (`searchManga`, `getMangaById`).
- **`js/storage.mjs`**: localStorage helpers (`getSavedList`, `setSavedList`).
- **`js/main.mjs`**: state + events + rendering (search, pagination, details, my list).
- **`css/styles.css`**: styles (background, skeleton loader, card effects).

## Key UX decisions
- **Retro loader + skeletons**: makes the app feel active while waiting for the API.
- **Sticky header**: search stays at the top while scrolling.
- **Empty states**: the app shows messages instead of a blank area.

## Event loop / async safety
- **Debounce (300ms)**: helps avoid spamming the API.
- **Stale-response protection**: requestId check helps prevent old results from replacing new results.
- **Disable controls while loading**: prevents double-click spam during fetch.

## Known issues / limitations
- Jikan may sometimes return `429` / `5xx`; you may need to retry.
- Search results depend on what the Jikan API returns (it can include close title matches).

## Future improvements
- Recommendations (“related manga”) via Jikan recommendations endpoint (GET).
- More detailed error UI (status codes, retry button).
- Split rendering into `ui.mjs` + app state into `state.mjs` for cleaner separation.
