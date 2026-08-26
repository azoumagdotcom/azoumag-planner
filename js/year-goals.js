/* AZOUMAG Planner — Year Goals: add / list / edit progress + status / delete */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function fireChange() {
    document.dispatchEvent(new CustomEvent('az-data-changed'));
  }

  const STATUSES = ['Not Started', 'In Progress', 'Waiting', 'Done'];

  const AZYearGoals = {
    render() {
      const list = AZStorage.getYearGoals();
      const box = document.getElementById('az-yg-list');
      if (!box) return;

      if (list.length === 0) {
        box.innerHTML = '<div class="az-empty">No goals yet. Add your first above.</div>';
        return;
      }

      box.innerHTML = list.map(g => {
        const pct = Math.round((g.progress || 0) * 100);
        const statusOpts = STATUSES.map(s => `<option${s === g.status ? ' selected' : ''}>${s}</option>`).join('');
        return `
          <div class="az-item" data-id="${escapeHtml(g.id)}">
            <div class="az-item-head">
              <p class="az-item-title">${escapeHtml(g.goal)}</p>
              <div class="az-item-meta">
                <span class="az-chip">${escapeHtml(g.category || '')}</span>
                <span class="az-chip">${escapeHtml(g.quarter || '')}</span>
                ${g.deadline ? `<span class="az-chip">${escapeHtml(g.deadline)}</span>` : ''}
                <span class="az-chip az-chip-status" data-status="${escapeHtml(g.status || 'Not Started')}">${escapeHtml(g.status || 'Not Started')}</span>
              </div>
            </div>
            <div class="az-item-body">
              ${g.successMetric ? `<p><strong>Metric:</strong> ${escapeHtml(g.successMetric)}</p>` : ''}
              ${g.nextAction ? `<p><strong>Next:</strong> ${escapeHtml(g.nextAction)}</p>` : ''}
            </div>
            <div class="az-progress"><div class="az-progress-fill" style="width:${pct}%"></div></div>
            <div class="az-item-actions">
              <input type="range" min="0" max="100" value="${pct}" data-yg-progress="${escapeHtml(g.id)}" title="Progress" />
              <span class="az-muted" style="min-width:38px; text-align:right;">${pct}%</span>
              <select data-yg-status="${escapeHtml(g.id)}">${statusOpts}</select>
              <button class="az-btn az-btn-ghost az-btn-sm" data-yg-delete="${escapeHtml(g.id)}">Delete</button>
            </div>
          </div>
        `;
      }).join('');
    },

    add(payload) {
      const list = AZStorage.getYearGoals();
      list.unshift(Object.assign({ id: AZStorage.newId('yg'), progress: 0 }, payload));
      AZStorage.saveYearGoals(list);
      this.render();
      fireChange();
    },

    update(id, patch) {
      const list = AZStorage.getYearGoals();
      const i = list.findIndex(x => x.id === id);
      if (i === -1) return;
      list[i] = Object.assign({}, list[i], patch);
      AZStorage.saveYearGoals(list);
      fireChange();
    },

    remove(id) {
      const list = AZStorage.getYearGoals().filter(x => x.id !== id);
      AZStorage.saveYearGoals(list);
      this.render();
      fireChange();
    },

    init() {
      const form = document.getElementById('az-yg-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const goal = document.getElementById('az-yg-goal').value.trim();
        if (!goal) return;
        this.add({
          goal,
          category: document.getElementById('az-yg-category').value,
          quarter: document.getElementById('az-yg-quarter').value,
          deadline: document.getElementById('az-yg-deadline').value,
          status: document.getElementById('az-yg-status').value,
          successMetric: document.getElementById('az-yg-metric').value.trim(),
          nextAction: document.getElementById('az-yg-next').value.trim(),
        });
        form.reset();
      });

      const list = document.getElementById('az-yg-list');
      if (list) {
        list.addEventListener('click', (e) => {
          const del = e.target.closest('[data-yg-delete]');
          if (del) {
            if (confirm('Delete this goal?')) this.remove(del.getAttribute('data-yg-delete'));
          }
        });
        list.addEventListener('input', (e) => {
          const p = e.target.closest('[data-yg-progress]');
          if (p) {
            const id = p.getAttribute('data-yg-progress');
            const pct = parseInt(p.value, 10) / 100;
            this.update(id, { progress: pct });
            // update visible fill without full re-render
            const item = p.closest('.az-item');
            const fill = item && item.querySelector('.az-progress-fill');
            const label = p.parentNode.querySelector('.az-muted');
            if (fill) fill.style.width = Math.round(pct * 100) + '%';
            if (label) label.textContent = Math.round(pct * 100) + '%';
          }
        });
        list.addEventListener('change', (e) => {
          const s = e.target.closest('[data-yg-status]');
          if (s) {
            this.update(s.getAttribute('data-yg-status'), { status: s.value });
            // update visible chip
            const item = s.closest('.az-item');
            const chip = item && item.querySelector('.az-chip-status');
            if (chip) { chip.textContent = s.value; chip.setAttribute('data-status', s.value); }
          }
        });
      }

      this.render();
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZYearGoals.init());
  document.addEventListener('az-view-shown', (e) => {
    if (e.detail && e.detail.name === 'year-goals') AZYearGoals.render();
  });

  window.AZYearGoals = AZYearGoals;
})();
