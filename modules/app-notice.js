/**
<<<<<<< HEAD
 * app-notice.js - Shared application notice for CasaOS Generator
 */

import { isPersistenceAllowed } from './storage.js';

/**
 * Initialize and show the notice if it hasn't been dismissed or if persistence hasn't been set.
 * @param {string} basePath - Path to the root directory (e.g. '../' from pages/)
 */
export function initAppNotice(basePath = '') {
    const isDismissed = localStorage.getItem('appNoticeDismissed') === 'true';
    const persistenceSet = localStorage.getItem('persistenceAllowed') !== null;

    // Show if not dismissed OR if persistence preference hasn't been explicitly set yet
    if (isDismissed && persistenceSet) return;

    // Create notice element
    const notice = document.createElement('div');
    notice.id = 'appNotice';
    notice.className = 'app-notice';
    notice.style.display = 'flex';

    const privacyLink = basePath + 'docs/privacy-notice.html';

    notice.innerHTML = `
        <div class="app-notice-body">
            <div class="app-notice-head">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; color: #5fe0ff;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Security & Data
            </div>
            <div class="app-notice-msg">
                This tool is 100% client-side. Your data never leaves your device. We use local storage for functional purposes only. <a href="${privacyLink}">Learn more.</a>
                <br><br>
                <strong>No Persistence:</strong> Once you close your browser tab, data in memory is cleared unless you have explicitly allowed localStorage persistence.
            </div>
            <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
                <label class="checkbox-label">
                    <input type="checkbox" id="persistenceToggle" checked>
                    Allow localStorage persistence
                </label>
            </div>
        </div>
        <div class="app-notice-btns">
            <button id="dismissNoticeBtn" class="btn btn-primary" style="width: 100%;">Accept & Close</button>
=======
 * app-notice.js - Centralized consent and privacy notice management.
 *
 * This module ensures users are informed about data storage and provides
 * a way to opt-in to localStorage persistence.
 */

import { getPersistencePreference, setPersistencePreference } from './storage.js';

const DISMISSED_KEY = 'appNoticeDismissed';

/**
 * Initializes the application notice.
 * Should be called on every page.
 */
export function initAppNotice() {
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    const preference = getPersistencePreference();

    // Re-appear if persistence preference is not set (null), even if dismissed previously
    if (isDismissed && preference !== null) {
        return;
    }

    renderNotice(preference);
}

/**
 * Renders the notice into the DOM.
 * @param {boolean|null} preference
 */
function renderNotice(preference) {
    // Avoid duplicate notices
    if (document.getElementById('app-notice')) return;

    const notice = document.createElement('div');
    notice.id = 'app-notice';
    notice.className = 'app-notice';

    // Determine relative path for privacy notice
    const isSubPage = window.location.pathname.includes('/pages/');
    const privacyPath = isSubPage ? '../docs/privacy-notice.html' : 'docs/privacy-notice.html';

    notice.innerHTML = `
        <div class="app-notice-content">
            <div class="app-notice-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; color: #5fe0ff;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Privacy & Data
            </div>
            <div class="app-notice-text">
                100% client-side tool. Your data stays on your device.
                <a href="${privacyPath}">Privacy Policy</a>
            </div>
            <div class="app-notice-options">
                <label class="app-notice-switch">
                    <input type="checkbox" id="persistence-toggle" ${preference === true ? 'checked' : ''}>
                    <span class="app-notice-switch-text">Persistent Session (Save work)</span>
                </label>
            </div>
        </div>
        <div class="app-notice-actions">
            <button id="app-notice-accept" class="btn btn-primary" style="width: 100%;">Accept & Close</button>
>>>>>>> feat/app-notice-persistence-11899867412720330057
        </div>
    `;

    document.body.appendChild(notice);

<<<<<<< HEAD
    const toggle = document.getElementById('persistenceToggle');
    if (toggle) {
        toggle.checked = isPersistenceAllowed() || !persistenceSet; // Default to true if not set
    }

    const dismissBtn = document.getElementById('dismissNoticeBtn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            const persistenceToggle = document.getElementById('persistenceToggle');
            if (persistenceToggle) {
                localStorage.setItem('persistenceAllowed', persistenceToggle.checked);
            }

            notice.style.opacity = '0';
            notice.style.transform = 'translate(-50%, 20px)';
            setTimeout(() => {
                notice.style.display = 'none';
                localStorage.setItem('appNoticeDismissed', 'true');
            }, 300);
        });
    }
=======
    // Force display: flex as per memory guidelines
    setTimeout(() => {
        notice.style.display = 'flex';
    }, 10);

    // Event Listeners
    const acceptBtn = document.getElementById('app-notice-accept');
    const toggle = document.getElementById('persistence-toggle');

    acceptBtn.addEventListener('click', () => {
        const isAllowed = toggle.checked;
        setPersistencePreference(isAllowed);
        localStorage.setItem(DISMISSED_KEY, 'true');
        dismissNotice(notice);
    });
}

/**
 * Dismisses the notice with an animation.
 * @param {HTMLElement} notice
 */
function dismissNotice(notice) {
    notice.style.opacity = '0';
    notice.style.transform = 'translate(-50%, 20px)';
    setTimeout(() => {
        notice.style.display = 'none';
        notice.remove();
    }, 300);
>>>>>>> feat/app-notice-persistence-11899867412720330057
}
