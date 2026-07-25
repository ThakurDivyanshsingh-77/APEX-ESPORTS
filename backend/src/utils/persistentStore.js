/**
 * Persistent JSON file-based store
 * Used as fallback when MongoDB is not connected.
 * Data survives server restarts by writing to disk.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Create a named persistent store backed by a JSON file.
 * Behaves like a Map (get, set, delete, has, values, keys).
 *
 * @param {string} storeName - name of the store (used as filename)
 * @param {Array} defaultEntries - initial seed entries [[key, value], ...]
 */
function createPersistentStore(storeName, defaultEntries = []) {
  const filePath = path.join(DATA_DIR, `${storeName}.json`);

  // Load from disk or seed with defaults
  function _load() {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const obj = JSON.parse(raw);
        return new Map(Object.entries(obj));
      }
    } catch (e) {
      console.warn(`[PersistentStore] Could not load ${storeName}: ${e.message}`);
    }
    // First run: seed with defaults
    const m = new Map(defaultEntries);
    _save(m);
    return m;
  }

  function _save(map) {
    try {
      const obj = {};
      for (const [k, v] of map.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn(`[PersistentStore] Could not save ${storeName}: ${e.message}`);
    }
  }

  let _map = _load();

  return {
    get(key) {
      return _map.get(key);
    },
    set(key, value) {
      _map.set(key, value);
      _save(_map);
      return this;
    },
    delete(key) {
      const result = _map.delete(key);
      _save(_map);
      return result;
    },
    has(key) {
      return _map.has(key);
    },
    values() {
      return _map.values();
    },
    keys() {
      return _map.keys();
    },
    entries() {
      return _map.entries();
    },
    get size() {
      return _map.size;
    },
    toArray() {
      return Array.from(_map.values());
    },
  };
}

module.exports = { createPersistentStore };
