---
name: Cloud OS Generator
colors:
  surface: '#0f131f'
  surface-dim: '#0f131f'
  surface-bright: '#353947'
  surface-container-lowest: '#0a0e1a'
  surface-container-low: '#171b28'
  surface-container: '#1b1f2c'
  surface-container-high: '#252a37'
  surface-container-highest: '#303442'
  on-surface: '#dfe2f4'
  on-surface-variant: '#c0c7d2'
  inverse-surface: '#dfe2f4'
  inverse-on-surface: '#2c303d'
  outline: '#8a919c'
  outline-variant: '#404750'
  surface-tint: '#99cbff'
  primary: '#99cbff'
  on-primary: '#003355'
  primary-container: '#4196dc'
  on-primary-container: '#002c4a'
  inverse-primary: '#00629d'
  secondary: '#53d6f5'
  on-secondary: '#003640'
  secondary-container: '#00adca'
  on-secondary-container: '#003b46'
  tertiary: '#ffb871'
  on-tertiary: '#4a2800'
  tertiary-container: '#ce7e1f'
  on-tertiary-container: '#412200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cfe5ff'
  primary-fixed-dim: '#99cbff'
  on-primary-fixed: '#001d34'
  on-primary-fixed-variant: '#004a78'
  secondary-fixed: '#adecff'
  secondary-fixed-dim: '#53d6f5'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5d'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#ffb871'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6a3c00'
  background: '#0f131f'
  on-background: '#dfe2f4'
  surface-variant: '#303442'
  accent-cyan: '#5FE0FF'
  link-blue: '#2B9FD8'
  surface-dark: '#070B17'
  pure-white: '#FFFFFF'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1200px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The brand personality is technical, efficient, and user-centric, reflecting a utility-first approach to cloud management and configuration. The design system follows a **Modern Corporate** aesthetic with strong influences from **Glassmorphism** and **High-Contrast** digital interfaces.

The interface evokes a sense of control and clarity through a deep, dark environment punctuated by vibrant cyan and blue accents. It prioritizes information density and logical flow, catering to a developer and home-lab audience that values speed and precision. High-contrast text and luminous interactive elements ensure high legibility against the dark background.

## Colors
The palette is dominated by a deep obsidian background (`#070B17`), creating a high-contrast foundation for the electric blue and cyan functional colors.

- **Primary (`#1F7FC4`)**: Used for primary actions, active states, and core branding elements.
- **Secondary/Accent (`#5FE0FF`)**: A bright cyan utilized for highlights, secondary buttons, and success indicators.
- **Neutral**: The background is a solid near-black, while text and iconography leverage pure white (`#FFFFFF`) for maximum clarity.
- **Link Blue (`#2B9FD8`)**: A specific shade used for navigational links and subtle interactive cues.

## Typography
The system uses **Inter** almost exclusively to maintain a clean, systematic, and highly readable look. Arial is utilized only as a secondary system fallback.

Typography is treated with a hierarchy that emphasizes functional labels and clear section headers. Weight is used strategically—bold for headings and medium for interactive labels—to guide the eye through dense configuration forms. For smaller screens, headlines scale down to maintain a compact vertical footprint while preserving the bold font weight.

## Layout & Spacing
The design system employs a **Fixed Grid** philosophy for desktop layouts, centering content within a maximum width of 1200px. On smaller viewports, it transitions to a fluid model with consistent side margins.

A 4px base unit governs the spacing rhythm. Components are grouped using logical padding (16px or 24px) to separate functional blocks. Forms and inputs utilize a vertical stack with 12px to 16px gaps. Desktop layouts frequently use a multi-column structure (typically 12 columns) for dashboard views, while mobile views collapse into a single-column flow to maximize input accessibility.

## Elevation & Depth
Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

Because the primary background is extremely dark, depth is created by lifting surfaces with slightly lighter fills or subtle 1px borders using the primary blue at low opacity. Shadows are avoided in favor of "ghost borders" to maintain a crisp, digital-first aesthetic. Floating elements like modals or tooltips use a semi-transparent backdrop blur (glassmorphism) to maintain context with the underlying interface while appearing physically elevated.

## Shapes
The shape language is **Rounded**, utilizing a standard corner radius of 0.5rem (8px) for containers and input fields.

This approach softens the technical nature of the OS generator, making the tools feel modern and approachable. Smaller elements like tags or selection indicators may use a more pronounced curve, while the largest containers maintain the standard 8px radius to ensure structural integrity on the grid.

## Components

- **Buttons**: Primary buttons feature a solid `#1F7FC4` fill with white text. Secondary buttons use an outline style with `#5FE0FF`. All buttons have an 8px corner radius and a subtle hover transition that increases brightness.
- **Input Fields**: Fields have a dark background (slightly lighter than the page background), an 8px radius, and a 1px border that glows cyan (`#5FE0FF`) upon focus.
- **Cards**: Used to group configuration sections. They feature a subtle border and a slightly elevated background tone to distinguish them from the page base.
- **Chips/Badges**: Small, high-contrast labels used for status or tags, utilizing the secondary cyan for positive states.
- **Checkboxes & Radios**: Custom-styled using the primary blue for the active state, maintaining the rounded aesthetic with a 4px radius for checkboxes and full circles for radios.
- **Code Blocks**: Monospaced text inside a dark, recessed container with an 8px radius, ensuring configuration outputs are easily distinguishable from the UI.
