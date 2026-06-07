# CasaOS Generator — Roadmap

> **Project:** Vue 2 + ES6 Modules + localStorage static frontend  
> **Pages:** `index.html` → `generator.html` → `icon.html` → `screenshots.html` → `preview.html`  
> **Modules:** `storage.js`, `yaml-generator.js`, `zip-export.js`, `asset-processor.js`, `ui-utils.js`

---

## Priority Order (Highest First)

| # | Gap | Effort | Impact | Status |
|---|-----|--------|--------|--------|
| 1 | Service-level `x-casaos` blocks missing | Medium | **Critical** — YAML is incomplete without it | ✅ Done |
| 2 | Port/volume description UI fields missing | Medium | Blocks #1 (needs input for descriptions) | ✅ Done |
| 3 | `depends_on` for multi-service apps | Small | Important for multi-service correctness | ❌ Pending |
| 4 | Empty tips produce `null` clutter in YAML | Trivial | Clean output | ✅ Done |
| 5 | Client-side validation missing | Medium | Prevents errors before generation | ❌ Pending |
| 6 | `thumbnail` field hardcoded to `""` | Small | Per spec compliance | ✅ Done |
| 7 | Custom network definitions unsupported | Small | Advanced YAML feature | ❌ Pending |
| 8 | Advanced Docker features (healthcheck, cap_add, devices, logging, limits) | Medium | Power-user features | ❌ Pending |
| 9 | Saved Applications & Application Store Export | High | **Feature** — App lifecycle management, persistence, full-store export | 🔶 Partial |
| 10 | Docker Run/Compose Importer | Medium | **New workflow paradigm** — bi-directional tooling, migration automation | ❌ Pending |

---

## Execution Order (Dependency-Aware)

The tasks should be implemented in this order to respect dependency chains:

1. **Task 7** — Custom Network Definitions (needed by Importer to populate network configs)
2. **Task 8** — Advanced Docker Features (needed by Importer to populate healthcheck, devices, cap_add, logging, limits)
3. **Task 3** — `depends_on` (simple, no dependencies)
4. **Task 5** — Client-Side Validation (independent, valuable before Importer to validate imported data)
5. **Task 10** — Docker Run/Compose Importer (builds on Tasks 7, 8, 5 — new bi-directional workflow)
6. **Task 9** — Saved Applications & Application Store Export (separate feature track, can be parallel)

---

## Task 1 — Service-Level `x-casaos` Blocks

**Status: ✅ Done**

The YAML generator emits `x-casaos` blocks under each service with port/volume descriptions. Implemented in `modules/yaml-generator.js` (lines 99-108) and `pages/generator.html` (description inputs).

---

## Task 2 — Port & Volume Description UI Fields

**Status: ✅ Done**

Each port and volume row has a description input with 200-char max length. Implemented in `pages/generator.html` (lines 279-281, 300-302).

---

## Task 3 — `depends_on` for Multi-Service Apps

**Gap:** When a user creates multiple services (e.g., app + database), there's no way to express that the app depends on the database starting first.

**Effort:** Small | **Status:** ❌ Pending

### 3a. Data model (`pages/generator.html` — Vue `data`)

Add to each service object:

```js
depends_on: []  // array of service names (strings)
```

### 3b. UI input

In the service card (under the service title), add a multi-select if more than one service exists:

```html
<div v-if="multiServices.length > 1" class="form-group">
    <label class="form-label">Depends On (startup order):</label>
    <select v-model="service.depends_on" multiple class="form-input"
            style="min-height:60px;">
        <option v-for="(s, i) in multiServices" :key="i" :value="s.appId"
                v-if="s.appId && s.appId !== service.appId">
            {{ s.appId }}
        </option>
    </select>
</div>
```

### 3c. Generator logic (`modules/yaml-generator.js`)

In the service rendering loop, if `depends_on` has entries, add:

```js
if (service.depends_on && service.depends_on.length) {
    serviceObj.depends_on = service.depends_on;
}
```

**Success criteria:**

- Multi-service form shows a "Depends On" multi-select
- Generated YAML includes `depends_on` array under each service
- Self-references and circular deps are prevented in UI
- Single-service apps are unaffected

