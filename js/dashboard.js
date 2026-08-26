/* AZOUMAG Planner — Dashboard: KPI cards + top goals + today's habits */
(function () {
  'use strict';

  function todayKey() {
    const d = new Date();
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

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  const AZDashboard = {
    refresh() {
      const goals = AZStorage.getYearGoals();
      const habits = AZStorage.getHabits();

      const totalGoalsEl = document.getElementById('az-dash-total-goals');
      const activeGoalsEl = document.getElementById('az-dash-active-goals');
      const totalHabitsEl = document.getElementById('az-dash-total-habits');
      const longestEl = document.getElementById('az-dash-longest-streak');

      const activeCount = goals.filter(g => g.status === 'In Progress' || g.status === 'Waiting').length;
      const streaks = habits.map(currentStreak);
      const longest = streaks.length ? Math.max.apply(null, streaks) : 0;

      if (totalGoalsEl) totalGoalsEl.textContent = goals.length;
      if (activeGoalsEl) activeGoalsEl.textContent = activeCount;
      if (totalHabitsEl) totalHabitsEl.textContent = habits.length;
      if (longestEl) longestEl.textContent = longest;

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
