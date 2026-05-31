/**
 * storage.js - Centralized localStorage operations for CasaOS Generator
 * 
 * Manages two localStorage keys:
 *   - 'casaos-generator-config': Generator form state (services, network, YAML)
 *   - 'casaos-generator-assets': Uploaded icons and screenshots
 */

const CONFIG_KEY = 'casaos-generator-config';
const ASSETS_KEY = 'casaos-generator-assets';

/**
 * Save generator configuration to localStorage.
 * @param {Object} config - { network, services, yaml, timestamp }
 */
export function saveConfig(config) {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('Failed to save config:', e);
    }
}

/**
 * Load generator configuration from localStorage.
 * @returns {Object|null} The saved config, or null if none exists.
 */
export function loadConfig() {
    try {
        const saved = localStorage.getItem(CONFIG_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error('Failed to load config:', e);
        return null;
    }
}

/**
 * Clear generator configuration from localStorage.
 */
export function clearConfig() {
    try {
        localStorage.removeItem(CONFIG_KEY);
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
        const saved = localStorage.getItem(ASSETS_KEY);
        return saved ? JSON.parse(saved) : { icons: [], screenshots: [] };
    } catch (e) {
        console.error('Failed to get assets:', e);
        return { icons: [], screenshots: [] };
    }
}

/**
 * Save the assets object to localStorage.
 * @param {{ icons: Array, screenshots: Array }} assets
 */
export function saveAssets(assets) {
    try {
        localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
    } catch (e) {
        console.error('Failed to save assets:', e);
    }
}

/**
 * Clear all generator data from localStorage.
 */
export function clearAll() {
    try {
        localStorage.removeItem(CONFIG_KEY);
        localStorage.removeItem(ASSETS_KEY);
    } catch (e) {
        console.error('Failed to clear all:', e);
    }
}