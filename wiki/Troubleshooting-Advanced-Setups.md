# Troubleshooting & Advanced Setups

Diagnose problems, understand common failures, and learn migration strategies.

---

## Troubleshooting Flowchart

**App won't start** → Check memory, env vars, volumes, ports

**WebUI button doesn't work** → Check port_map, scheme, index, service listening

**Data lost on restart** → Check volumes defined and writable

**Can't reach other containers** → Check network_mode, container names, networks

**Permission denied errors** → Check PUID/PGID, host permissions, SELinux/AppArmor

---

## Issue: App Won't Start

**Symptoms:** Container exits immediately or crashes. Logs show quick termination.

### Diagnostic Checklist

**1. Memory Allocation Too Low**
```bash
# Check container memory in CasaOS UI
# If app needs 512M but only has 256M allocated, increase it
```

**In YAML:**
```yaml
deploy:
  resources:
    reservations:
      memory: 512M              # Increase from 256M
```

**2. Missing Required Environment Variables**
```bash
# Check app documentation for required env vars
# Example: Database apps need DB_* variables
```

**In YAML:**
```yaml
environment:
  DB_HOST: db                   # Add required variables
  DB_USER: admin
  DB_PASS: password
```

**3. Volume Permission Issues**
```bash
# Ensure host directory exists and is writable
sudo mkdir -p /DATA/AppData/myapp/config
sudo chmod 755 /DATA/AppData/myapp/config
```

**In YAML:**
```yaml
volumes:
  - type: bind
    source: /DATA/AppData/$AppID/config
    target: /config
```

**4. Port Already in Use**
```bash
# Check if port is already bound
sudo netstat -tlnp | grep 8080
```

**Solution:** Change `published` port:
```yaml
ports:
  - target: 8080
    published: "8081"          # Use different port
    protocol: tcp
```

**5. Image Not Found**
```yaml
image: myapp:latest            # Does this image exist?
```

Check Docker Hub or your registry for the correct image name and tag.

---

## Issue: WebUI Button Doesn't Work

**Symptoms:** "Open" button in CasaOS leads to 404, connection refused, or wrong URL.

### Diagnostic Checklist

**1. Port Map Doesn't Match Published Port**
```yaml
ports:
  - target: 8080
    published: "9090"          # Host port
    protocol: tcp

x-casaos:
  port_map: "9090"             # Must match published, not target
```

**2. Scheme is Wrong**
```yaml
# If app uses HTTPS:
scheme: https                   # Not http

# If app uses HTTP:
scheme: http                    # Not https
```

**3. Index Path is Wrong**
```yaml
index: /admin                   # If WebUI is at /admin, not /

# Common examples:
index: /                        # Root (most common)
index: /web                     # Subfolder
index: /admin                   # Admin interface
```

**4. Service Isn't Actually Listening**
```bash
# Inside container, check if app is listening
docker exec myapp-container netstat -tlnp
```

If port isn't in the list, the app crashed or didn't start correctly.

---

## Issue: Data Not Persisting

**Symptoms:** Settings/data lost after container restart or removal.

### Diagnostic Checklist

**1. Volumes Not Defined**
```yaml
# ❌ Wrong: No volumes
services:
  app:
    image: myapp:latest
    # Missing volumes section!

# ✅ Correct: Volumes defined
services:
  app:
    image: myapp:latest
    volumes:
      - type: bind
        source: /DATA/AppData/$AppID/config
        target: /config
```

**2. Source Path Doesn't Exist**
```bash
# Ensure host directory exists
ls -la /DATA/AppData/myapp/config

# If it doesn't exist, create it
sudo mkdir -p /DATA/AppData/myapp/config
```

**3. Target Path Doesn't Match App's Data Directory**
```yaml
# ❌ Wrong: App stores data in /data, we mount /config
volumes:
  - type: bind
    target: /config

# ✅ Correct: Mount where app actually stores data
volumes:
  - type: bind
    target: /data               # Check app documentation
```

**To find where app stores data:**
- Check app documentation
- Look at Dockerfile `WORKDIR` or `VOLUME` statements
- Search GitHub issues

