# CasaOS Generator — Roadmap

> **Project:** Vue 2 + ES6 Modules + localStorage static frontend  
> **Pages:** `index.html` → `generator.html` → `icon.html` → `screenshots.html` → `preview.html`  
> **Modules:** `storage.js`, `yaml-generator.js`, `zip-export.js`, `asset-processor.js`, `ui-utils.js`

---

## Priority Order (Highest First)

| # | Gap | Effort | Impact |
|---|-----|--------|--------|
| 1 | Service-level `x-casaos` blocks missing | Medium | **Critical** — YAML is incomplete without it |
| 2 | Port/volume description UI fields missing | Medium | Blocks #1 (needs input for descriptions) |
| 3 | `depends_on` for multi-service apps | Small | Important for multi-service correctness |
| 4 | Empty tips produce `null` clutter in YAML | Trivial | Clean output |
| 5 | Client-side validation missing | Medium | Prevents errors before generation |
| 6 | `thumbnail` field hardcoded to `""` | Small | Per spec compliance |
| 7 | Custom network definitions unsupported | Small | Advanced YAML feature |
| 8 | Advanced Docker features (healthcheck, cap_add, devices, logging, limits) | Medium | Power-user features |
| 9 | Saved Applications & Application Store Export | High | **Feature** — App lifecycle management, persistence, full-store export |

---

## Task 1 — Service-Level `x-casaos` Blocks

**Gap:** The YAML generator emits ports and volumes at the service level, but never emits the accompanying `x-casaos` block that describes them. The CasaOS spec requires this for the UI to show meaningful port/volume descriptions.

**What needs to change:**

### 1a. Data model (`pages/generator.html` — Vue `data`)

Each port and volume object needs a `description` field:

```js
// Ports currently: { target: '', published: '', protocol: 'tcp' }
// Need to become:  { target: '', published: '', protocol: 'tcp', description: '' }

// Volumes currently: { type: 'bind', source: '', target: '' }
// Need to become:    { type: 'bind', source: '', target: '', description: '' }
```

Update the default empty objects in `addMultiPort()`, `addMultiVolume()`, and the initial `multiServices[0]` data.

### 1b. UI inputs (`pages/generator.html` — Vue template)

Add a `<input>` or `<textarea>` for description in each port and volume row:

```
[Ports section — currently: target | published | protocol | remove]
[Add: description input below or inline]

[Volumes section — currently: type | source | target | remove]
[Add: description input below or inline]
```

### 1c. Generator logic (`modules/yaml-generator.js`)

In the service rendering loop (around line 56-90), add an `x-casaos` block under each service:

```js
serviceObj['x-casaos'] = {
    ports: service.ports
        .filter(p => p.target && p.published && p.protocol)
        .map(p => ({
            container: String(p.target),
            description: { en_us: p.description || `Port ${p.target}` }
        })),
    volumes: service.volumes
        .filter(v => v.type && v.source && v.target)
        .map(v => ({
            container: v.target,
            description: { en_us: v.description || `Volume at ${v.target}` }
        }))
};
```

**Fallback:** If `description` is empty, use `"Port {target}"` or `"Volume {target}"`.

**Success criteria:**

- Generated YAML includes `x-casaos` block under each service
- Each port entry has `container` (string) and `description.en_us` (string)
- Each volume entry has `container` and `description.en_us`
- Empty descriptions get a sensible fallback
- Multi-service apps each get their own independent `x-casaos` block

---

## Task 2 — Port & Volume Description UI Fields

**Gap:** The generator has no text fields for users to describe what each port or volume does.

**What needs to change:**

### 2a. Port row UI (`pages/generator.html`)

After the existing port inputs (target, published, protocol), add:

```html
<input v-model="port.description" class="form-input"
       placeholder="e.g., WebUI HTTP port" style="width:100%; margin-top:4px;">
```

### 2b. Volume row UI

After the existing volume inputs (type, source, target), add:

```html
<input v-model="volume.description" class="form-input"
       placeholder="e.g., Configuration directory" style="width:100%; margin-top:4px;">
```

### 2c. Max length

Enforce 200 chars on these fields (add `maxlength="200"`).

**Success criteria:**

- Each port row has a "Description" text field
- Each volume row has a "Description" text field
- Input is saved into the port/volume data object
- 200-char max enforced client-side

---

## Task 3 — `depends_on` for Multi-Service Apps

**Gap:** When a user creates multiple services (e.g., app + database), there's no way to express that the app depends on the database starting first.

**What needs to change:**

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

**Gap:** When tips are disabled, the YAML still contains `tips: { before_install: null, custom: null }`.

**What needs to change:**

