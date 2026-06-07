# CasaOS Generator Wiki

Welcome to the **CasaOS Generator** documentation hub. This wiki is the semantic map of the project—showing not just what it does, but *why* it's built the way it is.

---

## 📚 Documentation Map

Start with **Getting Started**, then follow the learning path that matches your needs:

### **1. Onboarding**
### **[Getting Started](Getting-Started.md)**
New to CasaOS Generator? Start here.
- Installation & setup (static hosting)
- Your first app configuration
- Understanding YAML structure basics

---

### **2. Core Knowledge**
### **[CasaOS Concepts](CasaOS-Concepts.md)**
Understand the foundational ideas that shape YAML configurations.
- File storage model and `/DATA/` directory structure
- Two-level metadata architecture (`x-casaos` layers)
- Network modes (bridge vs. host) and why they matter
- Validation model and the four corners of consistency
- Memory reservations, language codes, and multi-service apps

---

### **3. Reference**
### **[Ultimate Guide](Ultimate-Guide.md)**
Complete field-by-field reference for every YAML field.
- YAML structure specification
- Root, service, and root-level x-casaos fields
- Multi-service app patterns
- Validation rules & common errors
- Best practices and four common architectural patterns

---

### **4. Advanced Architecture**
### **[Advanced Patterns](Advanced-Patterns.md)**
Sophisticated setups for complex applications.
- Custom networks (multi-service communication)
- Health checks (automated reliability)
- Resource limits (memory and CPU caps)
- Logging configuration (manage output)
- Linux capabilities (fine-grained permissions)
- Device mounts (GPU and hardware access)
- Startup order control with dependencies
- Migration patterns (Docker run → CasaOS)

---

### **5. Diagnostics**
### **[Troubleshooting & Advanced Setups](Troubleshooting-Advanced-Setups.md)**
Diagnose problems, understand failures, and learn migration strategies.
- Troubleshooting flowchart
- 5 major issue categories with diagnostic checklists
- Common validation errors & fixes
- Store-specific considerations (official vs. third-party vs. personal)
- Pre-deployment testing checklist

---

### **6. Application Lifecycle**
### **[Saved Applications & Store Export](Saved-Applications-Store-Export.md)**
Manage your applications beyond generation — persist, edit, and export as a full app store.
- **Saved Applications** (`pages/applications.html`) — Grid/list view with star favourites, edit, and delete controls
- **Application Editor** (`pages/editor.html`) — Purpose-built single-page editor with live YAML preview
- **Application Store Export** — Export all saved apps as a single ZIP, each in its own directory, ready to upload to GitHub as a CasaOS app store
- **Creating a CasaOS App Store** — Complete workflow from fork to registration, including `category-list.json` metadata, required file structure, and CasaOS registration steps
- **Third-Party Community Stores** — Registering pre-built stores (LinuxServer, Edge, HomeAutomation)
- **App Store Metadata Reference** — Complete field reference for both compose-level and service-level `x-casaos` metadata
- **Persistence management** — Enable/disable data persistence from the privacy notice

---

## 🧭 How to Use This Wiki

**I just want to generate my first app:**
→ Start with [Getting Started](Getting-Started.md), then reference [CasaOS Concepts](CasaOS-Concepts.md)

**I need to look up a specific field:**
→ Use [Ultimate Guide](Ultimate-Guide.md) (search by field name)

**I'm building something complex:**
→ Read [CasaOS Concepts](CasaOS-Concepts.md), then explore [Advanced Patterns](Advanced-Patterns.md)

**Something isn't working:**
→ Check [Troubleshooting & Advanced Setups](Troubleshooting-Advanced-Setups.md) for diagnostics

**I'm migrating from Docker:**
→ See the migration patterns in [Advanced Patterns](Advanced-Patterns.md)

---

## 🎯 Project Philosophy

**CasaOS Generator** is built on three core pillars:

1. **Privacy First** — Your configurations are generated entirely in your browser. No server, no tracking, no data leaves your device.

2. **Professional Standards** — Rigorous adherence to YAML spec, intuitive UX, and clean architecture that scales.

3. **User as Source of Truth** — The generator is a tool that amplifies *your* intent, not a system that obscures it. You control the final output.

---

## 📦 Quick Reference

| Resource | Purpose |
|----------|---------|
| `README.md` | Project overview & features |
| `ROADMAP.md` | Planned features & direction |
| `AGENTS.md` | Development role & contribution guidelines |
| `PRIVACY.md` | Full privacy policy |
| `LICENSE` | MIT License |

---

## 💬 Need Help?

- **Bug report?** → Open an issue on [GitHub](https://github.com/acidgreenservers/CasaOS-Generator/issues)
- **Documentation unclear?** → Suggest an improvement
- **Feature idea?** → Check the roadmap, or start a discussion

---

Built with rigor and respect for your privacy by [acidgreenservers](https://github.com/acidgreenservers).
