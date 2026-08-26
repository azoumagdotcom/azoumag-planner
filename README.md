# AZOUMAG Planner

> The Ultimate Online Solutions — a calm, offline-first web planner.

**AZOUMAG Planner** is a browser-based planner web app. Every keystroke saves to your device via LocalStorage. Nothing leaves your browser. No accounts, no cloud, no tracking.

Built with vanilla HTML, CSS, and JavaScript — zero dependencies, zero build step.

## Features

- **Dashboard** — KPI cards, habit heat, active goals at a glance
- **Year Goals** — deadlines, progress, next actions
- **Monthly Planner** — priorities, important dates, reflection
- **Habit Tracker** — daily 1/0 logging with streak scoring
- **Weekly & Daily** — reusable planning spreads
- **Notes & Brain Dump** — loose thoughts, offload space
- **Backup / Restore** — JSON export/import, signed to prevent cross-app corruption
- **Themes** — Base (Deep Navy / AZOUMAG Orange) and Focus Reset (Sage / Terracotta)
- **Offline-first** — install as a PWA, works without internet
- **Print-friendly** — clean CSS print styles for physical use

## Tech

- Pure HTML / CSS / JS — no build, no npm, no framework
- LocalStorage for persistence
- All CSS scoped under `#az-planner` — safe to embed inside YouCan, WordPress, Shopify, or any host page
- Signed JSON schema for backup/restore integrity

## Run locally

Just open `index.html` in any modern browser. That's it.

Or serve it if you prefer:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Project structure

```
azoumag-planner/
├── index.html          SPA shell — 10 tabs
├── css/style.css       All styles scoped under #az-planner
├── js/
│   ├── storage.js      AZStorage — LocalStorage + backup/restore
│   └── app.js          Wiring — tabs, settings, backup, theme
├── config/
│   └── brand.json      Palette + theme presets
├── assets/             (icons, favicons — added in Phase 7)
├── LICENSE             Business Source License 1.1
└── README.md
```

## Roadmap

- **Phase 1** ✅ Scaffold, brand tokens, LocalStorage, backup/restore, theme switch
- **Phase 2** Full section functionality — Dashboard, Year Goals, Monthly, Habits (first 5 sections)
- **Phase 3** Weekly, Daily, Notes, Brain Dump, Lists (parity with Excel builder)
- **Phase 4** In-browser `.xlsx` export via SheetJS + PDF export
- **Phase 5** Product presets (Focus Reset) loaded as in-app modes
- **Phase 6** License-key activation for Pro tier
- **Phase 7** PWA service worker, landing page, GitHub Pages deploy

## License

**Business Source License 1.1** — source is public, non-commercial use is free, commercial redistribution requires a license from AZOUMAG. Converts to Apache 2.0 on 2030-08-26.

See [LICENSE](LICENSE) for full terms.

## About AZOUMAG

AZOUMAG is a Moroccan digital brand founded by Omar Azoumag. We build practical, offline-first software that solves real business problems.

> _Build Useful Solutions. Solve Real Problems. Create Lasting Value._