---

## Task 4 — Clean Null Tips from YAML Output

**Status: ✅ Done**

Tips are conditionally emitted — disabled tips produce no `tips` key in YAML. Implemented in `modules/yaml-generator.js` (lines 23-29, 49-52).

---

## Task 5 — Client-Side Validation

**Gap:** No validation runs before the YAML is generated. The guide specifies required fields, format rules, and cross-field consistency checks.

**Effort:** Medium | **Status:** ❌ Pending

### 5a. Create `modules/validation.js`

A pure-function module exported from a single file:

```js
export function validateConfig(config) {
    const errors = [];
    const { services, network } = config;
    
    if (!services || services.length === 0) {
        errors.push({ field: 'services', message: 'At least one service is required' });
        return errors;
    }
    
    services.forEach((s, i) => {
        // AppID required: lowercase, hyphens only
        if (!s.appId) errors.push({ field: `service[${i}].appId`, message: 'AppID is required' });
        else if (!/^[a-z0-9-]+$/.test(s.appId))
            errors.push({ field: `service[${i}].appId`, message: 'AppID must be lowercase with hyphens only' });

        // Image required
        if (!s.image) errors.push({ field: `service[${i}].image`, message: 'Docker image is required' });
        else if (!s.image.includes('/'))
            errors.push({ field: `service[${i}].image`, message: 'Image should include namespace (e.g., namespace/image:tag)' });

        // Port checks if bridge mode
        if (network === 'bridge') {
            s.ports.forEach((p, pi) => {
                if (p.target && (p.target < 1 || p.target > 65535))
                    errors.push({ field: `service[${i}].ports[${pi}].target`, message: 'Port target must be 1-65535' });
            });
        }

        // Memory format
        if (s.reservationsMemory && !/^\d+$/.test(s.reservationsMemory))
            errors.push({ field: `service[${i}].reservationsMemory`, message: 'Memory must be a number' });

        // Required root metadata (first service only)
        if (i === 0) {
            if (!s.title?.en_US) errors.push({ field: 'title', message: 'Title is required' });
            if (!s.category) errors.push({ field: 'category', message: 'Category is required' });
            if (!s.architectures?.length) errors.push({ field: 'architectures', message: 'At least one architecture required' });
            if (!s.tagline?.en_US) errors.push({ field: 'tagline', message: 'Tagline is required' });
            if (!s.description?.en_US) errors.push({ field: 'description', message: 'Description is required' });
        }
    });
    
    return errors;
}
```

### 5b. Integrate into Vue form (`pages/generator.html`)

Import in the `<script type="module">` block:

```js
import { validateConfig } from '../modules/validation.js';
```

Add a `validate()` method, call it on changes (or on a "Validate" button), and display errors in the form.

Add a `hasErrors` computed property that disables the "Next" button when validation fails.

**Success criteria:**

- Required fields: `appId`, `image`, `category`, `title`, `tagline`, `description`, `architectures`
- Format checks: appId lowercase, memory is number, ports 1-65535
- Errors displayed inline on the relevant fields
- Next/generate buttons disabled while errors exist
- `validation.js` is a pure ES6 module with no DOM dependencies

---

## Task 6 — Thumbnail URL Field

**Status: ✅ Done**

Text input in CasaOS Metadata section, URL passed through to YAML output. Implemented in `pages/generator.html` (lines 403-407) and `modules/yaml-generator.js` (line 42).

---

## Task 7 — Custom Network Definitions

**Gap:** The guide shows `networks: {}` at the root level for multi-service apps. Currently not supported. With this implemented, the Docker Importer (Task 10) will be able to populate network configs when importing compose files.

**Effort:** Small | **Status:** ❌ Pending

### 7a. Data model (`pages/generator.html`)

Add to Vue data:

```js
customNetworks: ''  // freeform textarea for network definitions
```

### 7b. UI input

A textarea in the generator form (near the Network Mode selector):

