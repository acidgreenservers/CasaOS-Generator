/**
 * storage.js - Centralized storage operations for CasaOS Generator
 * 
 * Manages two main storage keys:
 *   - 'casaos-generator-config': Generator form state (services, network, YAML)
 *   - 'casaos-generator-assets': Uploaded icons and screenshots
 *
 * Implements a 'No Persistence' default unless explicitly allowed.
 */

const CONFIG_KEY = 'casaos-generator-config';
const ASSETS_KEY = 'casaos-generator-assets';
const PERSISTENCE_KEY = 'persistenceAllowed';

/**
 * Returns the effective storage interface based on user preference.
 * @returns {Storage} localStorage or sessionStorage
 */
function getStorageInterface() {
    const allowed = localStorage.getItem(PERSISTENCE_KEY);
    return allowed === 'true' ? localStorage : sessionStorage;
}

/**
 * Helper to get an item from storage with migration fallback.
 * @param {string} key
 * @returns {string|null}
 */
function getItem(key) {
    const allowed = localStorage.getItem(PERSISTENCE_KEY);

    // 1. Explicitly allowed -> use localStorage
    if (allowed === 'true') {
        return localStorage.getItem(key);
    }

    // 2. Explicitly denied -> use sessionStorage
    if (allowed === 'false') {
        return sessionStorage.getItem(key);
    }

    // 3. Migration state (null) -> check sessionStorage first, then fallback to localStorage
    const sessionVal = sessionStorage.getItem(key);
    if (sessionVal !== null) return sessionVal;

    return localStorage.getItem(key);
}

/**
 * Save generator configuration.
 * @param {Object} config - { network, services, yaml, timestamp }
 */
export function saveConfig(config) {
    try {
        const storage = getStorageInterface();
        storage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('Failed to save config:', e);
    }
}

/**
 * Load generator configuration.
 * @returns {Object|null} The saved config, or null if none exists.
 */
export function loadConfig() {
    try {
        const saved = getItem(CONFIG_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error('Failed to load config:', e);
        return null;
    }
}

/**
 * Clear generator configuration.
 */
export function clearConfig() {
    try {
        localStorage.removeItem(CONFIG_KEY);
        sessionStorage.removeItem(CONFIG_KEY);
    } catch (e) {
        console.error('Failed to clear config:', e);
    }
}

/**
 * Get the assets object (icons + screenshots).
 * @returns {{ icons: Array, screenshots: Array }}
 */
export function getAssets() {
    try {
        const saved = getItem(ASSETS_KEY);
        return saved ? JSON.parse(saved) : { icons: [], screenshots: [] };
    } catch (e) {
        console.error('Failed to get assets:', e);
        return { icons: [], screenshots: [] };
    }
}

/**
 * Save the assets object.
 * @param {{ icons: Array, screenshots: Array }} assets
 */
export function saveAssets(assets) {
    try {
        const storage = getStorageInterface();
        storage.setItem(ASSETS_KEY, JSON.stringify(assets));
    } catch (e) {
        console.error('Failed to save assets:', e);
    }
}

/**
 * Clear all generator data.
 */
export function clearAll() {
    try {
        localStorage.removeItem(CONFIG_KEY);
        localStorage.removeItem(ASSETS_KEY);
        sessionStorage.removeItem(CONFIG_KEY);
        sessionStorage.removeItem(ASSETS_KEY);
    } catch (e) {
        console.error('Failed to clear all:', e);
    }
}

/**
 * Set the persistence preference.
 * @param {boolean} allowed
 */
export function setPersistencePreference(allowed) {
    localStorage.setItem(PERSISTENCE_KEY, allowed ? 'true' : 'false');

    // If enabling persistence, migrate session data to local
    if (allowed) {
        const config = sessionStorage.getItem(CONFIG_KEY);
        if (config) localStorage.setItem(CONFIG_KEY, config);

        const assets = sessionStorage.getItem(ASSETS_KEY);
        if (assets) localStorage.setItem(ASSETS_KEY, assets);
    } else {
        // If disabling, clear local storage items (keeping only the preference)
        localStorage.removeItem(CONFIG_KEY);
        localStorage.removeItem(ASSETS_KEY);
    }
}

/**
 * Get the current persistence preference.
 * @returns {boolean|null}
 */
export function getPersistencePreference() {
    const val = localStorage.getItem(PERSISTENCE_KEY);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return null;
}
