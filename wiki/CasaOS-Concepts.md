# CasaOS Concepts

Understand the foundational ideas that shape CasaOS YAML configurations. This page bridges onboarding and technical reference.

---

## The CasaOS Architecture Model

CasaOS extends Docker Compose with a **metadata layer** that enables user-friendly app discovery and management in the AppStore.

### Three Core Layers

1. **Docker Compose Layer** — Standard container orchestration (images, ports, volumes, networks)
2. **CasaOS Metadata Layer** — UI metadata and app presentation (`x-casaos` extensions)
3. **System Integration Layer** — CasaOS-specific paths, variables, and behaviors

---

## File Storage: The `/DATA/` Convention

### Directory Structure

```
/DATA/
├── AppData/
│   └── $AppID/           # Each app gets its own directory
│       ├── config/       # Default config directory
│       ├── data/         # Default data directory
│       └── db/           # Database files (if applicable)
└── Media/                # Shared media library
```

### Why This Matters

- **Isolation** — Apps don't interfere with each other's data
- **Backup** — Easy to backup all app data in one place
- **Consistency** — Predictable paths across all apps
- **Portability** — Apps can be moved or shared

### System Variables

| Variable | Expands To | Example |
|----------|-----------|----------|
| `$AppID` | Application identifier (lowercase, no spaces) | `jellyfin` |
| `/DATA` | CasaOS data root | `/DATA/AppData/jellyfin/config` |

**Always use these variables in volume paths.** They're evaluated at runtime.

---

## Metadata: Two Levels of Configuration

CasaOS metadata appears in **two places** in your YAML:

### Service-Level `x-casaos` (Per Container)

```yaml
services:
  myapp:
    # ... Docker Compose fields
    x-casaos:                    # Service-level metadata
      ports:
        - container: "8080"
          description:
            en_us: "WebUI Port"
      volumes:
        - container: /config
          description:
            en_us: "Configuration files"
```

**Purpose:** Describe what this specific container exposes.

**What goes here:**
- Port descriptions (what each port does)
- Volume descriptions (what data each volume holds)

### Root-Level `x-casaos` (App-Wide)

```yaml
x-casaos:                       # Root-level metadata
  architectures: [amd64, arm64]
  main: myapp                   # Which service is the UI?
  store_app_id: myapp           # App identifier in store
  category: Utilities
  author: Community
  developer: MyApp Team
  icon: https://...
  title:
    en_us: "My Application"
  # ... more metadata
```

**Purpose:** Describe the app as a whole in the AppStore.

**What goes here:**
- App identity (name, author, developer)
- AppStore presentation (icon, description, category)
- UI configuration (port, scheme, index path)

---

## Network Modes: Bridge vs. Host

This choice shapes how your app communicates.

### Bridge Mode (Recommended)

```yaml
network_mode: bridge
ports:
  - target: 8080
    published: "8080"
    protocol: tcp
```

**Characteristics:**
- Container has its own virtual network interface
- Must explicitly map ports to host
- Apps are isolated from each other
- `target` (container port) is an **integer**
- `published` (host port) is a **string**

**Use for:** Almost every app (web UIs, databases, utilities)

### Host Mode

```yaml
network_mode: host
# No ports section — container shares host network
```

**Characteristics:**
- Container shares host's network stack
- Can access all host ports directly
- No port mapping needed or allowed
- Can use broadcast/multicast

**Use for:**
- Home Automation (device discovery)
- DNS/DHCP servers (broadcast traffic)
- Network monitoring tools
- Apps requiring raw network access

**Examples:** HomeAssistant, Plex (with discovery), Pi-hole

---

## Ports and Descriptions: Why Separate Them?

### Docker Compose Defines the Connection

```yaml
ports:
  - target: 8080              # What port does the app listen on?
    published: "8080"        # What port do we expose on the host?
    protocol: tcp             # TCP or UDP?
```

### CasaOS Describes the Purpose

```yaml
x-casaos:
  ports:
    - container: "8080"       # Must match a target port
      description:
        en_us: "Web Interface"
```

**Why?**
- CasaOS generates UI labels from descriptions
- "Web Interface" tells users what port 8080 does
- Separating definition from description keeps YAML clean
- Users see human-readable port purposes in the UI

---

## Volumes and Persistence: Bind vs. Docker Volumes

### Bind Mounts (Most Common)

```yaml
volumes:
  - type: bind                                    # Direct filesystem mount
    source: /DATA/AppData/$AppID/config         # Host path
    target: /config                             # Container path
```