```html
<div class="form-group">
    <label class="form-label">Custom Networks (optional, YAML):</label>
    <textarea v-model="customNetworks" class="form-input" rows="3"
              placeholder="frontend-net:&#10;  driver: bridge&#10;backend-net:&#10;  driver: bridge&#10;  internal: true"
              :disabled="multiNetwork === 'host'"></textarea>
    <small class="text-muted">Define custom networks for multi-service apps. Disabled when network is 'host'.</small>
</div>
```

### 7c. Service network binding

Add a network selector per service (only if custom networks are defined):

```html
<div v-if="customNetworks.trim()" class="form-group">
    <label class="form-label">Networks:</label>
    <select v-model="service.networks" multiple class="form-input"
            style="min-height:60px;">
        <option v-for="net in parsedNetworkNames" :key="net" :value="net">{{ net }}</option>
    </select>
</div>
```

Where `parsedNetworkNames` is a computed property that extracts YAML network names from `customNetworks`.

### 7d. Generator logic (`modules/yaml-generator.js`)

At the root level, if `customNetworks` is not empty:

```js
if (customNetworks) {
    try {
        ymlObject.networks = jsyaml.load(customNetworks);
    } catch (e) {
        // Skip if invalid YAML
    }
}
```

Per service, if `service.networks` has entries:

```js
if (service.networks && service.networks.length) {
    serviceObj.networks = service.networks.reduce((acc, n) => {
        acc[n] = {};
        return acc;
    }, {});
}
```

### 7e. Importer dependency note

The Docker Importer (Task 10) will use the same `customNetworks` YAML field to inject parsed network definitions from imported `docker-compose.yml` files, so this must be implemented first.

**Success criteria:**

- Custom networks textarea accepts YAML
- Root-level `networks:` appears in YAML output
- Services can be assigned to specific networks
- Works with bridge mode; disabled for host mode

---

## Task 8 — Advanced Docker Features

**Gap:** `healthcheck`, `cap_add`, `devices`, `logging`, and resource `limits` are not collected. With this implemented, the Docker Importer (Task 10) will be able to populate these advanced fields from imported `docker run` commands and compose files.

**Effort:** Medium | **Status:** ❌ Pending

### 8a. Data model per service

Extend the service object with:

```js
healthcheck: '',
cap_add: [],
devices: [],
logging: '',
memory_limit: '',
cpu_limit: ''
```

### 8b. UI inputs (collapsible section)

Add a "⚙️ Advanced" collapsible section in each service card:

```html
<div class="form-group">
    <button type="button" @click="service.showAdvanced = !service.showAdvanced"
            class="btn btn-ghost btn-sm">
        ⚙️ Advanced {{ service.showAdvanced ? '▲' : '▼' }}
    </button>
    <div v-if="service.showAdvanced" style="margin-top:12px;">

        <!-- Healthcheck -->
        <div class="form-group">
            <label class="form-label">Healthcheck (YAML):</label>
            <textarea v-model="service.healthcheck" class="form-input" rows="3"
                      placeholder="test: ['CMD', 'curl', '-f', 'http://localhost:8080/health']&#10;interval: 30s&#10;timeout: 10s&#10;retries: 3"></textarea>
        </div>

        <!-- Capabilities -->
        <div class="form-group">
            <label class="form-label">Capabilities (cap_add):</label>
            <div class="flex-row">
                <input v-model="service.newCap" class="form-input" placeholder="NET_ADMIN"
                       style="flex:1;" @keypress.enter="addCap(service)">
                <button type="button" @click="addCap(service)" class="btn btn-ghost btn-sm">+</button>
            </div>
            <div v-for="(cap, ci) in service.cap_add" :key="ci" class="panel-item"
                 style="display:flex; justify-content:space-between; align-items:center;">
                <code>{{ cap }}</code>
                <button type="button" @click="service.cap_add.splice(ci,1)" class="btn btn-danger btn-icon">×</button>
            </div>
        </div>

        <!-- Devices -->
        <div class="form-group">
            <label class="form-label">Devices:</label>
            <div class="flex-row">
                <input v-model="service.deviceHost" class="form-input" placeholder="/dev/dri"
                       style="flex:1;">
                <input v-model="service.deviceContainer" class="form-input" placeholder="/dev/dri"
                       style="flex:1;">
                <button type="button" @click="addDevice(service)" class="btn btn-ghost btn-sm">+</button>
            </div>
            <div v-for="(dev, di) in service.devices" :key="di" class="panel-item"
                 style="display:flex; justify-content:space-between; align-items:center;">
                <code>{{ dev }}</code>
                <button type="button" @click="service.devices.splice(di,1)" class="btn btn-danger btn-icon">×</button>
            </div>
        </div>

        <!-- Logging -->
        <div class="form-group">
            <label class="form-label">Logging (YAML):</label>
            <textarea v-model="service.logging" class="form-input" rows="2"
                      placeholder="driver: json-file&#10;options:&#10;  max-size: 10m&#10;  max-file: 3"></textarea>
        </div>

        <!-- Resource Limits -->
        <div class="form-group">
            <label class="form-label">Memory Limit (MB, optional):</label>
            <input v-model="service.memory_limit" type="number" class="form-input"
                   placeholder="e.g., 1024">
        </div>
        <div class="form-group">
            <label class="form-label">CPU Limit (cores, optional):</label>
            <input v-model="service.cpu_limit" class="form-input" placeholder="e.g., 2.0">
        </div>

    </div>
</div>
```

