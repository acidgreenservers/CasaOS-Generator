# The Ultimate CasaOS AppStore Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Metadata Structure](#metadata-structure)
3. [Technical Constraints and Best Practices](#technical-constraints-and-best-practices)
4. [Creating a Custom Appstore](#creating-a-custom-appstore)
5. [App Store Categories](#app-store-categories)
6. [Installing Third-Party Appstores](#installing-third-party-appstores)
7. [Updating and Maintaining Your Appstore](#updating-and-maintaining-your-appstore)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

A CasaOS AppStore is a GitHub repository (or static ZIP archive) containing Docker Compose applications that CasaOS can install on a user's system. This guide explains the structure, metadata, and workflow for building a complete app store — from forking the official repository to registering it in the CasaOS dashboard.

### App Store vs Custom App

| Concept | Purpose |
|---------|---------|
| **Custom App** | A single application added directly via CasaOS's "Add Custom App" UI |
| **AppStore** | A repository containing many apps, registered once in CasaOS to be browsed and installed like a category |
| **App Store Export** | A ZIP archive of saved apps that can be uploaded to GitHub and consumed as a custom AppStore |

The CasaOS Generator's **Application Store Export** feature (in `pages/applications.html`) produces ZIPs structured to match AppStore requirements, so you can skip the manual `docker-compose.yml` writing for each app and focus on the store-level metadata.

---

## Metadata Structure

CasaOS applications are defined by Docker Compose files extended with the `x-casaos` property. The metadata is split into two distinct scopes to ensure proper UI rendering and runtime behaviour.

### Service Level Metadata

Contains runtime configuration descriptions shown in the CasaOS UI for each service:

```yaml
services:
  my-app:
    image: namespace/image:tag
    x-casaos:
      ports:
        - container: "8080"
          description:
            en_us: "WebUI HTTP port"
      volumes:
        - container: /config
          description:
            en_us: "Configuration directory"
      envs:                     # Optional
        - container: PUID
          description:
            en_us: "User ID for permissions"
```

| Field | Required | Description |
|-------|----------|-------------|
| `ports[].container` | Conditional | Container port number (string) — required if service has ports |
| `ports[].description.en_us` | Conditional | Human-readable port description — required if service has ports |
| `volumes[].container` | Conditional | Container mount path — required if service has volumes |
| `volumes[].description.en_us` | Conditional | Human-readable volume description — required if service has volumes |
| `envs[].container` | Optional | Environment variable name |
| `envs[].description.en_us` | Optional | Environment variable description |

### Compose App Level (Root) Metadata

User-facing information about the app as a whole, plus technical details:

```yaml
x-casaos:
  architectures:
    - amd64
    - arm64
  title:
    en_us: "My Application"
  store_app_id: my-app
  main: my-app
  category: Utilities
  developer: My Name
  author: My Name
  port_map: "8080"
  scheme: http
  icon: https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/my-app.png
  thumbnail: ""
  screenshot_link:
    - screenshot-1.png
  tagline:
    en_us: "A short tagline"
  description:
    en_us: |
      Full app description here.
  index: /
  tips:
    before_install:
      en_us: "Important info before install"
    custom:
      en_us: "Custom tip text"
```

| Field | Required | Description |
|-------|----------|-------------|
| `architectures` | ✅ | Array of supported CPU architectures (`amd64`, `arm64`, `arm`, `arm/v7`, `arm/v6`) |
| `title.en_us` | ✅ | Display name shown in CasaOS UI |
| `store_app_id` | ✅ | Unique store identifier (lowercase, hyphens) — must match `name` |
| `main` | ✅ | Reference to the primary service name |
| `category` | ✅ | Must match an entry in `category-list.json` |
| `developer` | ✅ | Original software developer or company |
| `author` | ✅ | YAML config author |
| `port_map` | ✅ | Main web UI port (string, not integer) |
| `scheme` | ✅ | `http` or `https` |
| `icon` | ✅ | Icon URL (PNG preferred) |
| `tagline.en_us` | ✅ | Short one-line description |
| `description.en_us` | ✅ | Multi-line full description |
| `index` | ✅ | WebUI path (usually `/`) |
| `screenshot_link` | ✅ | Array of screenshot filenames |
| `thumbnail` | ❌ | Larger preview image URL (often `""`) |
| `tips.before_install.en_us` | ❌ | Prerequisites/system requirements |
| `tips.custom.en_us` | ❌ | Post-install instructions (default credentials, etc.) |

---

## Technical Constraints and Best Practices

Adhering to these constraints is mandatory for an app to be accepted and function correctly within the CasaOS ecosystem.

### Required Files

Every application directory in a custom AppStore **must** contain:

| File | Required | Notes |
|------|----------|-------|
| `docker-compose.yml` | ✅ Yes | Full configuration with `x-casaos` metadata |
| `icon.png` | ✅ Yes | Application icon (256x256 or 512x512 recommended) |
| `screenshot-1.png` | ✅ Yes | At least one screenshot |
| `screenshot-2.png` | ❌ Optional | Additional screenshots |
| `screenshot-3.png` | ❌ Optional | Additional screenshots |
| `thumbnail.png` | ❌ Optional | Larger preview image |

### Naming Conventions

| Rule | Description |
|------|-------------|
| **App ID format** | Lowercase, hyphens for spaces — `^[a-z0-9][a-z0-9_-]*$` |
| **Container name** | Match the AppID or use `{appid}-{service}` for multi-service |
| **Volume paths** | `/DATA/AppData/$AppID/{purpose}` — e.g., `/DATA/AppData/jellyfin/config` |
| **Service name** | Must match `main` in root `x-casaos` |

### Versioning

- **Use specific image tags** — `:0.1.2` instead of `:latest`
- This ensures stability and reproducibility
- Users can update by changing the tag and refreshing the store

### Dynamic Ports

Use the `WEBUI_PORT` environment variable to let CasaOS handle dynamic port allocation:

```yaml
environment:
  WEBUI_PORT: "8080"
```

This is the recommended pattern for apps that need to adapt to ports already in use on the host system.

### Icon Sources

| Source | URL Pattern | Example |
|--------|-------------|---------|
| **homarr-labs dashboard-icons (recommended)** | `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/{app-name}.png` | `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/jellyfin.png` |
| **Custom GitHub URL** | Direct CDN link to your image asset | `https://example.com/icons/my-app.png` |
| **CasaOS AppStore icons** | Pulled from `Apps/{app-id}/icon.png` when registered as local source | — |

### Memory Format

Always use uppercase `M` with no space: `256M`, `512M`, `1024M`, `2048M`

| App Size | Recommended Memory |
|----------|---------------------|
| Lightweight | 128M – 256M |
| Medium | 512M – 1024M |
| Heavy | 2048M+ |

---

## Creating a Custom Appstore

Building a custom AppStore requires forking the official structure, pruning irrelevant data, and populating the `Apps/` directory with compliant application definitions.

### Step 1: Fork the Official Repository

Fork the official [CasaOS-AppStore](https://github.com/IceWhaleTech/CasaOS-AppStore) repository to your GitHub account.

### Step 2: Clean the Repository

Delete all existing app folders inside `Apps/` except keep:

| File | Action | Reason |
|------|--------|--------|
| `category-list.json` | Keep, modify if adding custom categories | Defines categories shown in UI |
| `recommend-list.json` | Keep, customise as desired | Featured apps on store landing |
| `CONTRIBUTING.md` | Keep | Contribution guide |

### Step 3: Add Your Applications

Place your custom app folders (containing `docker-compose.yml`, `icon.png`, screenshots) into the `Apps/` directory, following the official schema.

You can use the CasaOS Generator's **Application Store Export** to produce these folders in bulk from your saved apps:

```
your-appstore/
├── Apps/
│   ├── my-app/
│   │   ├── docker-compose.yml
│   │   ├── icon.png
│   │   └── screenshot-1.png
│   ├── another-app/
│   │   ├── docker-compose.yml
│   │   ├── icon.png
│   │   └── screenshot-1.png
│   └── ...
├── category-list.json
├── recommend-list.json
└── CONTRIBUTING.md
```

### Step 4: Customise Categories

If your apps use categories not in the default `category-list.json`, add them. See the [App Store Categories](#app-store-categories) section below for the JSON structure.

### Step 5: Deploy

Push your changes to the GitHub repository. No build step or website is required — CasaOS can read the repository directly via a ZIP URL.

### Step 6: Get the ZIP URL

CasaOS consumes your store via a "Download ZIP" URL. The format is:

```
https://github.com/your-username/your-appstore/archive/refs/heads/main.zip
```

Replace `main` with your default branch name.

### Step 7: Register the Source

1. Open your CasaOS dashboard
2. Go to **Settings** → **App Store** → **Sources**
3. Click **Add Source**
4. Enter your ZIP URL
5. The store will appear in your app list with all its apps ready to install

---

## App Store Categories

Categories are defined in the root-level `category-list.json` file. This file uses a simple JSON array structure where each object defines a specific application category.

### Default Categories

The official CasaOS AppStore includes these categories:

| Name | Font (Icon) | Description |
|------|-------------|-------------|
| Analytics | chart-areaspline | Analysis Apps |
| Backup | backup-restore | File and Data Backup Apps |
| Blog | — | Blog Apps |
| Chat | — | Chat Apps |
| Cloud | cloud-outline | Cloud Apps |
| Developer | — | Developer Tools |
| CRM | — | Customer Relationship Management |
| Documents | — | Document Management |
| Email | — | Email Apps |
| File Sync | — | File Synchronization |
| Finance | — | Finance Apps |
| Forum | — | Forum Apps |
| Gallery | — | Gallery Apps |
| Games | — | Gaming Apps |
| Learning | — | Educational Apps |
| Media | play-circle-outline | Media Apps |
| Notes | — | Notes Apps |
| Project Management | — | Project Management |
| VPN | — | VPN Apps |
| WEB | — | Web Apps |
| WiKi | — | Wiki Apps |
| Dapps | — | Decentralised Apps |
| Downloader | — | Download Managers |
| Utilities | — | Utility Apps |
| Home Automation | — | Home Automation |
| Network | — | Network Apps |
| Database | — | Database Apps |
| AI | — | AI Apps |

### JSON Structure

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
| `name` | string | Must match the `category` value in app's `x-casaos` metadata exactly (case-sensitive) |
| `font` | string | Material Design Icon ligature name (e.g., `backup-restore`, `cloud-outline`, `robot`) |
| `description` | string | Brief description of the category |

### Adding Custom Categories

You can introduce new categories (e.g., "AI Tools") by adding them to your `category-list.json`:

```json
[
  {
    "name": "AI Tools",
    "font": "robot",
    "description": "Artificial Intelligence and LLM Apps"
  }
]
```

Then in the app's `docker-compose.yml`:

```yaml
x-casaos:
  category: AI Tools
```

**Key Requirements:**
- The `name` string must **exactly match** the `category` value in the app's `x-casaos` section
- The `font` value must be a valid icon name from the supported libraries

### Changing Category Icons

Modify the `font` value in `category-list.json`:

```json
{
  "name": "Media",
  "font": "play-circle-outline",
  "description": "Media Apps"
}
```

### Supported Icon Fonts

CasaOS supports two icon libraries:

1. **Material Design Icons** (Google Fonts) — primary library
2. **CasaOS-Iconfonts** (custom) — includes platform-specific icons

**Format:** Use the ligature name (string), not Unicode or CSS class.

**Common Examples:**
- `backup-restore`
- `cloud-outline`
- `security`
- `media-player`
- `robot`
- `chart-areaspline`
- `grid` (default if unspecified)

**Verification:** Invalid icon names render as a blank square or default icon. You can browse valid names at:
- [Material Design Icons](https://pictogrammers.com/library/mdi/)
- [CasaOS-Iconfonts](https://github.com/IceWhaleTech/CasaOS-Iconfonts)

### What Happens When You Delete a Category

| Effect | Description |
|--------|-------------|
| **Apps remain installed/available** | The application files are not deleted |
| **Apps lose their filter tag** | The category tab disappears; affected apps move to "All" or default view |
| **UI refresh required** | Toggle the source off/on or re-add the URL to apply changes |
| **Restoring a category** | Apps immediately reappear under the correct filter (upon refresh) |

---

## Installing Third-Party Appstores

Beyond creating your own, CasaOS supports registering pre-built community app stores. These can be installed via the dashboard UI or the command line.

### Popular Community Stores

| Store | Description | Source URL | Requirements |
|-------|-------------|------------|--------------|
| **LinuxServer AppStore** | 100+ LinuxServer.io images, automated daily updates | `https://casaos-appstore.paodayag.dev/linuxserver.zip` | CasaOS v0.4.4+ |
| **Edge AppStore** | Auto-updated to latest stable versions every 24 hours | `https://casaos-appstore.paodayag.dev/edge.zip` | None specified |
| **HomeAutomation AppStore** | Specialized Docker configs for smart home systems | Add via CasaOS AppStore UI | None specified |

### Dashboard Installation

1. Open CasaOS dashboard
2. Go to **Settings** → **App Store** → **Sources**
3. Click **Add Source**
4. Enter the ZIP URL of the community store
5. The store appears in your app list

### CLI Installation

For headless installations or scripted setup, use `casaos-cli`:

```bash
casaos-cli app-management register app-store <ZIP_URL>
```

**Note:** If CasaOS runs on a non-standard port, add the `--root-url` parameter:

```bash
casaos-cli app-management register app-store <ZIP_URL> --root-url "localhost:<PORT>"
```

---

## Updating and Maintaining Your Appstore

### For Creators (Pushing Updates)

When you update your store (new apps, version bumps, category changes):

1. **Commit changes** to your GitHub repository:
   - Update `docker-compose.yml` files (e.g., changing image tags)
   - Update `category-list.json` (add/remove categories)
   - Update `recommend-list.json` (featured apps)
2. **Push commits** to the remote repository
3. **No re-registration needed** — if using a dynamic ZIP URL, content updates automatically

### For Users (Refreshing the Store)

If you have added a custom source and want to fetch the latest changes:

**Dashboard Method:**
1. Go to **Settings** → **App Store** → **Sources**
2. Click the **Refresh** icon (if available)
3. Or toggle the source off and on
4. In many versions, simply reopening the App Store tab triggers a fetch

**CLI Method:**

If the UI does not refresh, re-register the store via SSH to force an update:

```bash
casaos-cli app-management register app-store <YOUR_ZIP_URL>
```

### Best Practices for Maintenance

| Practice | Description |
|----------|-------------|
| **Use specific image tags** | Avoid `:latest` — pin to versions for reproducibility |
| **Update incrementally** | Don't break all apps at once; stage changes |
| **Test before pushing** | Validate YAML syntax and test installation locally if possible |
| **Document breaking changes** | Add a CHANGELOG.md or use tips.before_install to warn users |
| **Archive old versions** | Keep older image tags available for users who can't upgrade |

---

## Troubleshooting

### "My custom store doesn't show up in CasaOS"

**Check:**
- Verify the ZIP URL is publicly accessible (test in a browser)
- Ensure the repository structure is correct (Apps directory, `category-list.json`, etc.)
- Check that `docker-compose.yml` files are valid YAML
- Toggle the source off and on in **Settings** → **App Store** → **Sources**

### "Apps in my store aren't appearing under the right category"

**Check:**
- Ensure the `category` field in `x-casaos` metadata exactly matches the `name` in `category-list.json` (case-sensitive)
- Refresh the source after changes

### "Category icons aren't showing"

**Check:**
- Verify the `font` value in `category-list.json` is a valid Material Design Icon ligature name
- Check the [CasaOS-Iconfonts repository](https://github.com/IceWhaleTech/CasaOS-Iconfonts) for supported icon names
- Default to `grid` if unsure

### "App shows under the wrong category or no category"

**Check:**
- Ensure the `category` field in `x-casaos` metadata exactly matches the `name` in `category-list.json` (case-sensitive)
- Verify the entry exists in `category-list.json` (not just on official store — your custom store has its own list)
- Refresh the source after metadata changes

### "App Store Export ZIP from the generator doesn't work in CasaOS"

**Check:**
- Ensure every app has a valid `appId` and `image`
- Verify icons are in base64 format and under localStorage quota (typically 5-10MB)
- Check that the `screenshot_link` array in generated YAML contains filenames that match the actual `screenshots/` directory contents
- Test by manually extracting the ZIP and checking the directory structure matches the AppStore schema

### "Apps in the export have `null` for tip fields"

**Check:**
- Tips are only emitted if both enabled AND have content — see the YAML generator
- Verify the app form has `tips.enable_before_install` or `tips.enable_custom` checked, AND the corresponding text fields have content
- Re-export after making any tip changes

---

## Resources

| Resource | Link |
|----------|------|
| Official CasaOS AppStore | https://github.com/IceWhaleTech/CasaOS-AppStore |
| CasaOS Documentation | https://casaos.io/ |
| Docker Compose Spec | https://docs.docker.com/compose/compose-file/ |
| Material Design Icons | https://pictogrammers.com/library/mdi/ |
| CasaOS-Iconfonts | https://github.com/IceWhaleTech/CasaOS-Iconfonts |
| Dashboard Icons (homarr-labs) | https://github.com/homarr-labs/dashboard-icons |
| Iconify (MDI) | https://icon-sets.iconify.design/mdi/ |
| WebUI Port Reference | https://deepwiki.com/eliasempresas/CasaOS/4.4-environment-variables-and-magic-values |

---

## Conclusion

This guide covers the complete specification for creating CasaOS AppStore ZIP archives. By following these guidelines, you can ensure:

1. **Consistency** — All apps follow the same structure
2. **Compatibility** — Apps work correctly in any CasaOS instance
3. **User Experience** — Clear descriptions and proper UI integration
4. **Maintainability** — Easy to update, debug, and extend

The CasaOS Generator's **Application Store Export** automates most of this work — the YAML, icons, and screenshots are all generated for you. Your remaining responsibilities are:

1. Curate and review your apps before exporting
2. Build a `category-list.json` that matches your app categories
3. Maintain the GitHub repository hosting your store
4. Communicate the store URL to your users

---

**Document Version**: 1.0  
**Last Updated**: 2026  
**Maintained by**: acidgreenservers  
**License**: Free to use and distribute
