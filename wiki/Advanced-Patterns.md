# Advanced Patterns & Architectures

Go beyond single-service apps. This page covers sophisticated configurations for complex applications.

---

## Custom Networks: Multi-Service Communication

For apps with multiple interconnected services, custom networks provide fine-grained control over which services can reach each other.

### Network Architecture Pattern

```yaml
name: complex-app
services:
  frontend:
    container_name: frontend
    image: nginx:latest
    networks:
      - frontend-net            # Only frontend-net
    ports:
      - target: 80
        published: "80"
        protocol: tcp
    x-casaos:
      ports:
        - container: "80"
          description:
            en_us: "Web Interface"
  
  backend:
    container_name: backend
    image: myapp/backend:latest
    networks:
      - frontend-net            # Can reach frontend
      - backend-net             # Can reach database
    x-casaos:
      volumes: []
  
  database:
    container_name: database
    image: postgres:15
    networks:
      - backend-net             # Only backend-net (isolated)
    volumes:
      - type: bind
        source: /DATA/AppData/$AppID/db
        target: /var/lib/postgresql/data
    x-casaos:
      volumes:
        - container: /var/lib/postgresql/data
          description:
            en_us: "Database files"

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true              # No external access to backend

x-casaos:
  main: frontend
  store_app_id: complex-app
  # ... rest of metadata
```

### Key Concepts

**Network Membership:**
- Services in the same network can reach each other by container name (e.g., `backend` can reach `database` via hostname `database`)
- Services in different networks **cannot** reach each other
- Only services with `published` ports are accessible from the host

**Internal Networks:**
- `internal: true` prevents external access
- Useful for database-only networks
- Adds security layer: database can't be accidentally exposed

**Multi-Network Services:**
- A service can join multiple networks
- `backend` bridges the frontend and database networks
- Useful for microservices with multiple roles

---

## Health Checks: Automated Reliability

Health checks let CasaOS monitor app status and restart unhealthy containers:

```yaml
services:
  app:
    container_name: app
    image: myapp:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s             # Check every 30 seconds
      timeout: 10s              # Wait 10 seconds for response
      retries: 3                # Mark unhealthy after 3 failures
      start_period: 40s         # Allow 40s for app startup
    x-casaos:
      ports:
        - container: "8080"
          description:
            en_us: "WebUI"
```

### Health Check Types

**HTTP Check (Recommended)**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
```

**TCP Check (Database, Caching)**
```yaml
healthcheck:
  test: ["CMD", "nc", "-z", "localhost", "5432"]
```

**Shell Command Check**
```yaml
healthcheck:
  test: ["CMD-SHELL", "ps aux | grep myapp || exit 1"]
```

**Script Check**
```yaml
healthcheck:
  test: ["CMD", "/app/healthcheck.sh"]
```

### Timing Strategy

| Aspect | Recommendation | Example |
|--------|-----------------|----------|
| `interval` | 30-60 seconds | 30s for quick detection |
| `timeout` | 10% of interval | 3s for quick responses |
| `retries` | 2-3 failures | 3 retries = 90s total |
| `start_period` | App startup time | 40s for Java apps |

---

## Resource Limits: Memory and CPU Caps

Set hard limits on resource consumption:

```yaml
services:
  app:
    container_name: app
    image: myapp:latest
    deploy:
      resources:
        reservations:
          memory: 512M            # Try to keep 512M available
        limits:
          memory: 1024M           # Never use more than 1024M
          cpus: '2.0'             # Never use more than 2 CPU cores
    x-casaos:
      volumes: []
```

### Reservation vs. Limit

| Field | Meaning | Enforcement |
|-------|---------|-------------|
| `reservations.memory` | Soft: "keep this available" | CasaOS scheduling |
| `limits.memory` | Hard: "never exceed this" | Kernel OOM killer |
| `limits.cpus` | Hard: "never exceed this" | CPU throttling |

### Strategy

- **Set reservation:** For baseline requirement
- **Set limit:** If app is runaway-prone (e.g., memory leak)
- **Don't exceed available system resources** (reservation + others ≤ total RAM)

---

## Logging Configuration: Manage Output

Control how containers log and prevent disk filling:

```yaml
services:
  app:
    container_name: app
    image: myapp:latest
    logging:
      driver: "json-file"
      options:
        max-size: "10m"         # Rotate log when it reaches 10MB
        max-file: "3"           # Keep 3 log files (30MB total)
        labels: "service=myapp"
    x-casaos:
      volumes: []
```

### Driver Options

**JSON File (Default)**
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

**Splunk**
```yaml
logging:
  driver: "splunk"
  options:
    splunk-token: "secret-token"
    splunk-url: "https://your-splunk:8088"
```

**Syslog**
```yaml
logging:
  driver: "syslog"
  options:
    syslog-address: "udp://localhost:514"
```

---

## Linux Capabilities: Fine-Grained Permissions

Grant specific permissions without running as root:

```yaml
services:
  vpn-app:
    container_name: vpn-app
    image: vpn:latest
    cap_add:
      - NET_ADMIN              # Network administration
      - NET_RAW                # Raw socket access
    # cap_drop drops capabilities (defensive)
    cap_drop:
      - ALL                    # Start with nothing
    x-casaos:
      volumes: []
```

### Common Capabilities

| Capability | Use Case |
|------------|----------|
| `NET_ADMIN` | VPN, network management |
| `NET_RAW` | ICMP (ping), raw packets |
| `SYS_ADMIN` | Advanced system operations |
| `DAC_OVERRIDE` | Bypass file permissions |
| `CHOWN` | Change file ownership |

### Best Practice

```yaml
# Start restrictive, add only what's needed
cap_drop:
  - ALL
cap_add:
  - NET_ADMIN