### 4a. Generator logic (`modules/yaml-generator.js` — around line 40-47)

Replace the current unconditional tips block with conditional emission:

```js
// Build tips only if at least one tip is enabled and has content
const tips = {};
if (firstService.tips?.enable_before_install && firstService.tips.before_install?.en_US) {
    tips.before_install = { en_us: firstService.tips.before_install.en_US + '\n' };
}
if (firstService.tips?.enable_custom && firstService.tips.custom?.en_US) {
    tips.custom = { en_us: firstService.tips.custom.en_US + '\n' };
}
if (Object.keys(tips).length > 0) {
    ymlObject['x-casaos'].tips = tips;
}
```

**Success criteria:**

- Tips disabled → no `tips` key in YAML at all
- One tip enabled → only that tip field appears
- Both enabled → both appear
- No `null` values anywhere in YAML output

---

## Task 5 — Client-Side Validation

**Gap:** No validation runs before the YAML is generated. The guide specifies required fields, format rules, and cross-field consistency checks.

**What needs to change:**

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

**Gap:** The `thumbnail` field is hardcoded to `""`. The spec says it's optional but should be a URL.

**What needs to change:**

### 6a. UI input (`pages/generator.html` — CasaOS Metadata section)

Add a text input:

```html
<div class="form-group">
    <label class="form-label">Thumbnail URL (optional):</label>
    <input v-model="multiServices[0].thumbnail" class="form-input"
           placeholder="https://example.com/thumbnail.png">
    <small class="text-muted">Optional larger preview image URL</small>
</div>
```

### 6b. Data model

Add `thumbnail: ''` to the default service object in Vue data.

### 6c. Generator logic (`modules/yaml-generator.js`)

Replace:

```js
thumbnail: '',
```

With:

```js
thumbnail: firstService.thumbnail || '',
```

**Success criteria:**

- Text input appears in CasaOS Metadata section
- URL value is passed through to YAML output
- Empty = `""` in YAML (unchanged behavior)

---

## Task 7 — Custom Network Definitions

**Gap:** The guide shows `networks: {}` at the root level for multi-service apps. Currently not supported.

**What needs to change:**

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

**Success criteria:**

- Custom networks textarea accepts YAML
- Root-level `networks:` appears in YAML output
- Services can be assigned to specific networks
- Works with bridge mode; disabled for host mode

---

## Task 8 — Advanced Docker Features

**Gap:** `healthcheck`, `cap_add`, `devices`, `logging`, and resource `limits` are not collected.

**What needs to change:**

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
    serviceObj.devices = service.devices.map(d => d);  // already array of strings
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

**Feature:** Saved Applications management with a dedicated page, a purpose-built editor for tweaking saved apps, and an "Application Store Export" system that bundles all saved apps into a ready-to-use CasaOS app store.

### What needs to change:

### 9a. Create `modules/saved-apps.js`

A new ES6 module that handles all CRUD operations for saved applications in localStorage:

```js
const STORAGE_KEY = 'casaos_saved_apps';

export function saveApp(config) {
    const apps = loadApps();
    const idx = apps.findIndex(a => a.id === config.id);
    if (idx >= 0) apps[idx] = { ...config, updatedAt: Date.now() };
    else apps.push({ ...config, id: generateId(), createdAt: Date.now(), updatedAt: Date.now(), starred: false });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return apps;
}

export function loadApps() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}

export function deleteApp(id) {
    const apps = loadApps().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return apps;
}

export function toggleStar(id) {
    const apps = loadApps();
    const app = apps.find(a => a.id === id);
    if (app) app.starred = !app.starred;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    return apps;
}

export function getApp(id) {
    return loadApps().find(a => a.id === id) || null;
}

function generateId() {
    return 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}
```

### 9b. Create `pages/applications.html`

A new page that displays saved applications in a grid or list view (toggleable). Features:

- **Header:** "Saved Applications" title with a "Back to Generator" link
- **View toggle:** Grid/List toggle buttons
- **Starred row:** Horizontally scrollable row of starred apps at the top, with blue circular left/right arrow buttons for smooth scrolling
- **Card entries:** Each app displayed as a card with:
  - App title, tagline, category
  - Icon thumbnail (if available)
  - Action buttons: **Remove** (delete), **Edit** (navigate to editor), **Star** (toggle pin)
- **Export All button:** Triggers a zip download of all apps as directories
- **Export modal:** Simple modal explaining the exported zip can be uploaded to GitHub and used as a CasaOS app store right away

### 9c. Create `pages/editor.html`

A purpose-built single-page editor for modifying saved applications:

