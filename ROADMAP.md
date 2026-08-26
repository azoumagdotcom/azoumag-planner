# AZOUMAG Planner — Roadmap

Phased delivery. Each phase produces something demoable; nothing merges to `main` half-finished.

## Phase 1 — Scaffold ✅

- [x] Project directory tree
- [x] `index.html` — 10-tab SPA shell
- [x] `css/style.css` — brand palette, glassmorphism, responsive, print styles, all scoped under `#az-planner`
- [x] `js/storage.js` — AZStorage with typed getters for all 8 data domains + backup/restore + reset
- [x] `js/app.js` — tab wiring, settings persistence, theme swap, backup UI, toast
- [x] `config/brand.json` — palette + theme presets
- [x] `LICENSE` — BSL 1.1
- [x] `README.md`, `CLAUDE.md`, `.gitignore`, `ROADMAP.md`

**Go/No-Go:** open `index.html` in a browser — all 10 tabs switch, settings save, backup downloads, restore works, reset works, theme swap works.

## Phase 2 — First 5 sections (functional)

- [ ] `js/dashboard.js` — KPI cards, habit heat, active goals derived from stored data
- [ ] `js/year-goals.js` — CRUD table, progress bars, quarter filter
- [ ] `js/monthly.js` — priorities, dates, reflection per YYYY-MM
- [ ] `js/habits.js` — habit list + daily grid, 1/0 logging, streak calc
- [ ] `js/welcome.js` — dynamic personalization from settings

**Go/No-Go:** every field is persisted; refresh the page and everything is still there. Backup roundtrip preserves all 5 sections.

## Phase 3 — Remaining 5 sections

- [ ] `js/weekly.js` — focus of the week + 7 daily columns
- [ ] `js/daily.js` — top 3, schedule, gratitude, reflection per date
- [ ] `js/notes.js` — list + editor
- [ ] `js/brain-dump.js` — quick-add + priority sort
- [ ] `js/lists.js` — reference lists (categories, statuses) surfaced across sections

**Go/No-Go:** feature parity with the Excel builder output.

## Phase 4 — Export layer

- [ ] `js/export-xlsx.js` — SheetJS-based Excel export driven by the same product JSONs (retires `build-tracker.ps1`)
- [ ] `js/export-pdf.js` — print-styled PDF export
- [ ] Polished JSON backup/restore UI (merge vs replace, diff preview)

**Go/No-Go:** downloaded `.xlsx` opens in Excel and matches the layout the PS builder used to produce.

## Phase 5 — Themes & modes

- [ ] Theme switcher UI beyond just settings (accessible from every view)
- [ ] Load `products/focus-reset-product.json` as an in-app mode preset
- [ ] Custom user themes (color pickers → save to LocalStorage)

## Phase 6 — License activation (Pro)

- [ ] `js/license.js` — key format, LocalStorage-stored token, expiry check
- [ ] Feature-gate Pro features (xlsx export, unlimited themes, cloud sync stub, AI coach)
- [ ] "Enter your license key" modal + activation flow

## Phase 7 — PWA + Launch

- [ ] `manifest.webmanifest`, `service-worker.js`, `assets/icons/`
- [ ] Landing page (marketing HTML)
- [ ] Create GitHub repo `azoumagdotcom/azoumag-planner` (public)
- [ ] Push, enable GitHub Pages
- [ ] Verify live at `https://azoumagdotcom.github.io/azoumag-planner/`
- [ ] Custom domain (deferred until Omar buys one)
