/* AZOUMAG Planner — Notes: title + body, edit in place, sorted by updatedAt desc */
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

  function excerpt(text, n) {
    text = (text || '').trim();
    if (text.length <= n) return text;
    return text.slice(0, n - 1) + '…';
  }

  function formatWhen(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const AZNotes = {
    editingId: null,

    render() {
      const list = AZStorage.getNotes()
        .slice()
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      const box = document.getElementById('az-notes-list');
      const count = document.getElementById('az-notes-count');
      if (count) count.textContent = String(list.length);
      if (!box) return;

      if (list.length === 0) {
        box.innerHTML = '<div class="az-empty">No notes yet. Write your first above.</div>';
        return;
      }

      box.innerHTML = list.map(n => `
        <div class="az-item az-note-item" data-id="${escapeHtml(n.id)}">
          <div class="az-item-head">
            <p class="az-item-title">${escapeHtml(n.title || 'Untitled')}</p>
            <div class="az-item-meta">
              <span class="az-chip">${escapeHtml(formatWhen(n.updatedAt))}</span>
            </div>
          </div>
          <div class="az-item-body az-note-body">${escapeHtml(excerpt(n.body, 280))}</div>
          <div class="az-item-actions">
            <button class="az-btn az-btn-ghost az-btn-sm" data-note-edit="${escapeHtml(n.id)}">Edit</button>
            <button class="az-btn az-btn-ghost az-btn-sm" data-note-delete="${escapeHtml(n.id)}">Delete</button>
          </div>
        </div>
      `).join('');
    },

    resetForm() {
      this.editingId = null;
      const t = document.getElementById('az-notes-title');
      const b = document.getElementById('az-notes-body');
      const btn = document.getElementById('az-notes-submit');
      const cancel = document.getElementById('az-notes-cancel');
      if (t) t.value = '';
      if (b) b.value = '';
      if (btn) btn.textContent = 'Save note';
      if (cancel) cancel.hidden = true;
    },

    startEdit(id) {
      const n = AZStorage.getNotes().find(x => x.id === id);
      if (!n) return;
      this.editingId = id;
      const t = document.getElementById('az-notes-title');
      const b = document.getElementById('az-notes-body');
      const btn = document.getElementById('az-notes-submit');
      const cancel = document.getElementById('az-notes-cancel');
      if (t) t.value = n.title || '';
      if (b) b.value = n.body || '';
      if (btn) btn.textContent = 'Update note';
      if (cancel) cancel.hidden = false;
      if (t) t.focus();
    },

    submit(title, body) {
      const list = AZStorage.getNotes();
      const now = new Date().toISOString();
      if (this.editingId) {
        const i = list.findIndex(x => x.id === this.editingId);
        if (i !== -1) list[i] = Object.assign({}, list[i], { title, body, updatedAt: now });
      } else {
        list.unshift({ id: AZStorage.newId('note'), title, body, updatedAt: now });
      }
      AZStorage.saveNotes(list);
      this.resetForm();
      this.render();
      fireChange();
    },

    remove(id) {
      const list = AZStorage.getNotes().filter(x => x.id !== id);
      AZStorage.saveNotes(list);
      if (this.editingId === id) this.resetForm();
      this.render();
      fireChange();
    },

    init() {
      const form = document.getElementById('az-notes-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = (document.getElementById('az-notes-title').value || '').trim();
        const body = (document.getElementById('az-notes-body').value || '').trim();
        if (!title && !body) return;
        this.submit(title, body);
      });

      const cancel = document.getElementById('az-notes-cancel');
      if (cancel) cancel.addEventListener('click', () => this.resetForm());

      const list = document.getElementById('az-notes-list');
      if (list) {
        list.addEventListener('click', (e) => {
          const edit = e.target.closest('[data-note-edit]');
          if (edit) { this.startEdit(edit.getAttribute('data-note-edit')); return; }
          const del = e.target.closest('[data-note-delete]');
          if (del) {
            if (confirm('Delete this note?')) this.remove(del.getAttribute('data-note-delete'));
          }
        });
      }

      this.render();
    },
  };

  document.addEventListener('DOMContentLoaded', () => AZNotes.init());
  document.addEventListener('az-view-shown', (e) => {
    if (e.detail && e.detail.name === 'notes') AZNotes.render();
  });
  window.AZNotes = AZNotes;
})();