### 8c. Generator logic (`modules/yaml-generator.js`)

After the existing service fields, conditionally add:

```js
// Healthcheck
if (service.healthcheck?.trim()) {
    try { serviceObj.healthcheck = jsyaml.load(service.healthcheck); } catch (e) {}
}

// Capabilities
if (service.cap_add?.length) {
    serviceObj.cap_add = service.cap_add;
}

// Devices
if (service.devices?.length) {
    serviceObj.devices = service.devices.map(d => d);
}

// Logging
if (service.logging?.trim()) {
    try { serviceObj.logging = jsyaml.load(service.logging); } catch (e) {}
}

// Resource limits
if (service.memory_limit || service.cpu_limit) {
    if (!serviceObj.deploy.resources.limits) serviceObj.deploy.resources.limits = {};
    if (service.memory_limit) serviceObj.deploy.resources.limits.memory = `${service.memory_limit}M`;
    if (service.cpu_limit) serviceObj.deploy.resources.limits.cpus = service.cpu_limit;
}
```

### 8d. Helper methods in Vue

```js
addCap(service) {
    if (service.newCap?.trim()) {
        service.cap_add.push(service.newCap.trim().toUpperCase());
        service.newCap = '';
    }
},
addDevice(service) {
    if (service.deviceHost?.trim()) {
        const devStr = service.deviceContainer
            ? `${service.deviceHost.trim()}:${service.deviceContainer.trim()}`
            : service.deviceHost.trim();
        service.devices.push(devStr);
        service.deviceHost = '';
        service.deviceContainer = '';
    }
}
```

### 8e. Update `addMultiService()` defaults

Include the new fields in the default service object:

```js
showAdvanced: false,
healthcheck: '',
cap_add: [],
newCap: '',
devices: [],
deviceHost: '',
deviceContainer: '',
logging: '',
memory_limit: '',
cpu_limit: ''
```

**Success criteria:**

- "Advanced" collapsible section in each service card
- Healthcheck, cap_add, devices, logging, and resource limits are collected
- Generated YAML includes these fields when present
- YAML freeform fields parsed via `jsyaml.load()`
- Existing single-service apps unaffected when advanced fields are empty

---

## Task 9 — Saved Applications & Application Store Export

**Gap:** The app is a single-shot generator — users create YAML, download it, and have no way to revisit, edit, or manage their applications. There's no persistence lifecycle.

**Effort:** High | **Status:** 🔶 Partial (module stubs exist)

**Feature:** Saved Applications management with a dedicated page, a purpose-built editor for tweaking saved apps, and an "Application Store Export" system that bundles all saved apps into a ready-to-use CasaOS app store.

### What needs to change:

### 9a. Create `modules/saved-apps.js`

A new ES6 module that handles all CRUD operations for saved applications in localStorage.

### 9b. Create `pages/applications.html`

