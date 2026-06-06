/**
 * privacy-banner.js - Shared privacy notification for CasaOS Generator
 */

import { isPersistenceAllowed } from './storage.js';

/**
 * Initialize and show the privacy banner if it hasn't been dismissed or if persistence hasn't been set.
 * @param {string} basePath - Path to the root directory (e.g. '../' from pages/)
 */
export function initPrivacyBanner(basePath = '') {
    const isDismissed = localStorage.getItem('privacyBannerDismissed') === 'true';
    const persistenceSet = localStorage.getItem('persistenceAllowed') !== null;

    // Show if not dismissed OR if persistence preference hasn't been explicitly set yet
    if (isDismissed && persistenceSet) return;

    // Create banner element
    const banner = document.createElement('div');
    banner.id = 'privacyBanner';
    banner.className = 'privacy-banner';
    banner.style.display = 'flex';

    const privacyLink = basePath + 'docs/privacy-notice.html';

    banner.innerHTML = `
        <div class="privacy-banner-content">
            <div class="privacy-banner-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; color: #5fe0ff;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Privacy Notice
            </div>
            <div class="privacy-banner-text">
                This tool is 100% client-side. Your data never leaves your device. We use local storage for functional purposes only. <a href="${privacyLink}">Learn more.</a>
            </div>
            <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
                <label class="checkbox-label">
                    <input type="checkbox" id="persistenceToggle" checked>
                    Allow localStorage persistence
                </label>
            </div>
        </div>
        <div class="privacy-banner-actions">
            <button id="dismissPrivacyBtn" class="btn btn-primary" style="width: 100%;">Accept & Close</button>
        </div>
    `;

    document.body.appendChild(banner);

    const toggle = document.getElementById('persistenceToggle');
    if (toggle) {
        toggle.checked = isPersistenceAllowed() || !persistenceSet; // Default to true if not set
    }

    const dismissBtn = document.getElementById('dismissPrivacyBtn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            const persistenceToggle = document.getElementById('persistenceToggle');
            if (persistenceToggle) {
                localStorage.setItem('persistenceAllowed', persistenceToggle.checked);
            }

            banner.style.opacity = '0';
            banner.style.transform = 'translate(-50%, 20px)';
            setTimeout(() => {
                banner.style.display = 'none';
                localStorage.setItem('privacyBannerDismissed', 'true');
            }, 300);
        });
    }
}
