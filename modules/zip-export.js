/**
 * zip-export.js - ZIP package creation for CasaOS Generator
 * 
 * Creates a downloadable ZIP containing docker-compose.yml, icon, and screenshots.
 * Requires `JSZip` to be loaded globally via CDN before this module is used.
 */

/**
 * Create a ZIP blob containing the full CasaOS app package.
 * @param {string} yamlContent - The docker-compose.yml content
 * @param {Object} assets - Assets object from storage.js getAssets()
 * @param {string} appId - The app ID used for the filename
 * @returns {Promise<Blob>} The generated ZIP blob
 */
export async function createAppZip(yamlContent, assets, appId) {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
    }

    const zip = new JSZip();

    // Add docker-compose.yml
    zip.file('docker-compose.yml', yamlContent);

    // Add icon if available
    if (assets.icons && assets.icons.length > 0) {
        const iconData = assets.icons[0].data;
        const iconBase64 = iconData.split(',')[1];
        zip.file('icon.png', iconBase64, { base64: true });
    }

    // Add screenshots if available
    if (assets.screenshots && assets.screenshots.length > 0) {
        assets.screenshots.forEach((screenshot, index) => {
            const screenshotData = screenshot.data;
            const screenshotBase64 = screenshotData.split(',')[1];
            zip.file(`screenshot-${index + 1}.png`, screenshotBase64, { base64: true });
        });
    }

    return zip.generateAsync({ type: 'blob' });
}

/**
 * Trigger a browser download of a blob.
 * @param {Blob} blob - The data to download
 * @param {string} filename - The filename for the download
 */
export function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}