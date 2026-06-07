/**
 * saved-apps.js - Persistent CRUD management for saved CasaOS applications
 *
 * Stores full application config snapshots in localStorage.
 * Each entry includes all service data, metadata, icons (base64), and screenshots (base64).
 */

const STORAGE_KEY = 'casaos_saved_apps';

/**
 * Save or update an application config.
 * If the app has an `id` it's an update; otherwise it's a new entry.
 * @param {Object} config - Full application configuration object
 * @returns {Array} The updated list of all saved apps
 */
export function saveApp(config) {
    const apps = loadApps();
    const idx = apps.findIndex(a => a.id === config.id);
    if (idx >= 0) {
        apps[idx] = { ...config, updatedAt: Date.now() };
    } else {
        apps.push({
            ...config,
            id: generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            starred: false,
        });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return apps;
}

/**
 * Load all saved applications from localStorage.
 * @returns {Array} Array of saved application objects
 */
export function loadApps() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

/**
 * Delete a saved application by ID.
 * @param {string} id - The application ID
 * @returns {Array} The updated list of saved apps
 */
export function deleteApp(id) {
    const apps = loadApps().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return apps;
}

/**
 * Toggle the starred state of an application.
 * @param {string} id - The application ID
 * @returns {Array} The updated list of saved apps
 */
export function toggleStar(id) {
    const apps = loadApps();
    const app = apps.find(a => a.id === id);
    if (app) {
        app.starred = !app.starred;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return apps;
}

/**
 * Get a single application by ID.
 * @param {string} id - The application ID
 * @returns {Object|null} The application object or null if not found
 */
export function getApp(id) {
    return loadApps().find(a => a.id === id) || null;
}

/**
 * Generate a unique application ID.
 * @returns {string} A unique ID string
 */
function generateId() {
    return 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}