/* AZOUMAG Planner — Weekly Planner: per ISO-week focus + 7 day columns + reflection */
(function () {
  'use strict';

  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

  function isoWeekKey(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
    return t.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
  }

  function parseWeekKey(key) {
    const m = /^(\d{4})-W(\d{1,2})$/.exec(key);
    if (!m) return null;
    return { year: parseInt(m[1], 10), week: parseInt(m[2], 10) };
  }

  function mondayOfIsoWeek(year, week) {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = jan4.getUTCDay() || 7;
    const monday = new Date(Date.UTC(year, 0, 4));
    monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
    return monday;
  }

  function shiftWeek(key, delta) {
    const p = parseWeekKey(key);
    if (!p) return isoWeekKey(new Date());
    const mon = mondayOfIsoWeek(p.year, p.week);
    mon.setUTCDate(mon.getUTCDate() + delta * 7);
    return isoWeekKey(new Date(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate()));
  }

  function weekRangeLabel(key) {
    const p = parseWeekKey(key);
    if (!p) return '';
    const mon = mondayOfIsoWeek(p.year, p.week);
    const sun = new Date(mon);
    sun.setUTCDate(mon.getUTCDate() + 6);
    const fmt = (d) => d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    return fmt(new Date(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate())) + ' → ' +
           fmt(new Date(sun.getUTCFullYear(), sun.getUTCMonth(), sun.getUTCDate()));
  }

  function fireChange() {
    document.dispatchEvent(new CustomEvent('az-data-changed'));
  }

  const AZWeekly = {
    currentKey: null,

    load(key) {
      this.currentKey = key;
      const all = AZStorage.getWeekly();
      const rec = all[key] || { focus: '', mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '', reflection: '' };
      const focus = document.getElementById('az-weekly-focus');
      const refl = document.getElementById('az-weekly-reflection');
      const rangeEl = document.getElementById('az-weekly-range');
      const label = document.getElementById('az-weekly-label');
      const saved = document.getElementById('az-weekly-saved');
      if (focus) focus.value = rec.focus || '';
      if (refl) refl.value = rec.reflection || '';
      if (rangeEl) rangeEl.textContent = weekRangeLabel(key);
      if (label) label.textContent = key;
      if (saved) saved.textContent = '';
      DAYS.forEach(d => {
        const ta = document.getElementById('az-weekly-day-' + d);
        if (ta) ta.value = rec[d] || '';
      });
    },

    save() {
      if (!this.currentKey) return;
      const all = AZStorage.getWeekly();
      const rec = {
        focus: (document.getElementById('az-weekly-focus').value || ''),
        reflection: (document.getElementById('az-weekly-reflection').value || ''),
      };
      DAYS.forEach(d => {
        const ta = document.getElementById('az-weekly-day-' + d);
        rec[d] = ta ? ta.value || '' : '';
      });
      all[this.currentKey] = rec;
      AZStorage.saveWeekly(all);
      const saved = document.getElementById('az-weekly-saved');
      if (saved) saved.textContent = 'Saved · ' + new Date().toLocaleTimeString();
      fireChange();
    },

    init() {
      const prev = document.getElementById('az-weekly-prev');
      const next = document.getElementById('az-weekly-next');
      const today = document.getElementById('az-weekly-today');
      const btnSave = document.getElementById('az-weekly-save');
      if (!btnSave) return;

      this.load(isoWeekKey(new Date()));

      if (prev) prev.addEventListener('click', () => this.load(shiftWeek(this.currentKey, -1)));
      if (next) next.addEventListener('click', () => this.load(shiftWeek(this.currentKey, 1)));
      if (today) today.addEventListener('click', () => this.load(isoWeekKey(new Date())));
      btnSave.addEventListener('click', () => this.save());
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZWeekly.init());
  window.AZWeekly = AZWeekly;
  window.AZWeeklyLabels = DAY_LABELS;
})();
