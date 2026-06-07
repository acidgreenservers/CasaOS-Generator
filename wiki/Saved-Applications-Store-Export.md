# Saved Applications & App Store Export

> **From single YAML generation to a fully deployable CasaOS app store.**

CasaOS Generator's application lifecycle system lets you persist applications, edit them later, and export your entire collection as a ready-to-use CasaOS app store. This guide covers both the **Application Lifecycle** feature and the **App Store creation workflow** that the export enables.

---

## 📋 Table of Contents

1. [Application Lifecycle Overview](#application-lifecycle-overview)
2. [Saved Applications Page](#saved-applications-page)
3. [Application Editor](#application-editor)
4. [Persistence Management](#persistence-management)
5. [Application Store Export](#application-store-export)
6. [Creating a CasaOS App Store from Your Export](#creating-a-casaos-app-store-from-your-export)
7. [App Store Metadata Reference](#app-store-metadata-reference)
8. [Third-Party Community Stores](#third-party-community-stores)
9. [Troubleshooting](#troubleshooting)

---

## Application Lifecycle Overview

The lifecycle moves through four stages:

```
Generate → Save → Manage/Edit → Export as Store
```

1. **Generate** — Use the multi-step generator (`generator.html`) to create your application configuration
2. **Save** — Persist the configuration to localStorage (full snapshot including services, ports, volumes, env vars, icons, screenshots)
3. **Manage/Edit** — Browse saved apps in grid/list view, star favourites, open the purpose-built editor to tweak any field
4. **Export as Store** — Export all saved apps as a single ZIP — each in its own directory, ready for CasaOS

---

## Saved Applications Page

**Page:** `pages/applications.html`  
**Access:** Click "📁 Saved Apps" in the header of any page

### Layout

The page provides two views controlled by a toggle:

| View | Description |
|------|-------------|
| **Grid** | Card grid — each card shows the app icon, title, tagline, category, and save date |
| **List** | Compact vertical list — same information in a streamlined layout |

### Starred Applications Carousel

At the top of the page, starred (⭐) apps appear in a horizontally scrollable row:

- Click the ⭐ button on any app card to toggle its starred state
- Starred apps are pinned to the top of the page
- Blue circular arrow buttons (‹ ›) scroll the carousel smoothly
- Click any star card to open the editor for that app

### Card Actions

Each app card has three action buttons:

| Button | Action |
|--------|--------|
| ✏️ **Edit** | Opens `editor.html?id=<app-id>` — the purpose-built editor |
| ⭐ **Star** | Toggles the app's starred state |
| 🗑️ **Remove** | Permanently deletes the app from localStorage (requires confirmation) |

### Export All

The **📦 Export All** button in the toolbar downloads a single ZIP archive containing every saved application. After the download, a modal explains how to use the export as a CasaOS app store.

### Empty State

When no apps are saved, the page shows a link to start generating.

---

## Application Editor

**Page:** `pages/editor.html?id=<app-id>`  
**Access:** Click "Edit" on any saved app card

The editor is a purpose-built single-page layout (not a stepped wizard) with all configuration fields visible at once.

### Sections

#### Basic Information
- **App ID** — lowercase, hyphens only (`[a-z0-9-]+`)
- **Category** — must match a category in `category-list.json` for proper store display
- **Title (en_US)** — Display name
- **Developer** — Developer name
- **Tagline (en_US)** — Short one-line description
- **Description (en_US)** — Full application description

#### Platform & Docker
- **Docker Image** — Full image path (e.g., `namespace/image:tag`)
- **Memory (MB)** — Memory reservation
- **Architectures** — Checkboxes for amd64, arm64, armv7
- **Index Path** — Application root path (default `/`)
- **Scheme** — HTTP or HTTPS

#### Ports
- Target port, published port, protocol (TCP/UDP), description
- Add/remove ports dynamically

#### Volumes
- Type (bind/volume), source path, target path, description
- Add/remove volumes dynamically

#### Environment Variables
- Key/value pairs
- Add/remove dynamically

#### Icon
- Click the upload area to select an image
- Accepts PNG, JPEG, WebP, SVG
- Preview shown after upload

#### Screenshots
- Add multiple screenshots via file picker
- Each shown as a thumbnail with a remove button
- Supports batch selection

### YAML Preview

The right column shows a live YAML preview via CodeMirror (read-only). The preview updates in real-time as fields are modified.

### Actions

| Button | Action |
|--------|--------|
| 💾 **Save Changes** | Writes the full config to localStorage, navigates back to `applications.html` |
| ⬇ **Download** | Downloads the individual app as a ZIP package via `createAppZip()` |
| ← **Saved Apps** | Returns to the applications list without saving |

---

## Persistence Management

The saved apps feature respects the user's persistence preference set via the privacy notice:

| Preference | Behavior |
|------------|----------|
| **Allowed** (`persistenceAllowed = true`) | Apps are saved to **localStorage** — persist across browser sessions and survive restarts |
| **Denied** (`persistenceAllowed = false`) | Apps are saved to **sessionStorage** — lost when the browser tab is closed. A banner at the top of `applications.html` warns the user and offers to enable persistence |
| **Never asked** (`null`) | Same as denied — banner offers to enable persistence |

When the user clicks **"Enable Persistence"** in the banner:
1. `setPersistencePreference(true)` is called
2. The banner is hidden
3. Any existing session data is migrated to localStorage

---

## Application Store Export

The **Export All** feature creates `casaos-app-store.zip` — a single archive containing every saved application.

### ZIP Structure

```
casaos-app-store.zip
├── my-app/
│   ├── docker-compose.yml
│   ├── icon.png
│   └── screenshots/
│       ├── screenshot-1.png
│       └── screenshot-2.png
├── another-app/
│   ├── docker-compose.yml
│   └── icon.png
└── ...
```

Each directory is named by the app's **AppID**. Each app directory contains:
- `docker-compose.yml` — Full CasaOS-compliant YAML configuration
- `icon.png` — Application icon (if available)
- `screenshots/` — Directory containing screenshots (if available)

### Export Behaviour

- The export uses `exportAllApps()` from `modules/zip-export.js`
- Each app's YAML is regenerated from the saved config using `generateYamlString()`
- The export is wrapped in a try/catch — errors are shown via toast notification
- An informational modal appears after successful download explaining the store workflow

---

## Creating a CasaOS App Store from Your Export

The exported ZIP is designed to be immediately usable as a CasaOS app store. Here is the complete workflow:

### Step 1: Fork the Official Repository

Fork the official [CasaOS-AppStore](https://github.com/IceWhaleTech/CasaOS-AppStore) repository to your GitHub account. This gives you the correct structure including:

```
your-appstore/
├── Apps/                     # Application directories go here
├── category-list.json        # Category definitions
├── recommend-list.json       # Recommended app configurations
└── CONTRIBUTING.md           # Contribution guide
```

### Step 2: Clean the Repository

Delete all existing app folders inside `Apps/` except keep:
- `category-list.json` — **Do not modify** unless adding custom categories
- `recommend-list.json` — Keep as-is or customise
- `CONTRIBUTING.md` — Keep for structure

### Step 3: Extract Your Export

Extract `casaos-app-store.zip` into the repository root. Each app directory should be moved into the `Apps/` folder:

```
your-appstore/
├── Apps/
│   ├── my-app/
│   │   ├── docker-compose.yml
│   │   ├── icon.png
│   │   └── screenshots/
│   ├── another-app/
│   │   ├── docker-compose.yml
│   │   └── icon.png
│   └── ...
├── category-list.json
├── recommend-list.json
└── CONTRIBUTING.md
```

### Step 4: Verify Metadata Compliance

Every app in your store must meet CasaOS requirements:

#### Required Files
| File | Required | Notes |
|------|----------|-------|
| `docker-compose.yml` | ✅ Yes | Full configuration with `x-casaos` metadata |
| `icon.png` | ✅ Yes | Application icon |
| `screenshot-1.png` | ✅ Yes | At least one screenshot |
| `screenshot-2.png` | ❌ Optional | Additional screenshots |
| `screenshot-3.png` | ❌ Optional | Additional screenshots |
| `thumbnail.png` | ❌ Optional | Larger preview image |

#### Naming Conventions
- Docker Compose name must match: `^[a-z0-9][a-z0-9_-]*$`
- Category must exactly match an entry in `category-list.json`

#### Best Practices
- Use specific image tags (e.g., `:0.1.2`) rather than `:latest`
- Use `WEBUI_PORT` environment variable for dynamic port allocation
- Ensure all `x-casaos` fields are populated (title, tagline, description, etc.)

### Step 5: Add `category-list.json`

If you defined custom categories in your apps, add them to `category-list.json`:

```json
[
  {
    "name": "Analytics",
    "font": "chart-areaspline",
    "description": "Analysis Apps"
  },
  {
    "name": "Backup",
    "font": "backup-restore",
    "description": "File and Data Backup Apps"
  },
  {
    "name": "Media",
    "font": "play-circle-outline",
    "description": "Media Apps"
  }
]
```

Each entry has three fields:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Must match the `category` value in app's `x-casaos` metadata exactly |
| `font` | string | Material Design Icon ligature name (e.g., `backup-restore`, `cloud-outline`, `robot`) |
| `description` | string | Brief description of the category |

**Icon Reference:** CasaOS supports Material Design Icons and custom CasaOS-Iconfonts. Browse valid names at:
- [Material Design Icons](https://pictogrammers.com/library/mdi/)
- [CasaOS-Iconfonts](https://github.com/IceWhaleTech/CasaOS-Iconfonts)

### Step 6: Deploy

Push your changes to GitHub. CasaOS can consume the repository directly via the "Download ZIP" URL:

```
https://github.com/your-username/your-appstore/archive/refs/heads/main.zip
```

### Step 7: Register in CasaOS

1. Open your CasaOS dashboard
2. Go to **Settings** → **App Store** → **Sources**
3. Click **Add Source**
4. Enter your ZIP URL
5. The store will appear in your app list

### Updating Your Store

After pushing changes to GitHub:
- **For creators:** Updates are automatic if using a dynamic ZIP URL. No re-registration needed.
- **For users:** Refresh the source in Settings → App Store → Sources (toggle off/on or use the refresh icon).

---

## App Store Metadata Reference

### Two-Level `x-casaos` Architecture

CasaOS metadata is split into two levels within `docker-compose.yml`:

#### Compose App Level (Root `x-casaos`)

```yaml
x-casaos:
  architectures:
    - amd64
    - arm64
  title:
    en_us: My Application
  store_app_id: my-app
  main: my-app
  category: Media
  developer: Developer Name
  author: Author Name
  port_map: "8080"
  scheme: http
  icon: https://cdn.jsdelivr.net/gh/.../icon.png
  thumbnail: ""
  screenshot_link:
    - screenshot-1.png
    - screenshot-2.png
  tagline:
    en_us: A short tagline
  description:
    en_us: Full application description
  index: /
  tips:
    before_install:
      en_us: Before installing...
    custom:
      en_us: Custom tip...
```

| Field | Required | Description |
|-------|----------|-------------|
| `architectures` | ✅ | Array of supported architectures (`amd64`, `arm64`, `armv7`) |
| `title` | ✅ | Display name (`en_us` sub-field) |
| `store_app_id` | ✅ | Unique store identifier |
| `main` | ✅ | Main service name |
| `category` | ✅ | Must match `category-list.json` |
| `developer` | ✅ | Developer name |
| `author` | ✅ | Config author |
| `port_map` | ✅ | Main web UI port |
| `scheme` | ✅ | `http` or `https` |
| `icon` | ✅ | Icon URL |
| `tagline` | ✅ | Short description |
| `description` | ✅ | Full description |
| `index` | ✅ | Root path (`/`) |
| `screenshot_link` | ✅ | Array of screenshot filenames |
| `thumbnail` | ❌ | Larger preview image URL |
| `tips` | ❌ | Before-install and custom tips |

#### Service Level (Per-Service `x-casaos`)

```yaml
services:
  my-app:
    image: namespace/image:tag
    x-casaos:
      ports:
        - container: "8080"
          description:
            en_us: WebUI HTTP port
      volumes:
        - container: /config
          description:
            en_us: Configuration directory
```

| Field | Required | Description |
|-------|----------|-------------|
| `ports[].container` | ✅ | Container port number (string) |
| `ports[].description.en_us` | ✅ | Human-readable port description |
| `volumes[].container` | ✅ | Container mount path |
| `volumes[].description.en_us` | ✅ | Human-readable volume description |

---

## Third-Party Community Stores

Beyond custom stores, CasaOS supports registering pre-built community app stores:

| Store | Description | Source URL | Requirements |
|-------|-------------|------------|--------------|
| **LinuxServer AppStore** | 100+ LinuxServer.io images, automated daily updates | `https://casaos-appstore.paodayag.dev/linuxserver.zip` | CasaOS v0.4.4+ |
| **Edge AppStore** | Auto-updated to latest stable versions every 24 hours | `https://casaos-appstore.paodayag.dev/edge.zip` | None specified |
| **HomeAutomation AppStore** | Specialized Docker configs for smart home systems | Add via CasaOS AppStore UI | None specified |

To add a community store:
- **Dashboard:** Settings → App Store → Sources → Add Source → Enter URL
- **CLI:** `casaos-cli app-management register app-store <ZIP_URL>`

---

## Troubleshooting

### "My saved apps disappeared after closing the browser"
- Check your persistence preference. If `persistenceAllowed` is `false` or `null`, data is stored in `sessionStorage` which is cleared when the tab closes.
- Enable persistence via the banner on `applications.html` or by re-enabling it in the privacy notice.

### "The Export All button did nothing"
- Ensure you have at least one saved app with a valid `appId`.
- Check the browser console (F12 → Console) for errors.
- Ensure `JSZip` loaded correctly from the CDN.

### "My app store doesn't show in CasaOS after registering"
- Verify the ZIP URL is publicly accessible.
- Ensure the repository structure is correct (Apps directory, `category-list.json`, etc.).
- Check that `docker-compose.yml` files are valid YAML.
- Toggle the source off and on in Settings → App Store → Sources.

### "Category icons aren't showing"
- Verify the `font` value in `category-list.json` is a valid Material Design Icon ligature name.
- Check the CasaOS-Iconfonts repository for supported icon names.

### "My app shows under the wrong category"
- Ensure the `category` field in `x-casaos` metadata exactly matches the `name` in `category-list.json` (case-sensitive).

---

**Next Steps:** Review the [ROADMAP.md](../ROADMAP.md) for planned wizard features that will automate the store creation process.