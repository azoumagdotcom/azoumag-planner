/* AZOUMAG Planner — Dashboard: KPI cards + top goals + today's habits */
(function () {
  'use strict';

  function todayKey() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function dayKey(offset) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  }

  function currentStreak(habit) {
    const values = habit.values || {};
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i).toISOString().slice(0, 10);
      if (values[k] === 1) streak++;
      else break;
    }
    return streak;
  }

  function habitCompletionRate(habits, days) {
    if (!habits.length || !days) return null;
    let hits = 0;
    for (const h of habits) {
      const v = h.values || {};
      for (let i = 0; i < days; i++) {
        if (v[dayKey(i)] === 1) hits++;
      }
    }
    const possible = habits.length * days;
    return { hits, possible, pct: Math.round((hits / possible) * 100) };
  }

  function yearProgress() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    const day = Math.floor((now - start) / 86400000) + 1;
    const total = Math.round((end - start) / 86400000);
    return { day, total, pct: Math.round((day / total) * 100) };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  const AZDashboard = {
    refresh() {
      const goals = AZStorage.getYearGoals();
      const habits = AZStorage.getHabits();
      const bd = AZStorage.getBrainDump();

      const yp = yearProgress();
      const yearFrac = yp.day / yp.total;
      const onTrackCount = goals.filter(g =>
        g.status !== 'Done' && (g.progress || 0) >= yearFrac
      ).length;
      const streaks = habits.map(currentStreak);
      const longest = streaks.length ? Math.max.apply(null, streaks) : 0;
      const week = habitCompletionRate(habits, 7);
      const month = habitCompletionRate(habits, 30);
      const openBd = bd.filter(x => !x.done).length;

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      set('az-dash-total-goals', goals.length);
      set('az-dash-ontrack-goals', onTrackCount);
      set('az-dash-total-habits', habits.length);
      set('az-dash-longest-streak', longest);
      set('az-dash-year-progress', `${yp.day}/${yp.total} · ${yp.pct}%`);
      set('az-dash-week-habits', week ? `${week.hits}/${week.possible} · ${week.pct}%` : '—');
      set('az-dash-30d-habits', month ? `${month.hits}/${month.possible} · ${month.pct}%` : '—');
      set('az-dash-open-bd', openBd);

      // Top goals by progress (top 3, exclude done)
      const topBox = document.getElementById('az-dash-top-goals');
      if (topBox) {
        const top = goals
          .filter(g => g.status !== 'Done')
          .slice()
          .sort((a, b) => (b.progress || 0) - (a.progress || 0))
          .slice(0, 3);
        if (top.length === 0) {
          topBox.className = 'az-empty';
          topBox.textContent = 'No active goals yet. Add one in the Year Goals tab.';
        } else {
          topBox.className = '';
          topBox.innerHTML = top.map(g => {
            const pct = Math.round((g.progress || 0) * 100);
            return `
              <div class="az-item" style="margin-bottom:10px;">
                <div class="az-item-head">
                  <span class="az-item-title">${escapeHtml(g.goal)}</span>
                  <span class="az-chip">${escapeHtml(g.quarter || '')}</span>
                </div>
                <div class="az-progress"><div class="az-progress-fill" style="width:${pct}%"></div></div>
                <div class="az-muted" style="font-size:12px;">${pct}% · ${escapeHtml(g.status || '')}</div>
              </div>
            `;
          }).join('');
        }
      }

      // Today's habits
      const todayBox = document.getElementById('az-dash-today-habits');
      if (todayBox) {
        if (habits.length === 0) {
          todayBox.className = 'az-empty';
          todayBox.textContent = 'No habits yet. Add one in the Habits tab.';
        } else {
          const tk = todayKey();
          todayBox.className = '';
          todayBox.innerHTML = habits.map(h => {
            const v = (h.values || {})[tk];
            let state = 'empty', dot = '○';
            if (v === 1) { state = 'done'; dot = '✓'; }
            else if (v === 0) { state = 'miss'; dot = '✕'; }
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--az-glass-border);">
                <span>${escapeHtml(h.habit)}</span>
                <span class="az-chip" style="min-width:32px; text-align:center;">${dot}</span>
              </div>
            `;
          }).join('');
        }
      }
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZDashboard.refresh());
  document.addEventListener('az-view-shown', (e) => {
    if (e.detail && e.detail.name === 'dashboard') AZDashboard.refresh();
  });
  document.addEventListener('az-data-changed', () => AZDashboard.refresh());

  window.AZDashboard = AZDashboard;
})();
