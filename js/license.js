/* AZOUMAG Planner — License keys (offline HMAC-SHA256 verification) */
/* ponytail: secret is embedded — crackable by anyone reading the source.
   Acceptable for BSL honor-system gating. Upgrade to server verification
   when there's paid revenue to justify it. */
(function (global) {
  'use strict';

  const SECRET = 'azoumag-planner-v1-2026-secret';
  const STORAGE_KEY = 'az_planner_license';
  const KEY_RE = /^AZOUMAG-PRO-([A-Z0-9]{8})-([a-f0-9]{12})$/;

  async function hmacHex(msg) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
    return Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function verify(rawKey) {
    if (typeof rawKey !== 'string') return false;
    const key = rawKey.trim().toUpperCase().replace(/^AZOUMAG-PRO-/, 'AZOUMAG-PRO-');
    const m = key.match(/^AZOUMAG-PRO-([A-Z0-9]{8})-([A-F0-9]{12})$/i);
    if (!m) return false;
    const [, id, sig] = m;
    const expected = (await hmacHex('PRO:' + id)).slice(0, 12);
    return sig.toLowerCase() === expected;
  }

  function readStored() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch (e) { return null; }
  }

  const AZLicense = {
    async activate(rawKey) {
      const ok = await verify(rawKey);
      if (!ok) return { ok: false, error: 'Invalid license key' };
      const record = {
        key: rawKey.trim().toUpperCase(),
        tier: 'pro',
        activatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      document.dispatchEvent(new CustomEvent('az-license-changed'));
      return { ok: true, tier: 'pro' };
    },

    deactivate() {
      localStorage.removeItem(STORAGE_KEY);
      document.dispatchEvent(new CustomEvent('az-license-changed'));
    },

    getRecord() { return readStored(); },
    getTier() { return (readStored() || {}).tier || 'free'; },
    isPro() { return this.getTier() === 'pro'; },

    async revalidate() {
      const rec = readStored();
      if (!rec || !rec.key) return;
      const ok = await verify(rec.key);
      if (!ok) this.deactivate();
    },
  };

  global.AZLicense = AZLicense;
})(window);
