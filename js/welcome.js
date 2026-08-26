/* AZOUMAG Planner — Welcome section: personalization + quick stats */
(function () {
  'use strict';

  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
  }

  const AZWelcome = {
    refresh() {
      const s = AZStorage.getSettings();
      const heading = document.getElementById('az-welcome-heading');
      const lead = document.getElementById('az-welcome-lead');
      if (heading) heading.textContent = 'Welcome back to ' + (s.plannerName || 'your planner');
      if (lead) lead.textContent = 'Today is ' + new Date().toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long' }) + '. Everything you type saves locally to this browser.';

      const goals = AZStorage.getYearGoals();
      const habits = AZStorage.getHabits();
      const notes = AZStorage.getNotes();

      const g = document.getElementById('az-welcome-goals');
      const h = document.getElementById('az-welcome-habits');
      const n = document.getElementById('az-welcome-notes');
      const w = document.getElementById('az-welcome-week');

      if (g) g.textContent = goals.length;
      if (h) h.textContent = habits.length;
      if (n) n.textContent = notes.length;
      if (w) w.textContent = 'W' + isoWeek(new Date());
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZWelcome.refresh());
  document.addEventListener('az-view-shown', (e) => {
    if (e.detail && e.detail.name === 'welcome') AZWelcome.refresh();
  });
  document.addEventListener('az-data-changed', () => AZWelcome.refresh());

  window.AZWelcome = AZWelcome;
})();