**Characteristics:**
- Maps a host directory directly into the container
- Data survives container restarts and removal
- Readable by host tools (backups, exploration)
- Best for app configuration and user data

**Best Practice:** Always use `/DATA/AppData/$AppID/` prefix for bind mounts.

### Docker Volumes (Less Common)

```yaml
volumes:
  - type: volume              # Docker-managed volume
    source: mydata            # Volume name
    target: /data             # Container path
```

**Characteristics:**
- Docker manages the actual storage location
- More portable across systems
- Better performance on some systems
- Less visible to host tools

**Use when:** Performance-critical or migrating between systems.

---

## Validation Model: The Four Corners

CasaOS validation checks these **four integrity points**:

### 1. Identity Match

```yaml
name: myapp                   # Must match
x-casaos:
  store_app_id: myapp        # These must be identical
```

**Why:** Prevents confusion about app identity.

### 2. Service Reference

```yaml
services:
  myapp:                      # Service name
    # ...
x-casaos:
  main: myapp                 # Must reference an actual service
```

**Why:** The `main` field tells CasaOS which service hosts the UI.

### 3. Port Consistency

```yaml
ports:
  - target: 8080              # Container port
    # ...
x-casaos:
  ports:
    - container: "8080"       # Must match the target above
```

**Why:** Descriptions must describe actual ports.

### 4. Volume Consistency

```yaml
volumes:
  - target: /config           # Container path
    # ...
x-casaos:
  volumes:
    - container: /config      # Must match a target above
```

**Why:** Descriptions must describe actual volumes.

**If any corner fails, the app won't function correctly in CasaOS.**

---

## Memory Reservation: Intent vs. Limit

### Memory Reservation

```yaml
deploy:
  resources:
    reservations:
      memory: 512M            # This is a reservation, not a limit
```

**Meaning:** "CasaOS should try to keep 512M available for this container."

**Characteristics:**
- A guideline, not a hard limit
- CasaOS uses this for scheduling decisions
- Container can exceed this if memory is available
- Protects against memory starvation

### Format Rules

- **Always:** `{number}M` (e.g., `256M`, `1024M`)
- **Never:** `256MB`, `0.5G`, `256 M` (space before M)
- **Default:** `0M` (no reservation)

### Common Values

| App Type | Typical Reservation |
|----------|--------------------|
| Lightweight utility | 128M - 256M |
| Web app (Node.js, Python) | 512M - 1024M |
| Media server (Plex, Jellyfin) | 1024M - 2048M+ |
| Database | 256M - 1024M |
| Development tool | 512M - 2048M |

---

## Language Codes: Always Lowercase

CasaOS supports multi-language descriptions. Always use **lowercase** `en_us`:

```yaml
# ✅ Correct
title:
  en_us: "My App"

# ❌ Wrong
title:
  en_US: "My App"     # Uppercase breaks parsing
  EN_US: "My App"    # Even worse
```

Currently, only English (`en_us`) is widely used, but the structure allows future language additions.

---

## Multi-Service Apps: Single Controller

When an app has multiple services (e.g., frontend + database), there's **only one root-level `x-casaos`**:

```yaml
services:
  app:                        # Main service
    # ... app definition
    x-casaos:                # Service-level
      ports: [...]
  
  db:                         # Supporting service
    # ... database definition
    x-casaos:                # Service-level
      volumes: [...]

x-casaos:                     # Root-level (ONE ONLY)
  main: app                   # Points to the service with the UI
  # ... app-wide metadata
```

**Key Rule:** The `main` field points to the service that hosts the web UI (or primary interface). CasaOS uses that service's ports to construct the "Open" button.

---

## The AppStore Visibility Tiers

Where your YAML ends up depends on what you're targeting:

### Official IceWhaleTech Store
- **Strictest requirements**
- Must use predefined categories
- Professional descriptions expected
- Icons preferred from `cdn.jsdelivr.net`
- Thorough review process

### Third-Party Stores (BigBearTechWorld, etc.)
- **Flexible categories** (can create custom)
- More experimental apps accepted
- Faster review
- Community-focused

### Personal/Private Stores
- **Full flexibility**
- Can ignore optional fields
- Custom categories encouraged
- For internal/testing use

---

## Next Steps

- **Ready to build?** → [Ultimate Guide](./Ultimate-Guide) — Field-by-field reference
- **Complex setups?** → [Advanced Patterns](./Advanced-Patterns) — Custom networks, multi-service architectures
- **Something broken?** → [Troubleshooting & Advanced Setups](./Troubleshooting-Advanced-Setups) — Diagnostics and migrations
