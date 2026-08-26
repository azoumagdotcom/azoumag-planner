/* AZOUMAG Planner — Daily Planner: per YYYY-MM-DD Top-3, Schedule, Gratitude, Reflection */
(function () {
  'use strict';

  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function shiftDay(key, delta) {
    const [y, m, d] = key.split('-').map(Number);
    const t = new Date(y, m - 1, d + delta);
    return ymd(t);
  }

  function humanDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  function fireChange() {
    document.dispatchEvent(new CustomEvent('az-data-changed'));
  }

  const AZDaily = {
    currentKey: null,

    load(key) {
      this.currentKey = key;
      const all = AZStorage.getDaily();
      const rec = all[key] || { topThree: ['', '', ''], schedule: [], gratitude: '', reflection: '' };
      const t1 = document.getElementById('az-daily-top1');
      const t2 = document.getElementById('az-daily-top2');
      const t3 = document.getElementById('az-daily-top3');
      const sched = document.getElementById('az-daily-schedule');
      const grat = document.getElementById('az-daily-gratitude');
      const refl = document.getElementById('az-daily-reflection');
      const picker = document.getElementById('az-daily-picker');
      const label = document.getElementById('az-daily-label');
      const saved = document.getElementById('az-daily-saved');

      const top = rec.topThree || ['', '', ''];
      if (t1) t1.value = top[0] || '';
      if (t2) t2.value = top[1] || '';
      if (t3) t3.value = top[2] || '';
      if (sched) sched.value = (rec.schedule || []).map(x => `${x.time || ''} | ${x.task || ''}`).join('\n');
      if (grat) grat.value = rec.gratitude || '';
      if (refl) refl.value = rec.reflection || '';
      if (picker) picker.value = key;
      if (label) label.textContent = humanDate(key);
      if (saved) saved.textContent = '';
    },

    save() {
      if (!this.currentKey) return;
      const all = AZStorage.getDaily();
      const topThree = [
        (document.getElementById('az-daily-top1').value || '').trim(),
        (document.getElementById('az-daily-top2').value || '').trim(),
        (document.getElementById('az-daily-top3').value || '').trim(),
      ];
      const schedule = (document.getElementById('az-daily-schedule').value || '')
        .split('\n').map(s => s.trim()).filter(Boolean)
        .map(line => {
          const idx = line.indexOf('|');
          if (idx === -1) return { time: '', task: line };
          return { time: line.slice(0, idx).trim(), task: line.slice(idx + 1).trim() };
        });
      const gratitude = document.getElementById('az-daily-gratitude').value || '';
      const reflection = document.getElementById('az-daily-reflection').value || '';
      all[this.currentKey] = { topThree, schedule, gratitude, reflection };
      AZStorage.saveDaily(all);
      const saved = document.getElementById('az-daily-saved');
      if (saved) saved.textContent = 'Saved · ' + new Date().toLocaleTimeString();
      fireChange();
    },

    init() {
      const picker = document.getElementById('az-daily-picker');
      const prev = document.getElementById('az-daily-prev');
      const next = document.getElementById('az-daily-next');
      const today = document.getElementById('az-daily-today');
      const btnSave = document.getElementById('az-daily-save');
      if (!btnSave) return;

      this.load(ymd(new Date()));

      if (picker) picker.addEventListener('change', () => this.load(picker.value || ymd(new Date())));
      if (prev) prev.addEventListener('click', () => this.load(shiftDay(this.currentKey, -1)));
      if (next) next.addEventListener('click', () => this.load(shiftDay(this.currentKey, 1)));
      if (today) today.addEventListener('click', () => this.load(ymd(new Date())));
      btnSave.addEventListener('click', () => this.save());
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZDaily.init());
  window.AZDaily = AZDaily;
})();