A new page that displays saved applications in a grid or list view (toggleable). Features:
- **Header:** "Saved Applications" title with a "Back to Generator" link
- **View toggle:** Grid/List toggle buttons
- **Starred row:** Horizontally scrollable row of starred apps at the top, with blue circular left/right arrow buttons for smooth scrolling
- **Card entries:** Each app displayed as a card with action buttons: **Remove**, **Edit**, **Star**
- **Export All button:** Triggers a zip download of all apps as directories
- **Export modal:** Simple modal explaining the exported zip can be uploaded to GitHub as a CasaOS app store

### 9c. Create `pages/editor.html`

A purpose-built single-page editor for modifying saved applications, loaded by ID from query params.

### 9d. Extend `modules/zip-export.js`

Add `exportAllApps()` function that bundles all saved apps into a zip with `docker-compose.yml`, `icon.png`, and `screenshots/`.

### 9e. Update header on all pages

Add "📁 Saved" navigation link to every page header.

### 9f. Update `css/base.css`

Add styles for: `.saved-apps-grid`, `.saved-apps-list`, `.app-card`, `.starred-row`, `.star-scroll-btn`, `.app-card-actions`, `.export-modal`, `.view-toggle`.

### 9g. Update documentation

- **`PROJECT.md`** — Add "Saved Applications" and "Application Store Export" to features list
- **`README.md`** — Add to feature highlights with brief description

### Architecture notes

- **State ownership:** Saved apps live in localStorage under `casaos_saved_apps` key
- **Feedback:** Toast notifications on save/delete/export
- **Blast radius:** Zero — all new files, header changes only touch existing pages
- **Timing:** All synchronous localStorage operations; Export All is async (JSZip)

### Future expansion (post-MVP)

- **Application Store Export Wizard:** A guided step-by-step wizard that generates proper CasaOS store metadata (store.json, category definitions)
- **Import:** Allow users to import applications from a saved JSON/zip file
- **Cloud sync:** Optional sync to GitHub Gist or similar

**Success criteria:**

- Users can save applications from the generator
- Saved apps appear in `applications.html` as cards in grid/list view
- Starred apps appear in a horizontal scrollable row at the top
- Clicking Edit opens `editor.html` with the app pre-populated
- Clicking Export All downloads a zip with each app in its own directory
- Export modal explains the zip can be used as a CasaOS store
- All header navigation includes the "Saved Applications" link

---

## Task 10 — Docker Run/Compose Importer

**Gap:** The wiki's "Migration Patterns" section documents the *manual* process for converting `docker run` commands to CasaOS YAML, but there's no automated tooling. Users must manually map flags to form fields. This is a new workflow paradigm — the tool is currently "create from scratch" only; import makes it bi-directional.

**Effort:** Medium | **Status:** ❌ Pending

**Dependencies:** Requires Tasks 7 (Custom Networks) and 8 (Advanced Docker Features) — otherwise the importer can't populate network configs, healthcheck, devices, or capabilities.

**Design: Import Modal** (not a separate page) — a modal triggered from a button on `generator.html`. Two tabs:

```
┌─────────────────────────────────────────────────┐
│  📥 Import from Docker Run / Compose             │
│                                                   │
│  ┌──────────────┬──────────────┐                  │
│  │ 🐳 docker run │ 📋 Compose   │  ← Tab Buttons  │
│  └──────────────┴──────────────┘                  │
│                                                   │
│  [Tab Content — see below]                        │
│                                                   │
│  [Cancel]  [Import]                               │
└─────────────────────────────────────────────────┘
```

### 10a. Create `modules/docker-importer.js`

A new ES6 module with two export functions:

```js
/**
 * Parse a `docker run` command into generator service config.
 * @param {string} cmd - The raw docker run command string
 * @returns {Object|null} Partial service config object, or null if unparseable
 */
export function parseDockerRun(cmd) { }

/**
 * Parse a docker-compose YAML string into generator multi-service config.
 * @param {string} yamlStr - Raw docker-compose YAML
 * @returns {Array|null} Array of service config objects, or null if unparseable
 */
export function parseDockerCompose(yamlStr) { }
```

#### `parseDockerRun()` — Flag Mapping

