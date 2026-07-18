---
name: Liquid Glass
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dce6'
  primary: '#e0fdff'
  on-primary: '#00373a'
  primary-container: '#00f2fe'
  on-primary-container: '#006a70'
  inverse-primary: '#00696f'
  secondary: '#9bcbff'
  on-secondary: '#003256'
  secondary-container: '#3196e6'
  on-secondary-container: '#002c4b'
  tertiary: '#dfffef'
  on-tertiary: '#003829'
  tertiary-container: '#00f8bf'
  on-tertiary-container: '#006d53'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#d0e4ff'
  secondary-fixed-dim: '#9bcbff'
  on-secondary-fixed: '#001d34'
  on-secondary-fixed-variant: '#004a7a'
  tertiary-fixed: '#31ffc7'
  tertiary-fixed-dim: '#00e1ad'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#00513d'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  panel-margin: 12px
  editor-gutter: 32px
---

## Brand & Style

This design system is engineered for a high-performance DSL Automation IDE, blending the technical precision of a development environment with a premium, immersive aesthetic. The style centers on **Glassmorphism**, utilizing layered translucency, deep background blurs, and vibrant light-source glows to create a sense of three-dimensional depth.

The UI evokes a "Command Center" atmosphere—professional, sleek, and futuristic. It prioritizes clarity for complex logical flows while maintaining a high-fidelity visual experience through liquid gradients and reflective surfacing. The target audience is automation engineers and developers who require a focused, low-fatigue workspace that feels cutting-edge.

## Colors

The palette is anchored in a deep, cosmic dark mode. 

- **Foundation:** The primary workspace uses a gradient or solid fill of `#0b0f19`, while secondary panels use `#1e1b4b` to provide subtle structural contrast.
- **Glass Surfaces:** Active UI elements utilize `rgba(255, 255, 255, 0.05)` with a 16px backdrop blur to simulate frosted glass.
- **Accents:** 
    - **Neon Cyan (#00f2fe):** Used for primary actions, active cursors, and successful build indicators.
    - **Electric Purple (#4facfe):** Used for logic-flow connections, hover states, and secondary highlights.
    - **Emerald Green (#05ffc5):** Reserved for status-ok markers, execution triggers, and high-priority completion states.

## Typography

This design system employs a dual-font strategy: **Outfit** for structural headings and brand-moments to provide a geometric, modern flair; and **Inter** for all functional UI and body text to ensure maximum legibility at small sizes. 

For the core DSL editor experience, **JetBrains Mono** is utilized for its superior code readability and distinct character isolation. 

- **Headlines:** Use high contrast against the dark background.
- **Body:** Use a slightly desaturated white (`rgba(255,255,255,0.85)`) to reduce eye strain.
- **Labels:** Uppercase labels are used for panel headers and metadata to provide clear hierarchy within the "glass" containers.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a specific focus on "Panels." Since this is an IDE, the screen is divided into functional regions (Sidebar, Editor, Terminal, Inspector). 

- **Padding:** Elements inside glass containers should use a minimum of `16px (md)` padding to prevent content from touching the reflective borders.
- **Gaps:** A `12px` margin between major glass panels allows the background "liquid" glows to peak through, enhancing the depth effect.
- **Adaptive Rules:** On smaller displays, the sidebar collapses into an icon-only rail, and the inspector panel moves to a bottom-sheet or hidden drawer to prioritize the code editor's width.

## Elevation & Depth

Hierarchy is defined through **Backdrop Saturation** and **Outer Glows** rather than traditional shadows.

1.  **Level 0 (Base):** Deep dark background (#0b0f19).
2.  **Level 1 (Panels):** Glass surface (5% opacity white) with `blur(16px)`. Border is 1px solid `rgba(255,255,255,0.1)`.
3.  **Level 2 (Popovers/Tooltips):** Higher opacity glass (10% white) with a subtle neon cyan drop-shadow (`0px 4px 20px rgba(0, 242, 254, 0.15)`).
4.  **Interactive Glows:** Buttons and active states utilize a "liquid" underlay—a soft, blurred radial gradient of the accent color positioned behind the glass element to simulate light passing through.

## Shapes

The design system uses **Rounded (0.5rem)** corners as the standard for all primary panels and input fields. This softens the technical nature of the IDE, making it feel more organic and "liquid."

- **Large Panels/Cards:** `1rem (rounded-lg)` for a more distinct container feel.
- **Tabs:** Top-rounded only (`0.5rem`) to maintain a clean connection to the panel below.
- **Code Highlights:** Minimal `2px` rounding to stay precise to the character grid.

## Components

### Buttons
Primary buttons use a solid-to-gradient fill of Cyan to Purple with white text. Secondary buttons are glass-based with a reflective border and accent-colored text. All buttons have a high-hover transition that increases the backdrop blur and border brightness.

### Chips
Used for tags and status indicators. These are small, pill-shaped elements with a 10% opacity background of their respective status color (e.g., 10% Emerald for "Success") and a 1px solid border.

### Input Fields
Inputs are semi-transparent with a 1px border that glows Cyan when focused. Text cursor (caret) is a solid Cyan block for a retro-futuristic feel.

### Cards
Glass containers with `16px` padding. Headers within cards should have a subtle bottom-border of `rgba(255,255,255,0.05)`.

### Editor Tabs
Tabs should be identifiable by a thin (2px) Cyan line at the top of the active tab. Inactive tabs are lower opacity and do not have a glass blur, appearing "flatter" against the background.

### Execution Node (Specific to DSL)
Nodes in the automation flow use a 20% opacity glass fill. Connections between nodes are drawn as "liquid" paths using a `2px` stroke with a Cyan/Purple gradient and a soft outer glow.