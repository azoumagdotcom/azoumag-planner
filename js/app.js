/* AZOUMAG Planner — App wiring (tabs, settings, backup, reset) */
(function () {
  'use strict';

  const root = document.getElementById('az-planner');
  if (!root) return;

  const $ = (sel, ctx) => (ctx || root).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || root).querySelectorAll(sel));

  // ------- Toast -------
  const toastEl = $('#az-toast');
  let toastTimer = null;
  function flash(message, kind) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.toggle('az-toast-error', kind === 'error');
    toastEl.classList.add('az-toast-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('az-toast-show'), 2600);
  }
  const flashOk = (m) => flash(m, 'ok');
  const flashErr = (m) => flash(m, 'error');

  // ------- Tabs -------
  function switchTab(name) {
    $$('.az-tab').forEach(t => {
      const active = t.dataset.tab === name;
      t.classList.toggle('az-tab-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('.az-view').forEach(v => {
      const active = v.id === `az-view-${name}`;
      v.classList.toggle('az-view-active', active);
      if (active) v.removeAttribute('hidden');
      else v.setAttribute('hidden', '');
    });
    try { localStorage.setItem('az_planner_current_tab', name); } catch (e) {}
    document.dispatchEvent(new CustomEvent('az-view-shown', { detail: { name } }));
  }
  $$('.az-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Restore last tab
  try {
    const last = localStorage.getItem('az_planner_current_tab');
    if (last && $(`#az-view-${last}`)) switchTab(last);
  } catch (e) {}

  // ------- Today date -------
  const todayEl = $('#az-today');
  if (todayEl) {
    const d = new Date();
    todayEl.textContent = d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ------- Settings -------
  const settingsForm = $('#az-settings-form');
  const shopNameEl = $('#az-shop-name');
  const setShop = $('#az-set-shop');
  const setYear = $('#az-set-year');
  const setTheme = $('#az-set-theme');

  function hydrateSettings() {
    const s = AZStorage.getSettings();
    if (setShop) setShop.value = s.plannerName || '';
    if (setYear) setYear.value = s.year || new Date().getFullYear();
    if (setTheme) setTheme.value = s.theme || 'base';
    if (shopNameEl) shopNameEl.textContent = s.plannerName || 'Your Planner';
    applyTheme(s.theme || 'base');
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = AZStorage.getSettings();
      s.plannerName = setShop ? setShop.value.trim() || 'Your Planner' : s.plannerName;
      s.year = setYear ? parseInt(setYear.value, 10) || s.year : s.year;
      s.theme = setTheme ? setTheme.value : s.theme;
      AZStorage.saveSettings(s);
      hydrateSettings();
      flashOk('Settings saved');
    });
  }

  // ------- Theme swap (base / focus-reset) -------
  function applyTheme(name) {
    // Base theme = default CSS vars. Focus-reset overrides via inline vars.
    if (name === 'focus-reset') {
      root.style.setProperty('--az-orange', '#D9845B');
      root.style.setProperty('--az-orange-soft', '#e39c78');
      root.style.setProperty('--az-navy', '#2F4F4A');
      root.style.setProperty('--az-navy-deep', '#203834');
      root.style.setProperty('--az-navy-light', '#A6BFB7');
      root.style.setProperty('--az-offwhite', '#FFFDF9');
    } else {
      root.style.removeProperty('--az-orange');
      root.style.removeProperty('--az-orange-soft');
      root.style.removeProperty('--az-navy');
      root.style.removeProperty('--az-navy-deep');
      root.style.removeProperty('--az-navy-light');
      root.style.removeProperty('--az-offwhite');
    }
  }

  // ------- Backup / Restore -------
  const backupInfo = $('#az-backup-info');
  function hydrateBackupInfo() {
    if (!backupInfo) return;
    const meta = AZStorage.getMeta();
    if (meta.lastBackupAt) {
      const d = new Date(meta.lastBackupAt);
      backupInfo.textContent = 'Last backup: ' + d.toLocaleString();
    } else {
      backupInfo.textContent = 'Last backup: never';
    }
  }

  const btnExport = $('#az-backup-export');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      try {
        const payload = AZStorage.exportAll();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = AZStorage.buildBackupFilename();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        AZStorage.markBackupDone();
        hydrateBackupInfo();
        flashOk('Backup downloaded');
      } catch (e) {
        flashErr('Backup failed');
      }
    });
  }

  const fileInput = $('#az-backup-file');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result);
          if (!confirm('Restore this backup? It will replace your current planner data.')) {
            fileInput.value = '';
            return;
          }
          const res = AZStorage.importAll(payload, 'replace');
          if (res.ok) {
            hydrateSettings();
            hydrateBackupInfo();
            flashOk('Backup restored');
          } else {
            flashErr(res.error || 'Restore failed');
          }
        } catch (err) {
          flashErr('Invalid JSON file');
        }
        fileInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  // ------- Reset -------
  const btnReset = $('#az-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (!confirm('Reset ALL planner data? This cannot be undone.')) return;
      if (!confirm('Really reset? Consider downloading a backup first.')) return;
      AZStorage.resetAll();
      hydrateSettings();
      hydrateBackupInfo();
      flashOk('All data reset');
    });
  }

  // ------- Version tag -------
  const versionEl = $('#az-version');
  if (versionEl && window.AZ_PLANNER_VERSION) versionEl.textContent = 'v' + window.AZ_PLANNER_VERSION;

  // ------- Init -------
  hydrateSettings();
  hydrateBackupInfo();
})();
