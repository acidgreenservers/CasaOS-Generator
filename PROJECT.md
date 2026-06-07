# Project Overview: CasaOS Generator

## 🏛️ Application Architecture

CasaOS Generator is architected as a **decentralized, static frontend application**. It operates on a "Zero-Server" philosophy, where all business logic, state management, and file generation are executed within the user's browser environment.

### Core Design Principles
1. **Semantic Grounding**: All pattern inferences are anchored to the project's core design language (see `DESIGN.md`) to maintain structural integrity and professional aesthetic.
2. **Structural Completion**: Development focuses on robust, functional endpoints rather than speculative extrapolation.
3. **Data Sovereignty**: The user maintains absolute control over their data. The application serves as a transformation engine, not a storage repository.

## 📁 Directory Topology

- **`/` (Root)**: Entry point (`index.html`) and project-wide documentation.
- **`/css`**: The "Floor" of the system. Contains `base.css`, which defines the global design system, color palettes, and responsive grid.
- **`/pages`**: High-level application modules. The `generator.html` serves as the primary workspace.
- **`/modules`**: The "Logic Engine". Individual JS modules handle specific domains like YAML schema validation, ZIP compression, and UI state.
- **`/assets`**: Static branding assets including logos and imagery.
- **`/docs`**: Formal documentation, privacy notices, and technical specifications.

## 🎨 Design Philosophy (The "Both Sides of the Bridge")

The application bridges the gap between **Technical Precision** and **User Experience**:
- **The Technical Side**: Ensuring YAML output is strictly compliant with CasaOS standards and AppStore requirements.
- **The UX Side**: A sleek, dark-mode interface (`#070B17`) that reduces cognitive load during complex configuration tasks.

## 🛠️ Developmental Workflow

The project follows a tiered development approach:
1. **The Floor**: Establishing core CSS and infrastructure.
2. **The Bridge**: Mapping dependencies between the UI inputs and the YAML output schema.
3. **The Ceiling**: Integrating final polish, animations, and professional documentation.

## 🧩 Core Features

### YAML Generator
Multi-step wizard that collects application metadata, icon, screenshots, and Docker configuration to produce CasaOS-compliant `docker-compose.yml` files.

### Saved Applications (`pages/applications.html`)
Persistent local storage of created applications. Grid/list toggleable view with:
- **Starred row** — Horizontally scrollable pinned apps with smooth arrow controls
- **Card entries** — Each app displayed with title, tagline, icon, and action buttons (Remove, Edit, Star)
- **Export All** — Download all saved apps as a ready-to-use CasaOS app store (ZIP archive)

### Application Editor (`pages/editor.html`)
Purpose-built single-page editor for modifying saved applications. Presents all generator fields in a unified layout with a live YAML code preview, modal-based icon and screenshot management.

### Application Store Export
The "Export All" feature bundles every saved application as its own top-level directory containing `docker-compose.yml`, icon, and screenshots. The resulting ZIP can be uploaded to GitHub and used immediately as a CasaOS app store — no additional transformation needed.

## 🚀 Vision

To provide the CasaOS community with the most reliable, private, and professional tool for expanding the ecosystem of self-hosted applications — from single YAML generation to full app store creation.
