/**
 * ui-utils.js - Shared UI helpers for CasaOS Generator
 */

/**
 * Format a byte count into a human-readable string.
 * @param {number} bytes
 * @returns {string} e.g. "1.23 KB"
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Temporarily show a success message on a button element.
 * Restores the original text after 2 seconds.
 * @param {HTMLElement} element - The button or element to show feedback on
 * @param {string} message - The success message to display
 */
export function showSuccessFeedback(element, message) {
    if (!element) return;
    const originalText = element.innerHTML || element.textContent;
    element.innerHTML = '✅ ' + message;
    if (element.style) {
        element.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    }
    setTimeout(() => {
        element.innerHTML = originalText;
        if (element.style) {
            element.style.background = '';
        }
    }, 2000);
}