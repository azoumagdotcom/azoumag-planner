/* AZOUMAG Planner — Export: CSV per section + Print all or single section */
(function () {
  'use strict';

  function csvEscape(v) {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCsv(headers, rows) {
    const head = headers.map(csvEscape).join(',');
    const body = rows.map(r => headers.map(h => csvEscape(r[h])).join(',')).join('\r\n');
    return head + '\r\n' + body + '\r\n';
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function filename(kind, ext) {
    const s = AZStorage.getSettings();
    const shop = (s.plannerName || 'planner').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'planner';
    const date = new Date().toISOString().slice(0, 10);
    return `azoumag-planner-${shop}-${kind}-${date}.${ext || 'csv'}`;
  }

  const AZExport = {
    yearGoalsCsv() {
      const headers = ['goal', 'category', 'quarter', 'deadline', 'status', 'progressPct', 'successMetric', 'nextAction'];
      const rows = AZStorage.getYearGoals().map(g => ({
        goal: g.goal || '',
        category: g.category || '',
        quarter: g.quarter || '',
        deadline: g.deadline || '',
        status: g.status || '',
        progressPct: Math.round((g.progress || 0) * 100),
        successMetric: g.successMetric || '',
        nextAction: g.nextAction || '',
      }));
      download(filename('year-goals'), toCsv(headers, rows));
    },

    habitsCsv() {
      const habits = AZStorage.getHabits();
      const dateSet = new Set();
      habits.forEach(h => Object.keys(h.values || {}).forEach(k => dateSet.add(k)));
      const dates = Array.from(dateSet).sort();
      const headers = ['habit', 'category', 'target', ...dates];
      const rows = habits.map(h => {
        const row = { habit: h.habit || '', category: h.category || '', target: h.target || '' };
        dates.forEach(d => {
          const v = (h.values || {})[d];
          row[d] = v === 1 ? 'done' : v === 0 ? 'missed' : '';
        });
        return row;
      });
      download(filename('habits'), toCsv(headers, rows));
    },

    notesCsv() {
      const headers = ['title', 'body', 'updatedAt'];
      const rows = AZStorage.getNotes()
        .slice()
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        .map(n => ({ title: n.title || '', body: n.body || '', updatedAt: n.updatedAt || '' }));
      download(filename('notes'), toCsv(headers, rows));
    },

    brainDumpCsv() {
      const headers = ['text', 'priority', 'done', 'createdAt'];
      const rows = AZStorage.getBrainDump().map(x => ({
        text: x.text || '',
        priority: x.priority || 'med',
        done: x.done ? 'yes' : 'no',
        createdAt: x.createdAt || '',
      }));
      download(filename('brain-dump'), toCsv(headers, rows));
    },

    printAll() {
      const root = document.getElementById('az-planner');
      if (root) root.removeAttribute('data-print-section');
      window.print();
    },

    printSection(name) {
      const root = document.getElementById('az-planner');
      if (!root) return;
      root.setAttribute('data-print-section', name);
      // Give the browser a tick to apply the attribute before printing
      setTimeout(() => {
        window.print();
        // Clean up on next tick after print dialog closes (safe either way)
        setTimeout(() => root.removeAttribute('data-print-section'), 500);
      }, 20);
    },

    init() {
      const root = document.getElementById('az-planner');
      if (!root) return;

      root.addEventListener('click', (e) => {
        const exp = e.target.closest('[data-export]');
        if (exp) {
          const kind = exp.getAttribute('data-export');
          try {
            if (kind === 'year-goals') this.yearGoalsCsv();
            else if (kind === 'habits') this.habitsCsv();
            else if (kind === 'notes') this.notesCsv();
            else if (kind === 'brain-dump') this.brainDumpCsv();
          } catch (err) {
            document.dispatchEvent(new CustomEvent('az-toast', { detail: { message: 'Export failed', kind: 'error' } }));
          }
          return;
        }
        const printAll = e.target.closest('[data-print-all]');
        if (printAll) { this.printAll(); return; }
        const printSec = e.target.closest('[data-print-section]');
        if (printSec) this.printSection(printSec.getAttribute('data-print-section'));
      });
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZExport.init());
  window.AZExport = AZExport;
})();
