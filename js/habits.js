/* AZOUMAG Planner — Habit Tracker: list + 14-day grid + streak, click cycles states */
(function () {
  'use strict';

  const DAYS_BACK = 14;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function ymd(d) { return d.toISOString().slice(0, 10); }

  function fireChange() {
    document.dispatchEvent(new CustomEvent('az-data-changed'));
  }

  function currentStreak(values) {
    values = values || {};
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i));
      if (values[k] === 1) streak++;
      else break;
    }
    return streak;
  }

  function monthDone(values) {
    values = values || {};
    const d = new Date();
    let count = 0;
    for (let i = 1; i <= d.getDate(); i++) {
      const k = ymd(new Date(d.getFullYear(), d.getMonth(), i));
      if (values[k] === 1) count++;
    }
    return count;
  }

  const AZHabits = {
    render() {
      const list = AZStorage.getHabits();
      const box = document.getElementById('az-h-grid');
      if (!box) return;

      if (list.length === 0) {
        box.innerHTML = '<div class="az-empty">No habits yet. Add your first above.</div>';
        return;
      }

      const today = new Date();
      const dayKeys = [];
      for (let i = DAYS_BACK - 1; i >= 0; i--) {
        dayKeys.push(ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)));
      }
      const todayKey = ymd(today);

      box.innerHTML = list.map(h => {
        const streak = currentStreak(h.values);
        const done = monthDone(h.values);
        const target = h.target || 20;
        const values = h.values || {};

        const squares = dayKeys.map(k => {
          const v = values[k];
          let state = 'empty';
          if (v === 1) state = 'done';
          else if (v === 0) state = 'miss';
          const isToday = k === todayKey ? '1' : '0';
          const label = k + (state === 'done' ? ' — done' : state === 'miss' ? ' — missed' : '');
          return `<button type="button" class="az-habit-day" data-state="${state}" data-today="${isToday}" data-habit="${escapeHtml(h.id)}" data-date="${k}" title="${label}" aria-label="${label}"></button>`;
        }).join('');

        return `
          <div class="az-habit-row" data-id="${escapeHtml(h.id)}">
            <div class="az-habit-info">
              <div class="az-habit-name">${escapeHtml(h.habit)}</div>
              <div class="az-habit-meta">
                <span class="az-chip">${escapeHtml(h.category || 'Personal')}</span>
                <span>Streak: ${streak}d</span>
                <span>Month: ${done}/${target}</span>
              </div>
            </div>
            <div style="display:flex; align-items:center;">
              <div class="az-habit-days">${squares}</div>
              <button class="az-btn az-btn-ghost az-btn-sm az-habit-delete" data-h-delete="${escapeHtml(h.id)}" title="Delete habit">✕</button>
            </div>
          </div>
        `;
      }).join('');
    },

    add(payload) {
      const list = AZStorage.getHabits();
      list.push(Object.assign({ id: AZStorage.newId('h'), values: {} }, payload));
      AZStorage.saveHabits(list);
      this.render();
      fireChange();
    },

    cycleDay(habitId, dateKey) {
      const list = AZStorage.getHabits();
      const i = list.findIndex(x => x.id === habitId);
      if (i === -1) return;
      const values = list[i].values || {};
      const cur = values[dateKey];
      // empty → done → miss → empty
      if (cur === undefined) values[dateKey] = 1;
      else if (cur === 1) values[dateKey] = 0;
      else delete values[dateKey];
      list[i].values = values;
      AZStorage.saveHabits(list);
      this.render();
      fireChange();
    },

    remove(id) {
      const list = AZStorage.getHabits().filter(x => x.id !== id);
      AZStorage.saveHabits(list);
      this.render();
      fireChange();
    },

    init() {
      const form = document.getElementById('az-h-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('az-h-name').value.trim();
        if (!name) return;
        this.add({
          habit: name,
          category: document.getElementById('az-h-category').value,
          target: parseInt(document.getElementById('az-h-target').value, 10) || 20,
        });
        form.reset();
        document.getElementById('az-h-target').value = 20;
      });

      const grid = document.getElementById('az-h-grid');
      if (grid) {
        grid.addEventListener('click', (e) => {
          const day = e.target.closest('.az-habit-day');
          if (day) {
            this.cycleDay(day.getAttribute('data-habit'), day.getAttribute('data-date'));
            return;
          }
          const del = e.target.closest('[data-h-delete]');
          if (del) {
            if (confirm('Delete this habit and its history?')) this.remove(del.getAttribute('data-h-delete'));
          }
        });
      }

      this.render();
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZHabits.init());
  document.addEventListener('az-view-shown', (e) => {
    if (e.detail && e.detail.name === 'habits') AZHabits.render();
  });

  window.AZHabits = AZHabits;
})();
