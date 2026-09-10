/* AZOUMAG Planner — Themes: CSS variable swaps applied to #az-planner */
(function () {
  'use strict';

  const THEMES = {
    'base': {
      label: 'Base — Deep Navy / Orange',
      vars: {}, // uses defaults from stylesheet
    },
    'focus-reset': {
      label: 'Focus Reset — Sage / Terracotta',
      vars: {
        '--az-orange':      '#D9845B',
        '--az-orange-soft': '#e39c78',
        '--az-navy':        '#2F4F4A',
        '--az-navy-deep':   '#203834',
        '--az-navy-light':  '#A6BFB7',
        '--az-offwhite':    '#FFFDF9',
      },
    },
    'midnight': {
      label: 'Midnight — pure dark, cool blue',
      pro: true,
      vars: {
        '--az-orange':      '#6EA8FE',
        '--az-orange-soft': '#8FBBFE',
        '--az-navy':        '#0B0F1A',
        '--az-navy-deep':   '#050810',
        '--az-navy-light':  '#1B2438',
        '--az-offwhite':    '#E8ECF5',
      },
    },
    'warm-paper': {
      label: 'Warm Paper — cream + terracotta',
      pro: true,
      vars: {
        '--az-orange':      '#B8532A',
        '--az-orange-soft': '#D07446',
        '--az-navy':        '#F2E7D5',
        '--az-navy-deep':   '#E5D6BE',
        '--az-navy-light':  '#C9B58F',
        '--az-offwhite':    '#3B2E20',
      },
    },
    'mono': {
      label: 'Mono — distraction-free grayscale',
      pro: true,
      vars: {
        '--az-orange':      '#4A4A4A',
        '--az-orange-soft': '#6A6A6A',
        '--az-navy':        '#1A1A1A',
        '--az-navy-deep':   '#0F0F0F',
        '--az-navy-light':  '#3A3A3A',
        '--az-offwhite':    '#EDEDED',
      },
    },
  };

  const isPro = () => !!(window.AZLicense && window.AZLicense.isPro());

  const AZThemes = {
    list() {
      return Object.keys(THEMES).map(id => ({
        id, label: THEMES[id].label, pro: !!THEMES[id].pro,
      }));
    },

    isLocked(name) {
      return !!(THEMES[name] && THEMES[name].pro && !isPro());
    },

    apply(name) {
      const root = document.getElementById('az-planner');
      if (!root) return { ok: false, error: 'root-missing' };
      if (this.isLocked(name)) {
        this.apply('base');
        return { ok: false, error: 'pro-required' };
      }
      const t = THEMES[name] || THEMES.base;
      Object.keys(THEMES).forEach(id => {
        Object.keys(THEMES[id].vars || {}).forEach(k => root.style.removeProperty(k));
      });
      Object.entries(t.vars || {}).forEach(([k, v]) => root.style.setProperty(k, v));
      root.setAttribute('data-theme', name);
      return { ok: true };
    },

    hydrateSelect(selectEl) {
      if (!selectEl) return;
      const cur = selectEl.value;
      const pro = isPro();
      selectEl.innerHTML = this.list().map(t => {
        const lock = t.pro && !pro ? ' 🔒' : '';
        return `<option value="${t.id}">${t.label}${lock}</option>`;
      }).join('');
      if (cur && THEMES[cur]) selectEl.value = cur;
    },
  };

  window.AZThemes = AZThemes;
})();