Parse the following `docker run` flags:

| `docker run` flag | Generator field |
|---|---|
| `--name` | `service.appId` + `container_name` |
| `IMAGE` (positional) | `service.image` |
| `-p HOST:CONTAINER/PROTO` | `service.ports[]` |
| `-v HOST:CONTAINER` | `service.volumes[]` (bind type) |
| `-e KEY=VALUE` | `service.environment[]` |
| `--network` | `service.network_mode` (bridge/host) |
| `--restart` | Map to `restart` field |
| `--device HOST:CONTAINER` | `service.devices[]` |
| `--cap-add CAP` | `service.cap_add[]` |
| `--memory LIMIT` | `service.memory_limit` |
| `--cpus CPUS` | `service.cpu_limit` |
| `--health-cmd`, `--health-interval`, etc. | `service.healthcheck` (build YAML block) |
| `--log-driver`, `--log-opt` | `service.logging` (build YAML block) |

#### `parseDockerCompose()` — YAML Mapping

Parse a standard docker-compose YAML into the generator's data model:

| Compose field | Generator field |
|---|---|
| `services.<name>.image` | `service.image` |
| `services.<name>.ports[]` | `service.ports[]` (convert short to long syntax) |
| `services.<name>.volumes[]` | `service.volumes[]` (convert short to long syntax) |
| `services.<name>.environment` | `service.environment[]` |
| `services.<name>.depends_on` | `service.depends_on` |
| `services.<name>.healthcheck` | `service.healthcheck` (serialize to YAML) |
| `services.<name>.cap_add` | `service.cap_add[]` |
| `services.<name>.devices[]` | `service.devices[]` |
| `services.<name>.logging` | `service.logging` (serialize to YAML) |
| `services.<name>.deploy.resources.limits.memory` | `service.memory_limit` (strip suffix) |
| `services.<name>.deploy.resources.limits.cpus` | `service.cpu_limit` |
| `services.<name>.networks` | `service.networks[]` |
| `networks` (root) | `customNetworks` (serialize to YAML string) |
| `services.<name>.container_name` | Generate `appId` from name or image |
| `services.<name>.command` | `service.command` |

### 10b. Add Import Modal to `pages/generator.html`

Place the modal markup at the bottom of the generator form section:

```html
<!-- Import Modal -->
<div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
    <div class="modal-content" style="max-width:700px;">
        <div class="modal-header">
            <h3>📥 Import from Docker Run / Compose</h3>
            <button type="button" @click="showImportModal = false" class="btn btn-icon">×</button>
        </div>

        <div class="tab-bar">
            <button :class="['tab-btn', { active: importTab === 'docker-run' }]"
                    @click="importTab = 'docker-run'">🐳 docker run</button>
            <button :class="['tab-btn', { active: importTab === 'compose' }]"
                    @click="importTab = 'compose'">📋 docker-compose.yml</button>
        </div>

        <!-- docker run tab -->
        <div v-if="importTab === 'docker-run'" class="tab-content">
            <div class="form-group">
                <label class="form-label">Paste your docker run command:</label>
                <textarea v-model="importRunCommand" class="form-input" rows="6"
                          placeholder="docker run -d --name=jellyfin -p 8096:8096 -v /path:/config jellyfin/jellyfin:latest"></textarea>
            </div>
        </div>

        <!-- Compose tab -->
        <div v-if="importTab === 'compose'" class="tab-content">
            <div class="form-group">
                <label class="form-label">Paste your docker-compose.yml:</label>
                <textarea v-model="importComposeYaml" class="form-input" rows="6"
                          placeholder="version: '3'&#10;services:&#10;  app:&#10;    image: myapp:latest&#10;    ports: ..."></textarea>
            </div>
        </div>

        <div v-if="importErrors.length" class="warning-box">
            <div v-for="err in importErrors" class="text-warning">{{ err }}</div>
        </div>

        <div class="modal-actions">
            <button type="button" @click="showImportModal = false" class="btn btn-ghost">Cancel</button>
            <button type="button" @click="executeImport()" class="btn btn-primary">Import</button>
        </div>
    </div>
</div>
```

