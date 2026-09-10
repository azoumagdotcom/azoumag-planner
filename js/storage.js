/* AZOUMAG Planner — Storage layer (LocalStorage + JSON backup/restore) */
(function (global) {
  'use strict';

  const APP_SIGNATURE = 'AZOUMAG PLANNER';
  const SCHEMA_VERSION = 1;

  const K = {
    settings:   'az_planner_settings',
    yearGoals:  'az_planner_year_goals',
    habits:     'az_planner_habits',
    monthly:    'az_planner_monthly',
    weekly:     'az_planner_weekly',
    daily:      'az_planner_daily',
    notes:      'az_planner_notes',
    brainDump:  'az_planner_brain_dump',
    license:    'az_planner_license',
    meta:       'az_planner_meta',
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const defaultSettings = () => ({
    plannerName: 'Your Planner',
    year: new Date().getFullYear(),
    theme: 'base',
    createdAt: new Date().toISOString(),
  });

  const AZStorage = {
    // Settings
    getSettings() { return read(K.settings, defaultSettings()); },
    saveSettings(s) { write(K.settings, s); this.touchMeta(); },

    // Year Goals — [{id, goal, category, quarter, deadline, status, progress, successMetric, nextAction}]
    getYearGoals() { return read(K.yearGoals, []); },
    saveYearGoals(list) { write(K.yearGoals, list); this.touchMeta(); },

    // Habits — [{id, habit, category, target, values: {'2026-08-26': 1, ...}}]
    getHabits() { return read(K.habits, []); },
    saveHabits(list) { write(K.habits, list); this.touchMeta(); },

    // Monthly — {'2026-08': {priorities: [], notes: '', importantDates: []}}
    getMonthly() { return read(K.monthly, {}); },
    saveMonthly(map) { write(K.monthly, map); this.touchMeta(); },

    // Weekly — {'2026-W35': {focus: '', mon: [], tue: [], ...}}
    getWeekly() { return read(K.weekly, {}); },
    saveWeekly(map) { write(K.weekly, map); this.touchMeta(); },

    // Daily — {'2026-08-26': {topThree: [], schedule: [], gratitude: '', reflection: ''}}
    getDaily() { return read(K.daily, {}); },
    saveDaily(map) { write(K.daily, map); this.touchMeta(); },

    // Notes — [{id, title, body, updatedAt}]
    getNotes() { return read(K.notes, []); },
    saveNotes(list) { write(K.notes, list); this.touchMeta(); },

    // Brain Dump — [{id, text, priority, createdAt}]
    getBrainDump() { return read(K.brainDump, []); },
    saveBrainDump(list) { write(K.brainDump, list); this.touchMeta(); },

    // Meta (last modified, last backup)
    getMeta() { return read(K.meta, { updatedAt: null, lastBackupAt: null }); },
    touchMeta() {
      const meta = this.getMeta();
      meta.updatedAt = new Date().toISOString();
      write(K.meta, meta);
    },
    markBackupDone() {
      const meta = this.getMeta();
      meta.lastBackupAt = new Date().toISOString();
      write(K.meta, meta);
    },

    // ID generator
    newId(prefix) {
      return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    },

    // Full snapshot for backup
    exportAll() {
      return {
        app: APP_SIGNATURE,
        version: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
          settings:  this.getSettings(),
          yearGoals: this.getYearGoals(),
          habits:    this.getHabits(),
          monthly:   this.getMonthly(),
          weekly:    this.getWeekly(),
          daily:     this.getDaily(),
          notes:     this.getNotes(),
          brainDump: this.getBrainDump(),
          license:   read(K.license, null),
        },
      };
    },

    importAll(payload, mode) {
      mode = mode || 'replace';
      if (!payload || typeof payload !== 'object') {
        return { ok: false, error: 'Empty or invalid payload' };
      }
      if (payload.app !== APP_SIGNATURE) {
        return { ok: false, error: 'This backup does not belong to AZOUMAG PLANNER' };
      }
      if (!payload.data || typeof payload.data !== 'object') {
        return { ok: false, error: 'Backup structure is invalid' };
      }
      const d = payload.data;

      if (mode === 'replace') {
        if (d.settings)  this.saveSettings(d.settings);
        if (d.yearGoals) this.saveYearGoals(d.yearGoals);
        if (d.habits)    this.saveHabits(d.habits);
        if (d.monthly)   this.saveMonthly(d.monthly);
        if (d.weekly)    this.saveWeekly(d.weekly);
        if (d.daily)     this.saveDaily(d.daily);
        if (d.notes)     this.saveNotes(d.notes);
        if (d.brainDump) this.saveBrainDump(d.brainDump);
        if (d.license)   write(K.license, d.license);
      } else if (mode === 'merge') {
        if (Array.isArray(d.yearGoals)) this.saveYearGoals([...this.getYearGoals(), ...d.yearGoals]);
        if (Array.isArray(d.habits))    this.saveHabits([...this.getHabits(), ...d.habits]);
        if (Array.isArray(d.notes))     this.saveNotes([...this.getNotes(), ...d.notes]);
        if (Array.isArray(d.brainDump)) this.saveBrainDump([...this.getBrainDump(), ...d.brainDump]);
        if (d.monthly) this.saveMonthly(Object.assign({}, this.getMonthly(), d.monthly));
        if (d.weekly)  this.saveWeekly(Object.assign({}, this.getWeekly(), d.weekly));
        if (d.daily)   this.saveDaily(Object.assign({}, this.getDaily(), d.daily));
      }
      return { ok: true };
    },

    resetAll() {
      Object.values(K).forEach(k => localStorage.removeItem(k));
    },

    buildBackupFilename() {
      const s = this.getSettings();
      const shop = (s.plannerName || 'planner').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'planner';
      const date = new Date().toISOString().slice(0, 10);
      return `azoumag-planner-${shop}-${date}.json`;
    },
  };

  global.AZStorage = AZStorage;
  global.AZ_PLANNER_VERSION = '0.1.0';
})(window);