```

---

## Device Mounts: GPU and Hardware

Give containers access to host hardware:

```yaml
services:
  media-server:
    container_name: media-server
    image: jellyfin:latest
    devices:
      - /dev/dri:/dev/dri     # GPU (Intel/AMD)
      - /dev/nvidia0:/dev/nvidia0  # NVIDIA GPU
    x-casaos:
      volumes: []

  automation:
    container_name: automation
    image: home-assistant:latest
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0  # USB device (Z-Wave dongle)
      - /dev/ttyUSB1:/dev/ttyUSB1  # Another USB device
    x-casaos:
      volumes: []
```

### Device Mapping Format

```yaml
devices:
  - /dev/source:/dev/container-path    # Host device : Container device
```

### Common Devices

| Device | Purpose | Example |
|--------|---------|----------|
| `/dev/dri/*` | Intel/AMD GPU | Hardware transcoding |
| `/dev/nvidia*` | NVIDIA GPU | CUDA acceleration |
| `/dev/ttyUSB*` | USB serial | Z-Wave, Zigbee, etc. |
| `/dev/ttyACM*` | USB serial (alternate) | Arduino, modems |
| `/dev/mem` | Physical memory | Low-level hardware |

**Security Warning:** Device access bypasses container isolation. Use only when necessary.

---

## Dependencies and Startup Order

Control service startup sequence:

```yaml
services:
  app:
    container_name: app
    image: myapp:latest
    depends_on:
      db:
        condition: service_started    # Wait for db to start
      cache:
        condition: service_healthy    # Wait for cache health check to pass
    x-casaos:
      ports:
        - container: "8080"
          description:
            en_us: "WebUI"
  
  db:
    container_name: app-db
    image: postgres:15
    x-casaos:
      volumes: []
  
  cache:
    container_name: app-cache
    image: redis:latest
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
    x-casaos:
      volumes: []
```

### Conditions

| Condition | Meaning |
|-----------|----------|
| `service_started` | Service container has started (not necessarily ready) |
| `service_healthy` | Service reports healthy via health check |
| `service_completed_successfully` | Service completed and exited (one-time jobs) |

---

## Environment Variable Injection Patterns

Manage configuration across services:

### Pattern 1: Cross-Service Variables

```yaml
services:
  app:
    image: myapp:latest
    environment:
      DB_HOST: db               # Service name as hostname
      DB_PORT: "5432"
      DB_NAME: appdb
      CACHE_HOST: redis
      CACHE_PORT: "6379"
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: appdb        # Must match app's DB_NAME
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secret-password
  
  redis:
    image: redis:latest
```

### Pattern 2: Secrets (Non-Hardcoded)

```yaml
services:
  app:
    image: myapp:latest
    environment:
      # Use placeholder values, document in tips
      ADMIN_PASSWORD: "change-me-after-install"
      API_KEY: "get-from-settings-after-install"

x-casaos:
  tips:
    before_install:
      en_us: |
        You'll need to configure:
        1. Admin password (change after first login)
        2. API key from settings dashboard
    custom:
      en_us: |
        After installation:
        1. Access the WebUI
        2. Set your admin password
        3. Generate API key in Settings
```

---

## Migration Patterns: Docker Run to CasaOS

### From Docker Run

```bash
# Original command
docker run -d \
  --name=jellyfin \
  -p 8096:8096 \
  -v /path/to/config:/config \
  -v /path/to/media:/media \
  -e PUID=1000 \
  -e PGID=1000 \
  jellyfin/jellyfin:latest
```

**Converts to:**

```yaml
name: jellyfin
services:
  jellyfin:
    container_name: jellyfin
    image: jellyfin/jellyfin:latest
    restart: unless-stopped        # Added (CasaOS requirement)
    network_mode: bridge            # Added (CasaOS requirement)
    deploy:
      resources:
        reservations:
          memory: 0M                # Added (CasaOS requirement)
    ports:
      - target: 8096
        published: "8096"
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
    x-casaos:
      ports:
        - container: "8096"
          description:
            en_us: "Jellyfin WebUI"
      volumes:
        - container: /config
          description:
            en_us: "Jellyfin configuration"
        - container: /media
          description:
            en_us: "Media library"

x-casaos:
  architectures: [amd64, arm64]
  main: jellyfin
  store_app_id: jellyfin
  category: Media
  author: Community
  developer: Jellyfin Team
  icon: https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/jellyfin.png
  thumbnail: ""
  title:
    en_us: "Jellyfin"
  tagline:
    en_us: "The Free Software Media System"
  description:
    en_us: |
      Jellyfin is the volunteer-built media solution that puts you in control.
  port_map: "8096"
  scheme: http
  index: /
```

### Conversion Checklist

1. **Docker Compose Structure**
   - [ ] Add `name` at root
   - [ ] Add `restart: unless-stopped`
   - [ ] Add `network_mode: bridge`
   - [ ] Add `deploy.resources.reservations.memory`

2. **Port Syntax**
   - [ ] Convert short syntax (`-p 8080:8080`) to long syntax
   - [ ] Make sure `target` is integer, `published` is string

3. **Volume Syntax**
   - [ ] Convert short syntax (`-v /path:/path`) to long syntax
   - [ ] Use `/DATA/AppData/$AppID/` prefix

4. **Metadata**
   - [ ] Add service-level `x-casaos` for ports/volumes
   - [ ] Add root-level `x-casaos` with full metadata

---

## Next Steps

- **Need help with something specific?** → [Troubleshooting & Advanced Setups](./Troubleshooting-Advanced-Setups)
- **Back to basics?** → [CasaOS Concepts](./CasaOS-Concepts)
- **Looking up a field?** → [Ultimate Guide](./Ultimate-Guide)
