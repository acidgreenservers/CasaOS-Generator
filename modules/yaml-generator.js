/**
 * yaml-generator.js - CasaOS docker-compose.yml YAML builder
 * 
 * Builds the full YAML object structure and serializes it using jsyaml.
 * Requires `jsyaml` to be loaded globally via CDN before this module is used.
 */

/**
 * Build a docker-compose YAML object from the form state.
 * @param {Array} services - Array of service objects from the generator form
 * @param {string} network - Network mode ('bridge' | 'host')
 * @param {Object|null} assets - Assets object from storage.js getAssets()
 * @returns {Object} YAML-compatible plain object
 */
export function buildYamlObject(services, network, assets) {
    if (!services || !services.length || !services[0].appId || !services[0].image) {
        return null;
    }

    const firstService = services[0];

    const ymlObject = {
        name: firstService.appId,
        services: {},
        'x-casaos': {
            architectures: firstService.architectures || [],
            title: { en_US: firstService.title?.en_US || '' },
            store_app_id: firstService.appId,
            main: firstService.appId,
            category: firstService.category || '',
            developer: firstService.developer || '',
            author: firstService.author || '',
            port_map: firstService.portMap || '',
            scheme: firstService.scheme || 'http',
            icon: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${firstService.appId}.png`,
            thumbnail: '',
            screenshot_link: (assets?.screenshots || []).map((_, idx) => `screenshot-${idx + 1}.png`),
            tagline: { en_US: firstService.tagline?.en_US || '' },
            description: { en_US: (firstService.description?.en_US || '') + '\n' },
            tips: {
                before_install: firstService.tips?.enable_before_install
                    ? { en_US: (firstService.tips.before_install?.en_US || '') + '\n' }
                    : null,
                custom: firstService.tips?.enable_custom
                    ? { en_US: (firstService.tips.custom?.en_US || '') + '\n' }
                    : null,
            },
            index: firstService.index || '/',
        },
    };

    // Add all services
    services.forEach((service) => {
        if (!service.appId || !service.image) return;

        ymlObject.services[service.appId] = {
            container_name: service.appId,
            image: service.image,
            command: service.command || undefined,
            deploy: {
                resources: {
                    reservations: {
                        memory: service.reservationsMemory ? `${service.reservationsMemory}M` : '0M',
                    },
                },
            },
            restart: 'unless-stopped',
            environment: service.environment
                .filter((env) => env.key && env.value)
                .reduce((acc, env) => {
                    acc[env.key] = env.value;
                    return acc;
                }, {}),
            volumes: service.volumes
                .filter((vol) => vol.type && vol.source && vol.target)
                .map((vol) => ({
                    type: vol.type,
                    source: vol.source,
                    target: vol.target,
                })),
            ports: service.ports
                .filter((port) => port.target && port.published && port.protocol)
                .map((port) => ({
                    target: parseInt(port.target, 10),
                    published: port.published,
                    protocol: port.protocol,
                })),
            network_mode: network,
        };
    });

    return ymlObject;
}

/**
 * Generate a YAML string from the form state.
 * @param {Array} services
 * @param {string} network
 * @param {Object|null} assets
 * @returns {string} The serialized YAML string
 */
export function generateYamlString(services, network, assets) {
    const ymlObject = buildYamlObject(services, network, assets);

    if (!ymlObject) {
        return '# Please fill in AppID and Docker Image to generate YAML...\n# Required fields: AppID, Docker Image';
    }

    try {
        if (typeof jsyaml === 'undefined') {
            return '# Error: jsyaml library not loaded';
        }
        let yamlStr = jsyaml.dump(ymlObject, { lineWidth: -1 });
        yamlStr = yamlStr.replace(/\|[\+\-]/g, '|');
        return yamlStr;
    } catch (error) {
        console.error('Error generating YAML:', error);
        return '# Error generating YAML: ' + error.message;
    }
}