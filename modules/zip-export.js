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

/**
 * Export all saved applications as a single ZIP archive.
 * Each app gets its own top-level directory with docker-compose.yml, icon, and screenshots.
 * @param {Array} apps - Array of saved application objects from saved-apps.js
 * @returns {Promise<void>} Triggers a browser download
 */
export async function exportAllApps(apps) {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
    }

    const zip = new JSZip();
    let appCount = 0;

    for (const app of apps) {
        if (!app.appId) continue;

        const folder = zip.folder(app.appId);
        appCount++;

        // Build docker-compose.yml from saved config
        const services = [{
            appId: app.appId,
            image: app.image || '',
            title: app.title || { en_US: '' },
            tagline: app.tagline || { en_US: '' },
            description: app.description || { en_US: '' },
            category: app.category || '',
            developer: app.developer || '',
            author: app.author || app.developer || '',
            architectures: app.architectures || [],
            reservationsMemory: app.reservationsMemory || '',
            index: app.index || '/',
            scheme: app.scheme || 'http',
            thumbnail: '',
            ports: (app.ports || []).filter(p => p.target && p.published),
            volumes: (app.volumes || []).filter(v => v.source && v.target),
            environment: (app.environment || []).filter(e => e.key),
            tips: { enable_before_install: false, enable_custom: false },
        }];

        const assets = {
            icons: app.iconData ? [{ data: app.iconData }] : [],
            screenshots: (app.screenshots || []).map(s => ({ data: s.data })),
        };

        const { generateYamlString } = await import('./yaml-generator.js');
        const yaml = generateYamlString(services, 'bridge', assets);
        folder.file('docker-compose.yml', yaml);

        // Add icon if available
        if (app.iconData) {
            const iconBase64 = app.iconData.split(',')[1];
            if (iconBase64) {
                folder.file('icon.png', iconBase64, { base64: true });
            }
        }

        // Add screenshots
        if (app.screenshots && app.screenshots.length > 0) {
            const screenshotsFolder = folder.folder('screenshots');
            app.screenshots.forEach((s, i) => {
                const ext = (s.name || '').split('.').pop() || 'png';
                const data = s.data.split(',')[1];
                if (data) {
                    screenshotsFolder.file(`screenshot-${i + 1}.${ext}`, data, { base64: true });
                }
            });
        }
    }

    if (appCount === 0) {
        throw new Error('No valid applications to export');
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, 'casaos-app-store.zip');
}
