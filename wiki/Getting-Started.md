# Getting Started with CasaOS Generator

This guide walks you through setting up and using **CasaOS Generator** for the first time. You'll be generating your first YAML configuration in minutes.

---

## ⚡ Prerequisites

- A **modern web browser** (Chrome, Firefox, Safari, Edge—all recent versions work)
- **No installation required** — CasaOS Generator is 100% client-side
- Basic familiarity with **YAML format** (if not, see [YAML Basics](#yaml-basics) below)

---

## 🚀 Running the Generator

### Option 1: Local Development (Immediate)
1. Clone the repository:
   ```bash
   git clone https://github.com/acidgreenservers/CasaOS-Generator.git
   cd CasaOS-Generator
   ```
2. Open `index.html` in your browser:
   ```bash
   # On macOS:
   open index.html
   
   # On Linux:
   xdg-open index.html
   
   # Or simply double-click the file in your file manager
   ```
3. You're ready to go! No server, no build step, no installation.

### Option 2: Static Hosting
Deploy to GitHub Pages, Netlify, or any static host:
- Push the repository to GitHub
- Enable GitHub Pages in repository settings
- Access via your GitHub Pages URL

### Option 3: Local Server (Optional)
If you prefer running a local server:
```bash
# Using Python 3:
python3 -m http.server 8000

# Using Node.js (with http-server):
npx http-server
```
Then visit `http://localhost:8000` in your browser.

---

## 🎯 Your First Configuration (5 Minutes)

### Step 1: Open the Generator
Launch `index.html` in your browser. You'll see:
- A clean, dark-themed interface
- A welcome screen with "Start Generating" button
- Navigation showing your progress

### Step 2: Basic App Information
Fill in the foundational details:

| Field | What to Enter | Example |
|-------|---------------|---------|
| **App Name** | Display name for your app | `My Cool App` |
| **App Description** | One-line summary | `A lightweight utility for managing tasks` |
| **Icon URL** | Link to app icon (PNG/JPG) | `https://example.com/icon.png` |
| **Version** | Semantic version | `1.0.0` |
| **Container Image** | Docker image (required) | `myapp:latest` or `ghcr.io/user/myapp:v1.0` |
| **Port (Host)** | Port on your CasaOS device | `3000` |
| **Port (Container)** | Port inside container | `3000` |

**Live Preview:** As you type, the YAML on the right updates in real-time. Watch the structure form.

### Step 3: Volumes & Advanced Options
Add persistent storage or environment variables:

**Volumes** — Mount directories for persistent data:
- **Container Path** — Where the app stores data inside the container (e.g., `/data`, `/config`)
- **Host Path** — Where CasaOS keeps the data on your machine (e.g., `/var/lib/casaos/myapp`)

**Environment Variables** — Configure your app:
- **Key** — Variable name (e.g., `DEBUG`, `API_KEY`)
- **Value** — Variable value (e.g., `true`, `your-secret-key`)

**Pro Tip:** If your app doesn't need volumes or env vars, skip this step.

### Step 4: Review & Export
- **Preview** — See the final YAML structure
- **Copy** — Copy the YAML to clipboard
- **Download ZIP** — Get a ready-to-use package

The ZIP contains:
- `icon.png` — Your app icon
- `docker-compose.yml` — Docker configuration
- `appstore.yml` — CasaOS app configuration
- `README.md` — Quick reference

---

## 📋 YAML Basics

If you're new to YAML, here's what you need to know:

### Simple Structure
```yaml
name: My App
version: 1.0.0
description: What this app does
```

### Lists
```yaml
volumes:
  - host: /data
    container: /app/data
  - host: /config
    container: /app/config
```

### Key-Value Pairs
```yaml
environment:
  DEBUG: "true"
  API_URL: "https://api.example.com"
```

### Indentation Matters
YAML uses **spaces (not tabs)** for indentation. Two spaces per level.

```yaml
# ✅ Correct
services:
  app:
    image: myapp:latest

# ❌ Wrong (tabs won't work)
services:
	app:
		image: myapp:latest
```

For a deeper dive, see [YAML Official Docs](https://yaml.org/).

---

## ✅ Common First Steps

### 1. Create a Simple App Config
- App Name: `HelloWorld`
- Container Image: `nginx:latest`
- Port: `80:80`
- Don't add volumes or env vars yet
- Download ZIP
- Test locally or upload to CasaOS

### 2. Add Persistent Storage
- Use the same app as above
- Add a Volume:
  - Container Path: `/var/www/html`
  - Host Path: `/var/lib/casaos/nginx-data`
- Re-export and test

### 3. Configure with Environment Variables
- Add Environment Variable:
  - Key: `NGINX_HOST`
  - Value: `example.com`
- Export and verify in the YAML

---

## 🔒 Privacy Guarantee

Everything you enter in CasaOS Generator:
- Stays **100% on your device**
- Never sent to any server
- Never tracked or logged
- Can be audited (code is open source)

Your browser's **localStorage** only stores your current work-in-progress locally. You can clear it anytime—no data is ever synchronized or uploaded.

---

## 🛠️ Troubleshooting

### "Icon URL doesn't load"
- Verify the URL is publicly accessible
- Check for CORS issues (some sites block external requests)
- Use a direct image link, not a web page link

### "YAML looks weird"
- The generator validates structure in real-time
- Invalid entries appear highlighted
- Check indentation (spaces only, no tabs)

### "ZIP download didn't work"
- Try a different browser
- Check browser console for errors (F12 → Console)
- Ensure JavaScript is enabled

### "How do I deploy to CasaOS?"
- See the [User Guide](./User-Guide) for deployment steps
- CasaOS imports app configurations from ZIP packages

---

## 📚 Next Steps

- **Learn the full workflow** → [User Guide](./User-Guide)
- **Understand the architecture** → [Architecture & Design](./Architecture-Design)
- **Contribute improvements** → [Contributing](./Contributing)
- **Privacy details** → [Privacy & Security](./Privacy-Security)

---

## ❓ Still Stuck?

- Check [FAQ & Troubleshooting](./FAQ-Troubleshooting)
- [Report an issue](https://github.com/acidgreenservers/CasaOS-Generator/issues)
- Review the `README.md` in the repository

---

**Ready?** Open `index.html` and start generating! Your first config is moments away.
