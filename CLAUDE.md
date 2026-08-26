# AZOUMAG Planner — CLAUDE.md

Guardrails for any AI/dev work in this repo.

## Non-negotiable rules

1. **CSS scoping.** Every selector MUST live under `#az-planner`. Never write `body {}`, `:root {}`, `.card {}` or any global selector. Reason: this app must be safely embeddable in YouCan / WordPress / Shopify pages without style bleed.

2. **Zero dependencies.** No npm, no CDN, no build step. Pure HTML + CSS + vanilla JS. If a feature can be done vanilla, it MUST be done vanilla.

3. **Offline-first.** All data lives in LocalStorage. No network calls in the free tier. Pro-tier cloud sync (Phase 6+) is optional and additive.

4. **JSON backup/restore.** Every user-editable data type must be included in `AZStorage.exportAll()` and restorable via `importAll()`. Signature `AZOUMAG PLANNER` protects against cross-app payload corruption.

5. **Canonical brand colors.** Deep Navy `#1D2240` · AZOUMAG Orange `#F37021` · Off White `#FFF4EC` · Black `#111111`. Red is reserved for warnings/errors only. Alternative palettes ship as themes swapped via CSS custom properties on `#az-planner`.

6. **Naming conventions.**
   - HTML IDs and CSS classes: `az-<component>` (e.g. `az-btn`, `az-card`, `az-view-dashboard`)
   - JS globals: `AZ<Module>` (`AZStorage`, `AZDashboard`, `AZHabits`, ...)
   - LocalStorage keys: `az_planner_<data>` (e.g. `az_planner_habits`)
   - Backup filenames: `azoumag-planner-<name>-<date>.json`

7. **License.** BSL 1.1 until 2030-08-26, then Apache 2.0. Do not add code with incompatible licenses.

## What this app is (and is not)

- **Is:** a full 10-section planner web app that replaces the old PowerShell + Excel builder pipeline. Excel is now one export format among many.
- **Is not:** a port of the Excel builder to Python. That path was abandoned in favor of the SaaS.

## Where things live

- `index.html` — SPA shell with 10 `<section>` tabs
- `css/style.css` — all styles, all scoped
- `js/storage.js` — `AZStorage` API for read/write/export/import/reset
- `js/app.js` — tab wiring, settings, backup UI, theme swap
- `js/<section>.js` — one file per section, added in Phase 2+ (e.g. `js/habits.js` exposes `AZHabits`)
- `config/brand.json` — palette + theme presets (mirrored from `../brand/azoumag-brand.json`)

## Related memory

Full project context, brand identity, and phase plan are in the persistent Claude memory system for this workspace. Check there before starting work.

## Phase status

Track via the TaskList tool. Phase 1 = scaffold (this commit). Phases 2–7 add features per the roadmap in README.md.