**4. Volume is Read-Only Unintentionally**
```yaml
# ❌ Wrong: Volume mounted read-only
volumes:
  - type: bind
    source: /DATA/AppData/$AppID/config
    target: /config
    read_only: true             # App can't write!

# ✅ Correct: Writable volume
volumes:
  - type: bind
    source: /DATA/AppData/$AppID/config
    target: /config
    read_only: false            # Or omit (default is writable)
```

---

## Issue: Network Connectivity Problems

**Symptoms:** Can't reach other containers, no internet access, DNS resolution fails.

### Diagnostic Checklist

**1. Wrong Network Mode**
```yaml
# ❌ If using custom networks but network_mode is bridge:
network_mode: bridge            # Won't work with custom networks!

# ✅ Correct: Either remove network_mode or ensure consistency
network_mode: bridge            # For standard bridge
# Then reference in services:
networks:
  - my-network
```

**2. Services Can't Find Each Other**
```yaml
# Services communicate by container name as hostname
services:
  app:
    environment:
      DB_HOST: db               # Use container name, not IP
  db:
    container_name: db          # Must match the hostname
```

**3. Custom Networks Not Defined**
```yaml
# ❌ Wrong: Reference network that doesn't exist
services:
  app:
    networks:
      - backend-net             # This network doesn't exist!

# ✅ Correct: Define networks at root level
networks:
  backend-net:
    driver: bridge

services:
  app:
    networks:
      - backend-net             # Now it exists
```

**4. DNS Resolution Fails**
```bash
# Inside container, test DNS
docker exec myapp nslookup db
```

If this fails, check:
- Network driver (should be `bridge`)
- DNS settings in CasaOS configuration
- Host DNS (`/etc/resolv.conf`)

**5. Firewall Rules Blocking Traffic**
```bash
# Check if host firewall allows traffic
sudo iptables -L

# On systems with UFW:
sudo ufw status
```

If blocked, allow internal traffic:
```bash
sudo ufw allow from 172.16.0.0/12 to 172.16.0.0/12  # Docker subnet
```

---

## Issue: Permission Errors

**Symptoms:** "Permission denied", "Can't write to /config", "Access denied".

### Diagnostic Checklist

**1. LinuxServer Images: PUID/PGID Not Set**

**Problem:** LinuxServer images run as non-root user. If host permissions don't match, app can't write.

```yaml
# ❌ Wrong: Missing PUID/PGID
environment:
  TZ: Etc/UTC
  # Missing PUID/PGID!

# ✅ Correct: Set PUID/PGID
environment:
  PUID: "1000"                 # Match host user ID
  PGID: "1000"                 # Match host group ID
  TZ: Etc/UTC
```

**Find your PUID/PGID:**
```bash
id                             # Shows current user's IDs
# Output: uid=1000(user) gid=1000(user) groups=1000(user)
```

**2. Host Directory Permissions Too Restrictive**

```bash
# Check current permissions
ls -la /DATA/AppData/myapp/config

# If not writable, fix it
sudo chown -R 1000:1000 /DATA/AppData/myapp/config
sudo chmod 755 /DATA/AppData/myapp/config
```

**3. SELinux or AppArmor Blocking Access**

```bash
# Check if SELinux is enabled
getenforce

# If Enforcing, you may need to relabel paths
sudo chcon -R -t svirt_sandbox_file_t /DATA/AppData/myapp/
```

```bash
# Check AppArmor
sudo aa-status

# AppArmor profiles may restrict container access
# Check container logs for AppArmor denial messages
```

**4. Non-Root User Can't Write**

```bash
# For apps that need specific users (not 1000:1000):
# Check app documentation for required user
# Then set PUID/PGID accordingly
```

---

## Issue: Multi-Service Communication Failures

**Symptoms:** Backend can't reach database, services see connection refused.

### Diagnostic Checklist

**1. Services Not on Same Network**

```yaml
# ❌ Wrong: Services on different networks
services:
  app:
    networks:
      - frontend-net
  db:
    networks:
      - backend-net             # Different network!

# ✅ Correct: Shared network for services that need to communicate
networks:
  app-net:
    driver: bridge

services:
  app:
    networks:
      - app-net
  db:
    networks:
      - app-net                 # Same network
```

**2. Incorrect Hostname Reference**

