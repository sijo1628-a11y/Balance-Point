// BalancePoint is offline-first: all data lives in the browser via
// localStorage. This mirrors the tiny key/value API the app was
// originally prototyped against, so the rest of the app code is untouched.
//
// If you'd rather use IndexedDB (recommended for larger datasets — see
// README "Swapping in IndexedDB"), replace this file's implementation;
// the get/set/delete/list function signatures are the only contract
// the rest of the app relies on.

const PREFIX = "balancepoint:";

function installStoragePolyfill() {
  if (typeof window === "undefined" || window.storage) return;

  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(PREFIX + key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      const existed = localStorage.getItem(PREFIX + key) !== null;
      localStorage.removeItem(PREFIX + key);
      return { key, deleted: existed, shared: false };
    },
    async list(prefix = "") {
      const keys = Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX + prefix))
        .map((k) => k.slice(PREFIX.length));
      return { keys, prefix, shared: false };
    },
  };
}

export default installStoragePolyfill;
