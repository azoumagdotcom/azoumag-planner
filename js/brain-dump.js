/* AZOUMAG Planner — Brain Dump: quick capture with priority + done toggle */
(function () {
  'use strict';

  const PRIO_ORDER = { high: 0, med: 1, low: 2 };
  const PRIO_LABEL = { high: 'High', med: 'Medium', low: 'Low' };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function fireChange() {
    document.dispatchEvent(new CustomEvent('az-data-changed'));
  }

  function sortItems(list) {
    return list.slice().sort((a, b) => {
      const doneA = a.done ? 1 : 0;
      const doneB = b.done ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      const pa = PRIO_ORDER[a.priority] == null ? 3 : PRIO_ORDER[a.priority];
      const pb = PRIO_ORDER[b.priority] == null ? 3 : PRIO_ORDER[b.priority];
      if (pa !== pb) return pa - pb;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  const AZBrainDump = {
    render() {
      const list = sortItems(AZStorage.getBrainDump());
      const box = document.getElementById('az-bd-list');
      const openCount = document.getElementById('az-bd-open');
      if (openCount) openCount.textContent = String(list.filter(x => !x.done).length);
      if (!box) return;

      if (list.length === 0) {
        box.innerHTML = '<div class="az-empty">Nothing yet. Offload what\'s on your mind above.</div>';
        return;
      }

      box.innerHTML = list.map(it => {
        const p = it.priority || 'med';
        return `
          <div class="az-bd-item${it.done ? ' az-bd-done' : ''}" data-id="${escapeHtml(it.id)}">
            <label class="az-bd-check">
              <input type="checkbox" data-bd-done="${escapeHtml(it.id)}"${it.done ? ' checked' : ''} />
            </label>
            <div class="az-bd-text">${escapeHtml(it.text)}</div>
            <span class="az-chip az-bd-prio" data-prio="${escapeHtml(p)}">${escapeHtml(PRIO_LABEL[p] || 'Medium')}</span>
            <button class="az-btn az-btn-ghost az-btn-sm" data-bd-delete="${escapeHtml(it.id)}" title="Delete">✕</button>
          </div>
        `;
      }).join('');
    },

    add(text, priority) {
      const list = AZStorage.getBrainDump();
      list.push({
        id: AZStorage.newId('bd'),
        text,
        priority: priority || 'med',
        createdAt: new Date().toISOString(),
        done: false,
      });
      AZStorage.saveBrainDump(list);
      this.render();
      fireChange();
    },

    toggle(id) {
      const list = AZStorage.getBrainDump();
      const i = list.findIndex(x => x.id === id);
      if (i === -1) return;
      list[i].done = !list[i].done;
      AZStorage.saveBrainDump(list);
      this.render();
      fireChange();
    },

    remove(id) {
      const list = AZStorage.getBrainDump().filter(x => x.id !== id);
      AZStorage.saveBrainDump(list);
      this.render();
      fireChange();
    },

    clearDone() {
      const list = AZStorage.getBrainDump().filter(x => !x.done);
      AZStorage.saveBrainDump(list);
      this.render();
      fireChange();
    },

    init() {
      const form = document.getElementById('az-bd-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = (document.getElementById('az-bd-text').value || '').trim();
        if (!text) return;
        const prio = document.getElementById('az-bd-priority').value || 'med';
        this.add(text, prio);
        document.getElementById('az-bd-text').value = '';
        document.getElementById('az-bd-text').focus();
      });

      const clear = document.getElementById('az-bd-clear-done');
      if (clear) clear.addEventListener('click', () => {
        if (confirm('Clear all completed items?')) this.clearDone();
      });

      const list = document.getElementById('az-bd-list');
      if (list) {
        list.addEventListener('click', (e) => {
          const del = e.target.closest('[data-bd-delete]');
          if (del) {
            if (confirm('Delete this item?')) this.remove(del.getAttribute('data-bd-delete'));
          }
        });
        list.addEventListener('change', (e) => {
          const chk = e.target.closest('[data-bd-done]');
          if (chk) this.toggle(chk.getAttribute('data-bd-done'));
        });
      }

      this.render();
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZBrainDump.init());
  document.addEventListener('az-view-shown', (e) => {
    if (e.detail && e.detail.name === 'brain-dump') AZBrainDump.render();
  });
  window.AZBrainDump = AZBrainDump;
})();