### 10c. Add to Vue data

```js
showImportModal: false,
importTab: 'docker-run',
importRunCommand: '',
importComposeYaml: '',
importErrors: []
```

### 10d. Add import button to generator UI

Near the "Services" section header, add:

```html
<button type="button" @click="showImportModal = true" class="btn btn-ghost btn-sm">
    📥 Import
</button>
```

### 10e. Add `executeImport()` method to Vue

```js
executeImport() {
    this.importErrors = [];
    let result = null;

    if (this.importTab === 'docker-run') {
        if (!this.importRunCommand.trim()) {
            this.importErrors.push('Please paste a docker run command.');
            return;
        }
        result = parseDockerRun(this.importRunCommand.trim());
        if (result) {
            // Merge into first service (or create one)
            if (this.multiServices.length === 0 || !this.multiServices[0].image) {
                this.multiServices = [result];
            } else {
                // If first service already has data, add as additional service
                this.multiServices.push(result);
            }
        }
    } else if (this.importTab === 'compose') {
        if (!this.importComposeYaml.trim()) {
            this.importErrors.push('Please paste a docker-compose YAML.');
            return;
        }
        result = parseDockerCompose(this.importComposeYaml.trim());
        if (result && result.length) {
            this.multiServices = result;
        }
    }

    if (!result) {
        this.importErrors.push('Could not parse the input. Check the format and try again.');
        return;
    }

    this.showImportModal = false;
    this.importRunCommand = '';
    this.importComposeYaml = '';
    this.generateMultiCompose();
    this.autoSave();
}
```

### 10f. Update `css/base.css`

Add styles for:
- `.modal-overlay` — full-screen semi-transparent backdrop
- `.modal-content` — centered modal panel
- `.modal-header` — title + close button row
- `.tab-bar` / `.tab-btn` / `.tab-btn.active` — tab navigation
- `.tab-content` — tab body panels
- `.modal-actions` — button row at bottom

### 10g. Importer test cases

**`docker run` examples to parse correctly:**

```bash
# Basic
docker run -d --name=jellyfin -p 8096:8096 -v /config:/config jellyfin/jellyfin:latest

# With advanced features
docker run -d --name=vpn-app --cap-add=NET_ADMIN --device=/dev/tun:/dev/tun --memory=512m alpine:latest

# Complex
docker run -d --name=app -p 8080:80 -p 8443:443 -e DB_HOST=db -e DB_PORT=5432 -v /data:/data --restart=unless-stopped --network=bridge nginx:latest
```

**Compose YAML examples to parse correctly:**

```yaml
version: '3'
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 10s
```

**Success criteria:**

- Import button visible on the generator page
- Modal opens with two tabs: "docker run" and "docker-compose.yml"
- `docker run` flags are parsed into generator service fields
- Compose YAML services are parsed into generator multi-service data model
- Advanced fields (devices, cap_add, healthcheck, logging, limits, networks) are populated
- Imported data populates the generator form and YAML preview updates
- Error message displayed if parsing fails
- Modal closes on successful import
- No new pages — import lives entirely in the modal
- Module is a pure ES6 module with no DOM dependencies

---

## Summary of Files That Need Changes

| File | Tasks |
|------|-------|
| `modules/yaml-generator.js` | 3, 7, 8 |
| `modules/validation.js` (new) | 5 |
| `modules/docker-importer.js` (new) | 10 |
| `modules/saved-apps.js` (new) | 9 |
| `modules/zip-export.js` | 9 (extend) |
| `pages/generator.html` | 3, 5, 7, 8, 10 |
| `pages/applications.html` (new) | 9 |
| `pages/editor.html` (new) | 9 |
| `index.html` | 9 (header button) |
| `pages/download.html` | 9 (header button) |
| `pages/icon.html` | 9 (header button) |
| `pages/screenshots.html` | 9 (header button) |
| `pages/preview.html` | 9 (header button) |
| `css/base.css` | 7, 8, 9, 10 (modal styles, advanced section, cards, tabs) |
| `PROJECT.md` | 9, 10 (feature descriptions) |
| `README.md` | 9, 10 (feature highlights) |