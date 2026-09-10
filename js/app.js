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
      const chosenTheme = setTheme ? setTheme.value : s.theme;
      if (window.AZThemes && AZThemes.isLocked(chosenTheme)) {
        flashErr('That theme is Pro — activate a key to unlock it');
        setTheme.value = s.theme || 'base';
        return;
      }
      s.theme = chosenTheme;
      AZStorage.saveSettings(s);
      hydrateSettings();
      flashOk('Settings saved');
    });
  }

  // ------- Theme swap (delegates to AZThemes) -------
  function applyTheme(name) {
    if (window.AZThemes) AZThemes.apply(name || 'base');
  }

  // Populate the theme <select> with all registered themes
  if (setTheme && window.AZThemes) AZThemes.hydrateSelect(setTheme);

  // ------- Product presets -------
  const presetSelect = $('#az-preset-select');
  const presetApply = $('#az-preset-apply');
  if (presetSelect && window.AZPresets) AZPresets.hydrateSelect(presetSelect);
  if (presetApply) {
    presetApply.addEventListener('click', () => {
      const id = presetSelect ? presetSelect.value : '';
      if (!id) { flashErr('Pick a preset first'); return; }
      const mode = confirm('Merge preset into current data?\nOK = merge · Cancel = replace all planner data')
        ? 'merge' : 'replace';
      if (mode === 'replace' && !confirm('Really replace all goals, habits and this month\'s plan?')) return;
      const res = AZPresets.apply(id, mode);
      if (res.ok) {
        hydrateSettings();
        flashOk(`Preset applied · ${res.applied.goals} goals · ${res.applied.habits} habits`);
      } else {
        flashErr(res.error || 'Preset failed');
      }
    });
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

  // ------- License -------
  const licStatus = $('#az-license-status');
  const licInput = $('#az-license-input');
  const licActivateBtn = $('#az-license-activate');
  const licActivateRow = $('#az-license-activate-row');
  const licDeactivateRow = $('#az-license-deactivate-row');
  const licDeactivateBtn = $('#az-license-deactivate');

  function hydrateLicense() {
    if (!window.AZLicense) return;
    const rec = AZLicense.getRecord();
    const pro = AZLicense.isPro();
    if (licStatus) {
      if (pro && rec) {
        const when = new Date(rec.activatedAt).toLocaleDateString();
        licStatus.textContent = `Status: Pro · activated ${when} · key ends ${rec.key.slice(-8)}`;
      } else {
        licStatus.textContent = 'Status: Free';
      }
    }
    if (licActivateRow)   licActivateRow.hidden   = pro;
    if (licDeactivateRow) licDeactivateRow.hidden = !pro;

    // If the stored theme is now Pro-locked, fall back to base cleanly
    if (window.AZThemes && window.AZStorage) {
      const s = AZStorage.getSettings();
      if (AZThemes.isLocked(s.theme)) {
        s.theme = 'base';
        AZStorage.saveSettings(s);
        AZThemes.apply('base');
        if (setTheme) setTheme.value = 'base';
      }
    }

    if (setTheme && window.AZThemes) {
      const cur = setTheme.value;
      AZThemes.hydrateSelect(setTheme);
      if (cur) setTheme.value = cur;
    }
    if (presetSelect && window.AZPresets) AZPresets.hydrateSelect(presetSelect);
  }

  if (licActivateBtn) {
    licActivateBtn.addEventListener('click', async () => {
      const key = licInput ? licInput.value.trim() : '';
      if (!key) { flashErr('Paste a license key first'); return; }
      licActivateBtn.disabled = true;
      const res = await AZLicense.activate(key);
      licActivateBtn.disabled = false;
      if (res.ok) {
        if (licInput) licInput.value = '';
        flashOk('Pro unlocked · thanks for supporting AZOUMAG');
      } else {
        flashErr(res.error || 'Activation failed');
      }
    });
  }

  if (licDeactivateBtn) {
    licDeactivateBtn.addEventListener('click', () => {
      if (!confirm('Deactivate Pro on this device?')) return;
      AZLicense.deactivate();
      flashOk('License deactivated');
    });
  }

  document.addEventListener('az-license-changed', hydrateLicense);

  if (window.AZLicense) AZLicense.revalidate().then(hydrateLicense);

  // ------- Version tag -------
  const versionEl = $('#az-version');
  if (versionEl && window.AZ_PLANNER_VERSION) versionEl.textContent = 'v' + window.AZ_PLANNER_VERSION;

  // ------- Init -------
  hydrateSettings();
  hydrateBackupInfo();
  hydrateLicense();
})();