```yaml
# ❌ Wrong: Using IP address (fragile)
environment:
  DB_HOST: "172.18.0.2"        # IPs change!

# ✅ Correct: Use container name
environment:
  DB_HOST: db                   # Container name is hostname
```

**3. Startup Order: App Before Database**

```yaml
# ❌ Wrong: No dependency control
services:
  app:
    image: myapp:latest         # May start before db!
  db:
    image: postgres:15

# ✅ Correct: Use depends_on
services:
  app:
    depends_on:
      db:
        condition: service_started  # Wait for db to start
  db:
    image: postgres:15
```

**4. Internal Networks Blocking External Access**

```yaml
# If using internal network:
networks:
  db-net:
    driver: bridge
    internal: true              # No external access

services:
  db:
    networks:
      - db-net
```

**This prevents database from reaching internet.** This is usually intended (for security), but verify it's what you want.

---

## Store-Specific Considerations

### Official IceWhaleTech Store

**Strictest Requirements:**
- All required fields must be present
- Only use predefined categories
- Descriptions should be professional
- Icon must be from `cdn.jsdelivr.net` (preferred)
- Must follow naming conventions exactly

**Review Process:**
- Manual review of every submission
- May request changes before acceptance
- Takes longer but reaches official audience

### Third-Party Stores (BigBearTechWorld, etc.)

**More Flexible:**
- Can create custom categories
- Experimental/niche apps welcome
- Faster approval process
- Community-focused

**YAML Differences:**
- Can omit optional fields
- Custom naming allowed
- More permissive on icon sources

### Personal/Private Stores

**Full Freedom:**
- No restrictions on categories
- Can test incomplete apps
- Good for internal use
- Rapid iteration

---

## Common Validation Errors & Fixes

### Error: Port Mismatch

```
❌ Port 8080 in x-casaos doesn't match any port definition
```

**Fix:**
```yaml
ports:
  - target: 8080
    published: "8080"

x-casaos:
  ports:
    - container: "8080"         # Must match target
```

### Error: Main Service Not Found

```
❌ x-casaos.main references non-existent service 'app'
```

**Fix:**
```yaml
services:
  myapp:                        # Service name
    # ...

x-casaos:
  main: myapp                   # Must match service name
```

### Error: Name Mismatch

```
❌ name and store_app_id must be identical
```

**Fix:**
```yaml
name: myapp
x-casaos:
  store_app_id: myapp           # Must match name
```

### Error: Volume Mismatch

```
❌ Volume /config in x-casaos doesn't match any volume target
```

**Fix:**
```yaml
volumes:
  - type: bind
    target: /config             # Container path

x-casaos:
  volumes:
    - container: /config        # Must match target
```

### Error: Memory Format Wrong

```
❌ Memory must be in format {number}M
```

**Fix:**
```yaml
# ❌ Wrong
memory: 512MB
memory: 0.5G
memory: "512 M"

# ✅ Correct
memory: 512M
memory: 1024M
memory: 0M
```

### Error: Case Sensitivity

```
❌ Language key must be lowercase 'en_us', not 'en_US'
```

**Fix:**
```yaml
# ❌ Wrong
title:
  en_US: "My App"

# ✅ Correct
title:
  en_us: "My App"
```

---

## Testing Checklist Before Deployment

- [ ] YAML syntax is valid (no indentation errors)
- [ ] All required fields present
- [ ] Name and store_app_id match
- [ ] Main service exists and references valid service
- [ ] All ports in x-casaos match actual port definitions
- [ ] All volumes in x-casaos match actual volume definitions
- [ ] Memory in `{number}M` format
- [ ] All language codes lowercase (`en_us`)
- [ ] Icon URL is accessible
- [ ] Service definitions are complete and valid
- [ ] App installs without errors
- [ ] WebUI is accessible via "Open" button
- [ ] Data persists after container restart
- [ ] Multi-service apps have proper depends_on

---

## Next Steps

- **Still stuck?** Check [Advanced Patterns](./Advanced-Patterns) for sophisticated setups
- **Want to understand concepts better?** → [CasaOS Concepts](./CasaOS-Concepts)
- **Looking up a specific field?** → [Ultimate Guide](./Ultimate-Guide)
