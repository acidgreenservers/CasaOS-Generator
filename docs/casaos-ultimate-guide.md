# The Ultimate CasaOS AppStore YAML Generator Guide

## Table of Contents
1. [Introduction](#introduction)
2. [CasaOS Architecture Overview](#casaos-architecture-overview)
3. [YAML Structure Specification](#yaml-structure-specification)
4. [Field-by-Field Reference](#field-by-field-reference)
5. [Multi-Service Apps](#multi-service-apps)
6. [Validation Rules](#validation-rules)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

CasaOS uses Docker Compose YAML files with custom extensions to define applications in its AppStore. These files combine standard Docker Compose syntax with CasaOS-specific metadata stored under the `x-casaos` extension property.

### Key Concepts

- **Standard Docker Compose**: CasaOS builds on Docker Compose, so all standard fields are valid
- **x-casaos Extensions**: Custom metadata fields that CasaOS uses for UI presentation and app management
- **Two-Level Metadata**: CasaOS metadata appears at both the root level AND within each service
- **System Variables**: CasaOS provides special variables like `$AppID` for dynamic paths

---

## CasaOS Architecture Overview

### File Storage Structure

```
/DATA/
├── AppData/
│   └── $AppID/           # Each app gets its own directory
│       ├── config/       # Default config directory
│       └── data/         # Default data directory
└── Media/                # Media files location
```

### System Variables

CasaOS provides these variables for use in volume paths:

| Variable | Description | Example |
|----------|-------------|---------|
| `$AppID` | The application ID (lowercase, no spaces) | `jellyfin` |
| `/DATA` | CasaOS data root directory | `/DATA/AppData/$AppID/config` |

---

## YAML Structure Specification

### Complete Structure Template

```yaml
name: app-name                    # Root level: compose project name
services:
  service-name:                   # Service definition (can have multiple)
    container_name: app-name      # Container name
    image: namespace/image:tag    # Docker image
    command: "optional command"   # Optional startup command
    deploy:
      resources:
        reservations:
          memory: 256M            # Memory reservation (always in M format)
    restart: unless-stopped       # Restart policy (always this value)
    network_mode: bridge          # Network mode: bridge or host
    ports:                        # Port mappings (long syntax)
      - target: 8080              # Container port (integer)
        published: "8080"         # Host port (string)
        protocol: tcp             # Protocol: tcp or udp
    volumes:                      # Volume mounts (long syntax)
      - type: bind                # Type: bind or volume
        source: /DATA/AppData/$AppID/config
        target: /config           # Container path
    environment:                  # Environment variables (key-value)
      KEY: "value"
      ANOTHER_KEY: "another value"
    x-casaos:                     # Service-level CasaOS metadata
      ports:
        - container: "8080"       # Must match a port in ports section
          description:
            en_us: "WebUI Port"   # Always lowercase "en_us"
      volumes:
        - container: /config      # Must match a volume target
          description:
            en_us: "Config directory"

x-casaos:                         # Root-level CasaOS metadata
  architectures:                  # Supported CPU architectures
    - amd64
    - arm64
    - arm
  main: service-name              # Main service (references service name)
  store_app_id: app-name          # AppStore ID (must match name)
  category: Category Name         # App category
  author: Your Name               # YAML author
  developer: Developer Name       # Original app developer
  icon: https://url.to/icon.png   # Icon URL
  thumbnail: ""                   # Thumbnail URL (usually empty)
  title:
    en_us: "App Display Name"     # Display title (en_us lowercase)
  tagline:
    en_us: "Short one-line description"
  description:
    en_us: |                      # Multi-line description
      Full app description here.
      Can span multiple lines.
  screenshot_link:                # Array of screenshot URLs
    - https://url.to/screenshot1.png
  tips:                           # Optional installation tips
    before_install:
      en_us: |
        Important info before installation
    custom:                       # Optional custom tips
      en_us: |
        Custom tip text
  port_map: "8080"                # Default WebUI port (string)
  scheme: http                    # Protocol: http or https
  index: /                        # WebUI path (usually /)
```

---

## Field-by-Field Reference

### Root Level Fields

#### `name` (Required)
- **Type**: String
- **Format**: lowercase, no spaces, hyphens allowed
- **Purpose**: Docker Compose project name
- **Example**: `jellyfin`, `home-assistant`, `nextcloud`
- **Rules**: 
  - Must match the main service's `store_app_id`
  - Used for container naming and identification
  - Cannot contain special characters except hyphens

#### `services` (Required)
- **Type**: Object
- **Purpose**: Contains all service definitions
- **Can Have**: One or more service definitions
- **Key**: Service name (used to reference the service)

### Service Level Fields

#### `container_name` (Required)
- **Type**: String
- **Format**: Same rules as `name`
- **Purpose**: Actual Docker container name
- **Best Practice**: Use same value as the service key and `name`
- **Example**: `jellyfin`

#### `image` (Required)
- **Type**: String
- **Format**: `namespace/repository:tag`
- **Purpose**: Docker image to use
- **Examples**:
  - `linuxserver/jellyfin:latest`
  - `jellyfin/jellyfin:10.8.10`
  - `ghcr.io/linuxserver/plex:latest`
- **Best Practices**:
  - Always specify a tag (avoid implicit `:latest`)
  - Use official images when available
  - For LinuxServer.io images: `linuxserver/imagename`

#### `command` (Optional)
- **Type**: String
- **Purpose**: Override container's default command
- **Format**: Full command string
- **Examples**:
  - `"sh -c 'echo hello && /start.sh'"`
  - `"--config /config/config.yml"`
  - `"/bin/bash -c 'custom command'"`
- **When to Use**:
  - Need to pass specific flags
  - Override entrypoint behavior
  - Run initialization scripts

#### `deploy.resources.reservations.memory`
- **Type**: String
- **Format**: Number followed by `M` (megabytes)
- **Purpose**: Minimum memory allocation
- **Examples**: `256M`, `512M`, `1024M`, `2048M`
- **Default**: `0M` (no reservation)
- **Rules**:
  - Always use uppercase `M`
  - No space between number and `M`
  - This is a reservation, not a limit

#### `restart` (Required)
- **Type**: String
- **Value**: Always `unless-stopped`
- **Purpose**: Container restart policy
- **Why This Value**: Allows manual stops while auto-starting otherwise

#### `network_mode` (Required)
- **Type**: String
- **Options**: `bridge` or `host`
- **Purpose**: Container networking mode
- **Bridge Mode**: 
  - Default and recommended
  - Requires explicit port mappings
  - Provides network isolation
- **Host Mode**:
  - Container shares host network stack
  - No port mappings needed/allowed
  - Use for apps requiring broadcast/multicast
  - Examples: HomeAssistant, Plex

#### `ports` (Conditional - Required if `network_mode: bridge`)
- **Type**: Array of objects (long syntax)
- **Purpose**: Map container ports to host
- **Structure**:
```yaml
ports:
  - target: 8080        # Container port (integer)
    published: "8080"   # Host port (string, can be string range)
    protocol: tcp       # tcp or udp
```
- **Important**:
  - `target` is integer, `published` is string
  - `protocol` must be lowercase
  - Not used when `network_mode: host`

#### `volumes` (Required for persistence)
- **Type**: Array of objects (long syntax)
- **Purpose**: Mount host paths or Docker volumes
- **Structure**:
```yaml
volumes:
  - type: bind                              # bind or volume
    source: /DATA/AppData/$AppID/config    # Host path or volume name
    target: /config                         # Container path
```
- **Types**:
  - `bind`: Mount host directory (most common)
  - `volume`: Use Docker named volume
- **Best Practices**:
  - Always use `/DATA/AppData/$AppID/` prefix for app data
  - Use descriptive subdirectories: `config`, `data`, `cache`
  - Always use absolute paths for `source` with bind mounts

#### `environment` (Optional)
- **Type**: Object (key-value pairs)
- **Purpose**: Set container environment variables
- **Format**:
```yaml
environment:
  PUID: "1000"
  PGID: "1000"
  TZ: "America/New_York"
  CUSTOM_VAR: "value with spaces"
```
- **Common Variables**:
  - `PUID`/`PGID`: User/Group IDs (LinuxServer images)
  - `TZ`: Timezone
  - App-specific configuration

### Service x-casaos Fields

#### `x-casaos.ports` (Required if service has ports)
- **Type**: Array of objects
- **Purpose**: Describe ports for CasaOS UI
- **Structure**:
```yaml
x-casaos:
  ports:
    - container: "8080"     # Must match a port's target
      description:
        en_us: "WebUI HTTP Port"
```
- **Rules**:
  - Every port in `ports` should have corresponding entry
  - `container` value must match `target` from `ports` section
  - Description helps users understand port purpose

#### `x-casaos.volumes` (Required if service has volumes)
- **Type**: Array of objects
- **Purpose**: Describe volumes for CasaOS UI
- **Structure**:
```yaml
x-casaos:
  volumes:
    - container: /config    # Must match a volume's target
      description:
        en_us: "Configuration directory"
```
- **Rules**:
  - Should describe each important volume
  - `container` must match volume `target`
  - Helps users understand what data is stored

### Root x-casaos Fields

#### `architectures` (Required)
- **Type**: Array of strings
- **Options**: `amd64`, `arm64`, `arm`, `arm/v7`, `arm/v6`
- **Purpose**: CPU architectures the image supports
- **Example**: `["amd64", "arm64", "arm"]`
- **How to Determine**:
  - Check Docker Hub image page
  - LinuxServer images usually support all three
  - Official images often list supported architectures

#### `main` (Required)
- **Type**: String
- **Purpose**: Identifies the primary service
- **Value**: Must match a service name from `services`
- **Example**: If service is named `jellyfin`, use `main: jellyfin`
- **Single Service**: Same as service name
- **Multi-Service**: The service with the web UI

#### `store_app_id` (Required)
- **Type**: String
- **Purpose**: Unique identifier in AppStore
- **Format**: Same as `name` - lowercase, no spaces
- **Must Match**: The `name` field value
- **Example**: `jellyfin`, `nextcloud`, `home-assistant`

#### `category` (Required)
- **Type**: String
- **Purpose**: App categorization in AppStore
- **Official Categories**:
  - Analytics
  - Backup
  - Blog
  - Chat
  - Cloud
  - Developer
  - CRM
  - Documents
  - Email
  - File Sync
  - Finance
  - Forum
  - Gallery
  - Games
  - Learning
  - Media
  - Notes
  - Project Management
  - VPN
  - WEB
  - WiKi
  - Dapps
  - Downloader
  - Utilities
  - Home Automation
  - Network
  - Database
  - AI
- **Rules**:
  - Use exact capitalization from official list
  - Can create custom categories in third-party stores
  - Choose the most fitting category

#### `author` (Required)
- **Type**: String
- **Purpose**: Person/organization who created the YAML
- **Example**: `"Community"`, `"BigBearTechWorld"`, `"YourName"`
- **Not**: The software developer (use `developer` for that)

#### `developer` (Required)
- **Type**: String
- **Purpose**: Original software developer/company
- **Example**: `"Jellyfin Team"`, `"Nextcloud"`, `"Home Assistant"`
- **How to Find**: Usually on the software's official website

#### `icon` (Required)
- **Type**: String (URL)
- **Purpose**: App icon displayed in AppStore
- **Recommended Source**: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/{app-name}.png`
- **Format**: PNG preferred, square ratio
- **Size**: 256x256px or 512x512px recommended
- **Example**: `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/jellyfin.png`
- **Fallback**: Direct link to GitHub or official site

#### `thumbnail` (Optional)
- **Type**: String (URL)
- **Purpose**: Larger preview image
- **Common Practice**: Leave as empty string `""`
- **When Used**: For featured apps or detailed previews

#### `title` (Required)
- **Type**: Object with language keys
- **Purpose**: Display name in CasaOS UI
- **Structure**:
```yaml
title:
  en_us: "Jellyfin Media Server"
```
- **Rules**:
  - Key is always lowercase `en_us`
  - Value is human-readable display name
  - Can include spaces, proper capitalization

#### `tagline` (Required)
- **Type**: Object with language keys
- **Purpose**: Short one-line description
- **Structure**:
```yaml
tagline:
  en_us: "The Free Software Media System"
```
- **Best Practices**:
  - Keep under 60 characters
  - Descriptive but concise
  - Often the official project tagline

#### `description` (Required)
- **Type**: Object with language keys, multi-line string
- **Purpose**: Detailed app description
- **Structure**:
```yaml
description:
  en_us: |
    Full description of the application.
    
    Can include multiple paragraphs, features, and details.
    Use markdown-style formatting where appropriate.
```
- **Best Practices**:
  - 2-4 paragraphs ideal
  - Include key features
  - Mention any special requirements
  - Add links to documentation if helpful

#### `screenshot_link` (Optional)
- **Type**: Array of strings (URLs)
- **Purpose**: Show app screenshots in AppStore
- **Example**:
```yaml
screenshot_link:
  - https://example.com/screenshot1.png
  - https://example.com/screenshot2.png
```
- **Common Practice**: Often left as empty array `[]`

#### `tips` (Optional)
- **Type**: Object with two possible sub-objects
- **Purpose**: Display important information to users
- **Structure**:
```yaml
tips:
  before_install:
    en_us: |
      Important information shown before installation.
      Use for prerequisites, warnings, or setup steps.
  custom:
    en_us: |
      Custom tips shown after installation.
      Use for first-time setup instructions or credentials.
```
- **When to Use**:
  - `before_install`: Prerequisites, system requirements, warnings
  - `custom`: Default credentials, next steps, configuration hints
- **Can Omit**: If no special information needed, omit entirely

#### `port_map` (Required for UI apps)
- **Type**: String (number as string)
- **Purpose**: Default port for WebUI access
- **Example**: `"8080"`, `"9000"`, `"80"`
- **Rules**:
  - Must be a string, not integer
  - Should match one of the published ports
  - Used to construct WebUI button link

#### `scheme` (Required for UI apps)
- **Type**: String
- **Options**: `http` or `https`
- **Purpose**: Protocol for WebUI access
- **Used With**: `port_map` to create full URL
- **Example**: With `scheme: http` and `port_map: "8080"`, CasaOS creates `http://server-ip:8080{index}`

#### `index` (Required for UI apps)
- **Type**: String
- **Purpose**: Path appended to WebUI URL
- **Examples**:
  - `"/"` - Root path (most common)
  - `"/admin"` - Admin interface
  - `"/web"` - Web UI path
- **Default**: Usually `"/"`

---

## Multi-Service Apps

Some applications require multiple containers (e.g., app + database). CasaOS supports this through multiple service definitions.

### Multi-Service Structure

```yaml
name: multi-app
services:
  app:                          # Main application service
    container_name: app
    image: app/image:latest
    depends_on:
      - db                      # Wait for database
    network_mode: bridge
    ports:
      - target: 8080
        published: "8080"
        protocol: tcp
    environment:
      DB_HOST: db
      DB_NAME: appdb
    x-casaos:
      ports:
        - container: "8080"
          description:
            en_us: "WebUI"
  
  db:                           # Database service
    container_name: app-db
    image: postgres:15
    network_mode: bridge
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - type: bind
        source: /DATA/AppData/$AppID/db
        target: /var/lib/postgresql/data
    x-casaos:
      volumes:
        - container: /var/lib/postgresql/data
          description:
            en_us: "Database files"

x-casaos:
  main: app                     # Points to main service
  # ... rest of metadata applies to whole app
```

### Multi-Service Rules

1. **Main Service**: 
   - The `main` field must reference the primary service (usually the one with WebUI)
   - This service's ports are used for the "Open" button

2. **Shared Network**:
   - Services can communicate using container names as hostnames
   - Use same `network_mode` for all services unless specific reason
   - For custom networks, define in `networks` section

3. **Dependencies**:
   - Use `depends_on` to control startup order
   - Database should start before app

4. **Naming Convention**:
   - Secondary services: `{appname}-{service}` (e.g., `nextcloud-db`)
   - Keeps containers organized

5. **Volume Organization**:
   - Each service should have its own subdirectory under `/DATA/AppData/$AppID/`
   - Example: `/DATA/AppData/nextcloud/app`, `/DATA/AppData/nextcloud/db`

6. **Single x-casaos Root**:
   - Only ONE `x-casaos` section at root level
   - Service-level `x-casaos` for each service as needed

### Common Multi-Service Patterns

#### App + Database
```yaml
services:
  app:
    # ... app definition
  db:
    # ... database definition
```

#### App + Database + Cache
```yaml
services:
  app:
    # ... app definition
  db:
    # ... database definition
  redis:
    # ... cache definition
```

#### Load Balanced Services
```yaml
services:
  nginx:
    # ... reverse proxy
  app1:
    # ... app instance 1
  app2:
    # ... app instance 2
```

---

## Validation Rules

### Required Field Checklist

**Root Level:**
- [ ] `name` - Lowercase, no spaces
- [ ] `services` - At least one service
- [ ] `x-casaos` - Metadata object

**Per Service:**
- [ ] `container_name`
- [ ] `image`
- [ ] `restart: unless-stopped`
- [ ] `network_mode` - bridge or host
- [ ] If bridge: `ports` array
- [ ] Persistence: `volumes` array
- [ ] Service `x-casaos` with port/volume descriptions

**Root x-casaos:**
- [ ] `architectures` array
- [ ] `main` - matches a service name
- [ ] `store_app_id` - matches `name`
- [ ] `category`
- [ ] `author`
- [ ] `developer`
- [ ] `icon` URL
- [ ] `title.en_us`
- [ ] `tagline.en_us`
- [ ] `description.en_us`
- [ ] For UI apps: `port_map`, `scheme`, `index`

### Common Validation Errors

1. **Port Mismatch**: Port in `x-casaos.ports.container` doesn't match any `ports.target`
2. **Volume Mismatch**: Volume in `x-casaos.volumes.container` doesn't match any `volumes.target`
3. **Main Service Invalid**: `x-casaos.main` references non-existent service
4. **Name Mismatch**: `name` and `store_app_id` don't match
5. **Memory Format**: Memory not in `{number}M` format
6. **Case Sensitivity**: `en_us` vs `en_US` (should always be lowercase)
7. **Port Types**: `target` as string instead of integer, `published` as integer instead of string

---

## Best Practices

### 1. Naming Conventions

- **AppID Format**: lowercase, hyphens for spaces (e.g., `home-assistant`)
- **Container Names**: Match the AppID or use `{appid}-{service}` for multi-service
- **Volume Paths**: `/DATA/AppData/$AppID/{purpose}` (e.g., `/DATA/AppData/jellyfin/config`)

### 2. Port Selection

- **Check Defaults**: Use application's default port when possible
- **Avoid Conflicts**: Common ports like 80, 443, 3000 may conflict
- **Document**: Always describe port purpose in `x-casaos.ports.description`

### 3. Volume Management

- **Organize Data**: Separate `config`, `data`, `cache` into subdirectories
- **Use Variables**: Always use `/DATA/AppData/$AppID/` prefix
- **Absolute Paths**: Always use absolute paths for bind mounts

### 4. Environment Variables

- **LinuxServer Images**: Include `PUID=1000`, `PGID=1000`, `TZ=Etc/UTC`
- **Secrets**: Don't hardcode passwords; use placeholder values with tips
- **Documentation**: Explain important variables in description or tips

### 5. Memory Allocation

- **Research**: Check image documentation for minimum requirements
- **Common Values**: 
  - Lightweight apps: 128M-256M
  - Medium apps: 512M-1024M
  - Heavy apps: 2048M+
- **Use 0M**: If unsure, use `0M` for no reservation

### 6. Icon Selection

- **Primary Source**: homarr-labs dashboard-icons on GitHub
- **Format**: PNG, square, transparent background
- **Size**: 256x256 or 512x512
- **Fallback**: Official project icon or well-known icon source

### 7. Description Writing

- **First Paragraph**: What the app does (from user perspective)
- **Second Paragraph**: Key features or use cases
- **Third Paragraph**: Technical notes or requirements (if any)
- **Keep Concise**: 2-4 paragraphs ideal

### 8. Tips Usage

- **before_install**: Use for:
  - System requirements
  - Port conflicts warnings
  - Prerequisites
  - Important security notes
- **custom**: Use for:
  - Default credentials
  - First-time setup steps
  - Configuration hints
  - Documentation links

### 9. Testing

Before submitting:
1. Validate YAML syntax
2. Check all required fields present
3. Verify port/volume descriptions match actual definitions
4. Test installation in CasaOS
5. Verify WebUI access works
6. Check data persistence (stop/start container)

---

## Common Patterns

### Pattern 1: Simple Web Application

```yaml
name: simple-app
services:
  simple-app:
    container_name: simple-app
    image: namespace/simple-app:latest
    deploy:
      resources:
        reservations:
          memory: 256M
    restart: unless-stopped
    network_mode: bridge
    ports:
      - target: 8080
        published: "8080"
        protocol: tcp
    volumes:
      - type: bind
        source: /DATA/AppData/$AppID/config
        target: /config
    environment:
      TZ: Etc/UTC
    x-casaos:
      ports:
        - container: "8080"
          description:
            en_us: "Web Interface"
      volumes:
        - container: /config
          description:
            en_us: "Config directory"
x-casaos:
  architectures:
    - amd64
    - arm64
  main: simple-app
  store_app_id: simple-app
  category: Utilities
  author: Community
  developer: Simple App Team
  icon: https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/simple-app.png
  thumbnail: ""
  title:
    en_us: "Simple App"
  tagline:
    en_us: "A simple application example"
  description:
    en_us: |
      Simple App is an example application.
  screenshot_link: []
  port_map: "8080"
  scheme: http
  index: /
```

### Pattern 2: LinuxServer.io Image

```yaml
name: linuxserver-app
services:
  linuxserver-app:
    container_name: linuxserver-app
    image: linuxserver/app:latest
    deploy:
      resources:
        reservations:
          memory: 512M
    restart: unless-stopped
    network_mode: bridge
    ports:
      - target: 80
        published: "8080"
        protocol: tcp
    volumes:
      - type: bind
        source: /DATA/AppData/$AppID/config
        target: /config
      - type: bind
        source: /DATA/Media
        target: /media
    environment:
      PUID: "1000"
      PGID: "1000"
      TZ: Etc/UTC
    x-casaos:
      ports:
        - container: "80"
          description:
            en_us: "WebUI"
      volumes:
        - container: /config
          description:
            en_us: "Config files"
        - container: /media
          description:
            en_us: "Media files"
x-casaos:
  # ... standard metadata
```

### Pattern 3: Host Network Mode

```yaml
name: host-network-app
services:
  host-network-app:
    container_name: host-network-app
    image: namespace/app:latest
    deploy:
      resources:
        reservations:
          memory: 256M
    restart: unless-stopped
    network_mode: host        # No ports section needed
    volumes:
      - type: bind
        source: /DATA/AppData/$AppID/config
        target: /config
    environment:
      TZ: Etc/UTC
    x-casaos:
      volumes:
        - container: /config
          description:
            en_us: "Config directory"
x-casaos:
  # ... metadata
  port_map: "8080"  # App listens on this port on host
  scheme: http
  index: /
```

### Pattern 4: App with Database

```yaml
name: app-with-db
services:
  app:
    container_name: app-with-db
    image: namespace/app:latest
    depends_on:
      - db
    deploy:
      resources:
        reservations:
          memory: 512M
    restart: unless-stopped
    network_mode: bridge
    ports:
      - target: 8080
        published: "8080"
        protocol: tcp
    volumes:
      - type: bind
        source: /DATA/AppData/$AppID/app
        target: /data
    environment:
      DB_HOST: db
      DB_NAME: appdb
      DB_USER: appuser
      DB_PASSWORD: changeme
    x-casaos:
      ports:
        - container: "8080"
          description:
            en_us: "WebUI"
      volumes:
        - container: /data
          description:
            en_us: "App data"
  
  db:
    container_name: app-with-db-postgres
    image: postgres:15
    deploy:
      resources:
        reservations:
          memory: 256M
    restart: unless-stopped
    network_mode: bridge
    volumes:
      - type: bind
        source: /DATA/AppData/$AppID/db
        target: /var/lib/postgresql/data
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: changeme
    x-casaos:
      volumes:
        - container: /var/lib/postgresql/data
          description:
            en_us: "Database files"

x-casaos:
  main: app
  # ... rest of metadata
```

---

##