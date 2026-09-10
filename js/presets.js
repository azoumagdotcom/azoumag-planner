/* AZOUMAG Planner — Product presets: seed goals / habits / monthly for a given SKU */
(function () {
  'use strict';

  function todayYmd() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function endOfQuarter(qOffset) {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + (qOffset || 0);
    const endMonth = (q + 1) * 3 - 1; // 0-indexed last month of quarter
    const y = now.getFullYear() + Math.floor(endMonth / 12);
    const m = ((endMonth % 12) + 12) % 12;
    const last = new Date(y, m + 1, 0);
    return last.getFullYear() + '-' + String(last.getMonth() + 1).padStart(2, '0') + '-' + String(last.getDate()).padStart(2, '0');
  }

  function currentMonthKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  const PRESETS = {
    'solo-founder': {
      label: 'Solo Founder — ship one product this quarter',
      theme: 'base',
      goals: [
        { goal: 'Ship v1 of the flagship product', category: 'Career', quarter: 'Q' + (Math.floor(new Date().getMonth() / 3) + 1), status: 'In Progress', successMetric: '10 paying users or 100 sign-ups', nextAction: 'Write the landing page copy', progress: 0.1 },
        { goal: 'Publish 12 pieces of content', category: 'Career', quarter: 'Year', status: 'Not Started', successMetric: '1 post per week', nextAction: 'Draft this week\'s post', progress: 0 },
        { goal: 'Talk to 20 potential users', category: 'Career', quarter: 'Q' + (Math.floor(new Date().getMonth() / 3) + 1), status: 'Not Started', successMetric: '20 recorded calls', nextAction: 'Book first 3 calls', progress: 0 },
      ],
      habits: [
        { habit: 'Deep work 90 min', category: 'Focus', target: 22 },
        { habit: 'Ship one thing today', category: 'Focus', target: 22 },
        { habit: 'Write 250 words', category: 'Learning', target: 20 },
        { habit: 'Exercise 30 min', category: 'Health', target: 20 },
      ],
      monthly: {
        priorities: ['Land v1 launch date', 'Publish 4 posts', 'Weekly user calls'],
        notes: 'Ship-mode month. Ruthless focus on the launch. Say no to anything that does not move v1 forward.',
      },
    },

    'focus-reset': {
      label: 'Focus Reset — 90-day mental clarity sprint',
      theme: 'focus-reset',
      pro: true,
      goals: [
        { goal: 'Complete a 90-day mental reset', category: 'Personal', quarter: 'Q' + (Math.floor(new Date().getMonth() / 3) + 1), status: 'In Progress', successMetric: 'No dopamine-crash apps for 90 days', nextAction: 'Delete distraction apps tonight', progress: 0.05 },
        { goal: 'Read 6 books this quarter', category: 'Learning', quarter: 'Q' + (Math.floor(new Date().getMonth() / 3) + 1), status: 'Not Started', successMetric: '6 finished books', nextAction: 'Pick book #1', progress: 0 },
        { goal: 'Rebuild a morning routine', category: 'Health', quarter: 'Year', status: 'In Progress', successMetric: '30 consecutive days', nextAction: 'Set wake time and prep the night before', progress: 0.15 },
      ],
      habits: [
        { habit: 'Wake before 7am', category: 'Health', target: 25 },
        { habit: 'Read 20 pages', category: 'Learning', target: 25 },
        { habit: 'Journal 10 min', category: 'Personal', target: 25 },
        { habit: 'No social media before noon', category: 'Focus', target: 25 },
        { habit: 'Walk 30 min outside', category: 'Health', target: 20 },
      ],
      monthly: {
        priorities: ['90-day reset', 'Reading list', 'Morning routine locked'],
        notes: 'Slow month. Depth over speed. Show up daily, no exceptions.',
      },
    },

    'student': {
      label: 'Student — semester ops',
      theme: 'base',
      pro: true,
      goals: [
        { goal: 'Pass all courses with distinction', category: 'Learning', quarter: 'Year', status: 'In Progress', successMetric: 'Average > 15/20', nextAction: 'Plan revision schedule', progress: 0.2 },
        { goal: 'Complete one side project', category: 'Career', quarter: 'Q' + (Math.floor(new Date().getMonth() / 3) + 1), status: 'Not Started', successMetric: 'Deployed and shared', nextAction: 'Choose the project', progress: 0 },
      ],
      habits: [
        { habit: 'Study 2 hours', category: 'Learning', target: 25 },
        { habit: 'Review notes', category: 'Learning', target: 22 },
        { habit: 'Exercise', category: 'Health', target: 18 },
        { habit: 'Sleep by midnight', category: 'Health', target: 25 },
      ],
      monthly: {
        priorities: ['Exam prep', 'Assignment deadlines', 'Rest and recovery'],
        notes: 'Balance revision with breaks. Sleep is a performance tool, not a reward.',
      },
    },
  };

  const isPro = () => !!(window.AZLicense && window.AZLicense.isPro());

  const AZPresets = {
    list() {
      return Object.keys(PRESETS).map(id => ({
        id, label: PRESETS[id].label, theme: PRESETS[id].theme, pro: !!PRESETS[id].pro,
      }));
    },

    get(id) { return PRESETS[id]; },

    isLocked(id) {
      return !!(PRESETS[id] && PRESETS[id].pro && !isPro());
    },

    hydrateSelect(selectEl) {
      if (!selectEl) return;
      const pro = isPro();
      selectEl.innerHTML = '<option value="">— pick a preset —</option>' +
        this.list().map(p => {
          const lock = p.pro && !pro ? ' 🔒' : '';
          return `<option value="${p.id}">${p.label}${lock}</option>`;
        }).join('');
    },

    apply(id, mode) {
      const p = PRESETS[id];
      if (!p) return { ok: false, error: 'Unknown preset' };
      if (this.isLocked(id)) return { ok: false, error: 'Pro required for this preset' };
      mode = mode || 'merge'; // 'merge' | 'replace'

      // Goals
      const goals = (p.goals || []).map(g => Object.assign({ id: AZStorage.newId('yg'), progress: 0 }, g));
      if (mode === 'replace') AZStorage.saveYearGoals(goals);
      else AZStorage.saveYearGoals([...goals, ...AZStorage.getYearGoals()]);

      // Habits
      const habits = (p.habits || []).map(h => Object.assign({ id: AZStorage.newId('h'), values: {} }, h));
      if (mode === 'replace') AZStorage.saveHabits(habits);
      else AZStorage.saveHabits([...AZStorage.getHabits(), ...habits]);

      // Monthly for current month (only if empty in merge mode)
      const monthly = AZStorage.getMonthly();
      const key = currentMonthKey();
      const existing = monthly[key];
      if (mode === 'replace' || !existing || (!existing.priorities || existing.priorities.length === 0) && !existing.notes) {
        monthly[key] = {
          priorities: (p.monthly && p.monthly.priorities) || [],
          dates: (existing && existing.dates) || [],
          notes: (p.monthly && p.monthly.notes) || '',
        };
        AZStorage.saveMonthly(monthly);
      }

      // Theme
      if (p.theme && window.AZThemes) {
        const s = AZStorage.getSettings();
        s.theme = p.theme;
        AZStorage.saveSettings(s);
        AZThemes.apply(p.theme);
      }

      document.dispatchEvent(new CustomEvent('az-data-changed'));
      return { ok: true, applied: { goals: goals.length, habits: habits.length } };
    },
  };

  window.AZPresets = AZPresets;
})();
