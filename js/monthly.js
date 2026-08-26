/* AZOUMAG Planner — Monthly Planner: per YYYY-MM priorities + dates + reflection */
(function () {
  'use strict';

  function currentMonthKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function shiftMonth(key, delta) {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  const AZMonthly = {
    currentKey: null,

    load(key) {
      this.currentKey = key;
      const all = AZStorage.getMonthly();
      const rec = all[key] || { priorities: [], dates: [], notes: '' };
      const p = document.getElementById('az-monthly-priorities');
      const d = document.getElementById('az-monthly-dates');
      const n = document.getElementById('az-monthly-notes');
      const picker = document.getElementById('az-monthly-picker');
      if (p) p.value = (rec.priorities || []).join('\n');
      if (d) d.value = (rec.dates || []).map(x => `${x.date} | ${x.note}`).join('\n');
      if (n) n.value = rec.notes || '';
      if (picker) picker.value = key;
      const saved = document.getElementById('az-monthly-saved');
      if (saved) saved.textContent = '';
    },

    save() {
      if (!this.currentKey) return;
      const all = AZStorage.getMonthly();
      const priorities = (document.getElementById('az-monthly-priorities').value || '')
        .split('\n').map(s => s.trim()).filter(Boolean);
      const dates = (document.getElementById('az-monthly-dates').value || '')
        .split('\n').map(s => s.trim()).filter(Boolean)
        .map(line => {
          const idx = line.indexOf('|');
          if (idx === -1) return { date: line, note: '' };
          return { date: line.slice(0, idx).trim(), note: line.slice(idx + 1).trim() };
        });
      const notes = document.getElementById('az-monthly-notes').value || '';
      all[this.currentKey] = { priorities, dates, notes };
      AZStorage.saveMonthly(all);
      const saved = document.getElementById('az-monthly-saved');
      if (saved) saved.textContent = 'Saved · ' + new Date().toLocaleTimeString();
      document.dispatchEvent(new CustomEvent('az-data-changed'));
    },

    init() {
      const picker = document.getElementById('az-monthly-picker');
      const prev = document.getElementById('az-monthly-prev');
      const next = document.getElementById('az-monthly-next');
      const btnSave = document.getElementById('az-monthly-save');
      if (!picker || !btnSave) return;

      this.load(currentMonthKey());

      picker.addEventListener('change', () => this.load(picker.value || currentMonthKey()));
      if (prev) prev.addEventListener('click', () => this.load(shiftMonth(this.currentKey, -1)));
      if (next) next.addEventListener('click', () => this.load(shiftMonth(this.currentKey, 1)));
      btnSave.addEventListener('click', () => this.save());
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZMonthly.init());
  window.AZMonthly = AZMonthly;
})();