- Loads an app by ID from query params
- Single page layout (not stepped wizard) with all fields visible:
  - AppID, Title, Tagline, Description, Category, Developer, URL
  - Architecture selectors
  - Ports, Volumes, Environment variables management
  - Icon upload/replacement
  - Screenshots gallery management
  - YAML code preview block (reuses step 1's code block style)
- Modals for icon and screenshot management
- "Save" button writes back to localStorage → navigates back to `applications.html`
- "Back" button navigates back without saving

### 9d. Extend `modules/zip-export.js`

Add `exportAllApps()` function:

```js
export async function exportAllApps(apps) {
    const zip = new JSZip();
    
    for (const app of apps) {
        if (!app.appId) continue;
        const folder = zip.folder(app.appId);
        
        // Add docker-compose.yml
        const yaml = generateYamlFromConfig(app);
        folder.file('docker-compose.yml', yaml);
        
        // Add icon if available
        if (app.iconData) {
            folder.file('icon.png', app.iconData, { base64: true });
        }
        
        // Add screenshots
        if (app.screenshots?.length) {
            const screenshotsFolder = folder.folder('screenshots');
            app.screenshots.forEach((s, i) => {
                const ext = s.name?.split('.').pop() || 'png';
                screenshotsFolder.file(`screenshot-${i + 1}.${ext}`, s.data, { base64: true });
            });
        }
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'casaos-app-store.zip');
}
```

### 9e. Update header on all pages

Add "Saved Applications" button to the navigation header on every page (`index.html`, `generator.html`, `icon.html`, `screenshots.html`, `preview.html`, `download.html`):

```html
<a href="applications.html" class="btn btn-ghost">Saved Applications</a>
```

Placed just before the "Start Generating" button.

### 9f. Update `css/base.css`

Add new styles for:
- `.saved-apps-grid` / `.saved-apps-list` — grid and list layout containers
- `.app-card` — individual card styling
- `.starred-row` — horizontal scrolling container for starred apps
- `.star-scroll-btn` — blue circular arrow buttons
- `.app-card-actions` — Remove, Edit, Star button row
- `.export-modal` — modal overlay for export explanation
- `.view-toggle` — grid/list toggle button group

### 9g. Update `modules/storage.js`

If needed, add a convenience method that wraps `saved-apps.js` save on the current generator config, so the "Save" button in the generator can call it directly.

### 9h. Update documentation

- **`PROJECT.md`** — Add "Saved Applications" and "Application Store Export" to features list
- **`README.md`** — Add to feature highlights with brief description

### Architecture notes

- **State ownership:** Saved apps live in localStorage under `casaos_saved_apps` key. Each app entry is a full config snapshot (all service data, metadata, icon as base64, screenshots as base64).
- **Feedback:** Toast notifications on save/delete/export. Starred state visually reflects immediately. Export provides download feedback with browser download.
- **Blast radius:** Zero. All new files, no modifications to existing page logic. Only header changes touch existing pages (and those are DOM additions, not logic changes).
- **Timing:** All synchronous localStorage operations. Export All is async (JSZip) but non-blocking.

### Future expansion (post-MVP)

- **Application Store Export Wizard:** A guided step-by-step wizard that generates proper CasaOS store metadata (store.json, category definitions, etc.) and packages everything into a ready-to-publish GitHub repo.
- **Import:** Allow users to import applications from a saved JSON/zip file.
- **Cloud sync:** Optional sync to GitHub Gist or similar.

**Success criteria:**

- Users can save applications from the generator
- Saved apps appear in `applications.html` as cards in grid/list view
- Starred apps appear in a horizontal scrollable row at the top
- Clicking Edit opens `editor.html` with the app pre-populated
- Clicking Export All downloads a zip with each app in its own directory
- Export modal explains the zip can be used as a CasaOS store
- All header navigation includes the "Saved Applications" link

---

## Summary of Files That Need Changes

| File | Tasks |
|------|-------|
| `modules/yaml-generator.js` | 1, 3, 4, 6, 7, 8 |
| `modules/validation.js` (new) | 5 |
| `modules/saved-apps.js` (new) | 9 |
| `modules/zip-export.js` | 9 (extend) |
| `pages/generator.html` | 1, 2, 3, 4, 5, 6, 7, 8 |
| `pages/applications.html` (new) | 9 |
| `pages/editor.html` (new) | 9 |
| `index.html` | 9 (header button) |
| `pages/download.html` | 9 (header button) |
| `pages/icon.html` | 9 (header button) |
| `pages/screenshots.html` | 9 (header button) |
| `pages/preview.html` | 9 (header button) |
| `css/base.css` | 9 (card styles, grid/list, star carousel, modal) |
| `PROJECT.md` | 9 (feature description) |
| `README.md` | 9 (feature description) |