# UI/UX Design Document: AgentFlow

**Version:** 1.0  
**Date:** January 29, 2026  
**Product:** AgentFlow - Multi-Agent Workflow Orchestrator  
**Document Owner:** Design Team

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Visual Identity](#visual-identity)
3. [Design System](#design-system)
4. [Component Library](#component-library)
5. [Page Layouts](#page-layouts)
6. [Interaction Patterns](#interaction-patterns)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Implementation Guide](#implementation-guide)

---

## Design Philosophy

### Vision Statement

AgentFlow's interface embodies **"Orchestrated Clarity"** - a design language that makes complex multi-agent systems feel intuitive, transparent, and powerful. We blend the precision of technical tools with the fluidity of creative applications.

### Design Principles

**1. Visual Flow Over Hierarchy**
- Information flows like agent communication - dynamic, directional, interconnected
- Use motion and connection to show relationships rather than nested menus
- Canvas-first thinking: the workflow is the interface

**2. Technical Transparency**
- Show system state in real-time with live data visualization
- Make the invisible visible: agent reasoning, message flow, execution paths
- Embrace technical aesthetics without sacrificing usability

**3. Progressive Disclosure**
- Start simple, reveal complexity on demand
- Contextual information appears where needed
- Advanced features don't clutter basic workflows

**4. Tactile Precision**
- Interactions feel direct and responsive
- Drag-and-drop with physics-based feedback
- Hover states reveal depth and possibility

**5. Calm Confidence**
- Neutral colors for sustained focus
- Vibrant accents for status and alerts
- Animations guide attention without distraction

---

## Visual Identity

### Brand Aesthetic: **"Neo-Technical"**

A modern, sophisticated aesthetic that balances:
- **Technical precision** (monospace fonts, grid systems, sharp edges)
- **Organic flow** (curves in connections, fluid animations)
- **Professional depth** (layered shadows, subtle gradients)
- **Vibrant energy** (accent colors for agent activity)

**Inspiration References:**
- Linear's clean, technical interface
- Figma's canvas-centric workspace
- VS Code's developer-focused polish
- Notion's approachable complexity

---

### Color Palette

**Base Colors (Dark Theme Primary):**
```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0b0d;           /* Deep charcoal - main background */
  --bg-secondary: #141518;         /* Elevated surfaces */
  --bg-tertiary: #1c1e22;          /* Cards, panels */
  --bg-hover: #25272c;             /* Hover states */
  
  /* Text */
  --text-primary: #e8e9eb;         /* Primary text */
  --text-secondary: #9a9ca4;       /* Secondary text */
  --text-tertiary: #6b6d75;        /* Muted text */
  --text-disabled: #45474d;        /* Disabled state */
  
  /* Borders */
  --border-subtle: #2a2c32;        /* Subtle dividers */
  --border-default: #3d3f47;       /* Standard borders */
  --border-strong: #52545c;        /* Emphasized borders */
  
  /* Brand */
  --brand-primary: #6366f1;        /* Indigo - primary brand */
  --brand-secondary: #8b5cf6;      /* Purple - secondary */
  --brand-accent: #3b82f6;         /* Blue - accent */
  
  /* Semantic Colors */
  --success: #10b981;              /* Green - success */
  --warning: #f59e0b;              /* Amber - warning */
  --error: #ef4444;                /* Red - error */
  --info: #06b6d4;                 /* Cyan - info */
  
  /* Agent Status Colors */
  --agent-idle: #6b7280;           /* Gray - idle */
  --agent-running: #8b5cf6;        /* Purple - running */
  --agent-success: #10b981;        /* Green - success */
  --agent-error: #ef4444;          /* Red - error */
  --agent-waiting: #f59e0b;        /* Amber - waiting */
  
  /* Data Visualization */
  --viz-1: #6366f1;                /* Primary purple */
  --viz-2: #8b5cf6;                /* Purple variant */
  --viz-3: #06b6d4;                /* Cyan */
  --viz-4: #10b981;                /* Green */
  --viz-5: #f59e0b;                /* Amber */
  --viz-6: #ef4444;                /* Red */
  
  /* Glassmorphism */
  --glass-bg: rgba(28, 30, 34, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: blur(12px);
}
```

**Light Theme (Optional):**
```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f1f3f5;
  --bg-hover: #e9ecef;
  
  --text-primary: #212529;
  --text-secondary: #495057;
  --text-tertiary: #6c757d;
  --text-disabled: #adb5bd;
  
  --border-subtle: #e9ecef;
  --border-default: #dee2e6;
  --border-strong: #adb5bd;
}
```

---

### Typography

**Font Stack:**
```css
:root {
  /* Primary Font - Display & UI */
  --font-display: 'Geist', 'Inter', system-ui, sans-serif;
  
  /* Monospace - Code & Technical */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  
  /* Body - Reading */
  --font-body: 'Inter', system-ui, sans-serif;
}

/* Font Sizes (Fluid Scale) */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);      /* 12-14px */
--text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);         /* 14-16px */
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);      /* 16-18px */
--text-lg: clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem);     /* 18-20px */
--text-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);        /* 20-24px */
--text-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 2rem);         /* 24-32px */
--text-3xl: clamp(1.875rem, 1.65rem + 1.125vw, 2.5rem);    /* 30-40px */
--text-4xl: clamp(2.25rem, 1.95rem + 1.5vw, 3rem);         /* 36-48px */

/* Font Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

**Typography Usage:**
- **Headings:** Geist (display font) - clean, modern
- **Body Text:** Inter - readable, professional
- **Code/Technical:** JetBrains Mono - clear, developer-friendly
- **Agent Names:** Geist Medium - distinctive
- **Metrics/Numbers:** JetBrains Mono - tabular clarity

---

### Spacing System

**8-point Grid:**
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

---

### Shadows & Elevation

**Layering System:**
```css
:root {
  /* Elevation Shadows (Dark Theme) */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3),
               0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.3),
               0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.35),
               0 4px 8px rgba(0, 0, 0, 0.25);
  --shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.4),
               0 8px 16px rgba(0, 0, 0, 0.3);
  --shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.5),
                0 16px 32px rgba(0, 0, 0, 0.4);
  
  /* Glow Effects (for active states) */
  --glow-brand: 0 0 20px rgba(99, 102, 241, 0.5);
  --glow-success: 0 0 20px rgba(16, 185, 129, 0.5);
  --glow-error: 0 0 20px rgba(239, 68, 68, 0.5);
}
```

---

### Border Radius

```css
:root {
  --radius-sm: 0.25rem;    /* 4px - tight elements */
  --radius-md: 0.375rem;   /* 6px - buttons, inputs */
  --radius-lg: 0.5rem;     /* 8px - cards */
  --radius-xl: 0.75rem;    /* 12px - modals */
  --radius-2xl: 1rem;      /* 16px - large panels */
  --radius-full: 9999px;   /* Pills, avatars */
}
```

---

## Design System

### Component Hierarchy

```
Layout Components
├── AppShell (main container)
├── Sidebar (navigation)
├── TopBar (global actions)
├── Canvas (workflow editor)
└── Panel (side panels)

Core Components
├── Button
├── Input
├── Select
├── Card
├── Badge
├── Avatar
└── Icon

Workflow Components
├── AgentNode
├── ConnectionEdge
├── Canvas
├── Toolbar
├── MiniMap
└── ControlPanel

Data Components
├── MetricCard
├── Chart
├── Table
├── LogViewer
├── Timeline
└── ProgressBar

Overlay Components
├── Modal
├── Drawer
├── Popover
├── Tooltip
└── ContextMenu
```

---

## Component Library

### 1. Button Component

**Variants:**
```tsx
// Primary (Brand)
<Button variant="primary">Execute Workflow</Button>

// Secondary (Ghost)
<Button variant="secondary">Cancel</Button>

// Outline
<Button variant="outline">Add Agent</Button>

// Danger
<Button variant="danger">Delete Workflow</Button>

// Icon Button
<Button variant="ghost" size="icon">
  <PlayIcon />
</Button>
```

**Styles:**
```css
.button {
  /* Base */
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Primary Variant */
  &.primary {
    background: var(--brand-primary);
    color: white;
    box-shadow: var(--shadow-sm);
    
    &:hover {
      background: #5558e3;
      box-shadow: var(--shadow-md), var(--glow-brand);
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: var(--shadow-xs);
    }
  }
  
  /* Secondary Variant */
  &.secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    
    &:hover {
      background: var(--bg-hover);
    }
  }
  
  /* Outline Variant */
  &.outline {
    background: transparent;
    border-color: var(--border-default);
    color: var(--text-primary);
    
    &:hover {
      background: var(--bg-tertiary);
      border-color: var(--border-strong);
    }
  }
  
  /* Icon Button */
  &.icon {
    padding: var(--space-2);
    width: 36px;
    height: 36px;
    justify-content: center;
  }
  
  /* Loading State */
  &.loading {
    pointer-events: none;
    opacity: 0.6;
    
    &::before {
      content: '';
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

### 2. Input Component

```tsx
<Input 
  label="Workflow Name"
  placeholder="My Amazing Workflow"
  hint="Choose a descriptive name"
  error="Name is required"
/>
```

**Styles:**
```css
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-label {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  
  &::placeholder {
    color: var(--text-tertiary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &.error {
    border-color: var(--error);
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

.input-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.input-error {
  font-size: var(--text-xs);
  color: var(--error);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
```

---

### 3. Card Component

```tsx
<Card>
  <CardHeader>
    <CardTitle>Agent Configuration</CardTitle>
    <CardDescription>Configure your AI agent</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

**Styles:**
```css
.card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--border-default);
  }
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
}

.card-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.card-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.card-content {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

---

### 4. Agent Node (Workflow Canvas)

```tsx
<AgentNode
  id="agent-1"
  type="web-scraper"
  status="running"
  name="News Scraper"
  config={{ url: "https://news.ycombinator.com" }}
/>
```

**Visual Design:**
```css
.agent-node {
  position: relative;
  min-width: 240px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  cursor: grab;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: var(--shadow-lg);
    border-color: var(--brand-primary);
    transform: translateY(-2px);
  }
  
  &.selected {
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-lg), var(--glow-brand);
  }
  
  &.dragging {
    cursor: grabbing;
    opacity: 0.8;
    box-shadow: var(--shadow-2xl);
  }
}

.agent-node-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.agent-node-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-primary);
  border-radius: var(--radius-md);
  color: white;
}

.agent-node-title {
  flex: 1;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.agent-node-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--agent-idle);
  
  &.running {
    background: var(--agent-running);
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  &.success {
    background: var(--agent-success);
  }
  
  &.error {
    background: var(--agent-error);
    animation: shake 0.5s ease-in-out;
  }
}

.agent-node-body {
  padding: var(--space-4);
}

.agent-node-config {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  max-height: 100px;
  overflow-y: auto;
}

/* Connection Ports */
.agent-node-port {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--bg-secondary);
  border: 2px solid var(--brand-primary);
  border-radius: 50%;
  cursor: crosshair;
  
  &.input {
    top: 50%;
    left: -6px;
    transform: translateY(-50%);
  }
  
  &.output {
    top: 50%;
    right: -6px;
    transform: translateY(-50%);
  }
  
  &:hover {
    transform: scale(1.3) translateY(-50%);
    box-shadow: var(--glow-brand);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}
```

---

### 5. Connection Edge (Agent Links)

```css
.connection-edge {
  stroke: var(--brand-primary);
  stroke-width: 2;
  fill: none;
  transition: all 0.3s ease;
  
  &:hover {
    stroke-width: 3;
    stroke: var(--brand-accent);
    filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
  }
  
  &.selected {
    stroke-width: 3;
    stroke: var(--brand-accent);
  }
  
  &.animated {
    stroke-dasharray: 5;
    animation: dash 1s linear infinite;
  }
}

/* Arrow marker */
.edge-marker {
  fill: var(--brand-primary);
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}
```

---

### 6. Badge Component

```tsx
<Badge variant="success">Running</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
```

**Styles:**
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &.success {
    background: rgba(16, 185, 129, 0.15);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  
  &.warning {
    background: rgba(245, 158, 11, 0.15);
    color: var(--warning);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.15);
    color: var(--error);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  &.info {
    background: rgba(6, 182, 212, 0.15);
    color: var(--info);
    border: 1px solid rgba(6, 182, 212, 0.3);
  }
}
```

---

## Page Layouts

### 1. Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│ TopBar                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AgentFlow • Workspace: My Team                     [≡]  │ │
│ └─────────────────────────────────────────────────────────┘ │
├──────┬──────────────────────────────────────────────────────┤
│      │                                                      │
│ Side │  Main Content Area                                  │
│ bar  │                                                      │
│      │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│ [📊] │  │ Metric     │  │ Metric     │  │ Metric     │    │
│ [🔧] │  │ Card       │  │ Card       │  │ Card       │    │
│ [📁] │  └────────────┘  └────────────┘  └────────────┘    │
│ [⚙️] │                                                      │
│      │  ┌──────────────────────────────────────────────┐   │
│      │  │ Recent Workflows                             │   │
│      │  │                                              │   │
│      │  │ • Research Pipeline      [Running]          │   │
│      │  │ • Content Generator      [Completed]        │   │
│      │  │ • Data Analysis          [Failed]           │   │
│      │  └──────────────────────────────────────────────┘   │
│      │                                                      │
└──────┴──────────────────────────────────────────────────────┘
```

**Implementation:**
```tsx
function DashboardLayout() {
  return (
    <div className="app-shell">
      <TopBar />
      <div className="content-wrapper">
        <Sidebar />
        <main className="main-content">
          {/* Dashboard content */}
        </main>
      </div>
    </div>
  );
}
```

---

### 2. Workflow Canvas Layout

```
┌─────────────────────────────────────────────────────────────┐
│ TopBar: Workflow Editor • "Research Pipeline"         [▶️ ]│
├─────────────────────────────────────────────────────────────┤
│ Toolbar                                                     │
│ [📦 Agents] [🔗 Connect] [▶️ Run] [💾 Save] [⚙️ Settings]│
├──────┬──────────────────────────────────────────┬───────────┤
│      │                                          │           │
│Agent │         Infinite Canvas                  │Properties │
│Panel │                                          │Panel      │
│      │  ┌──────┐                                │           │
│[Web  │  │Agent1│─────┐                         │Agent:     │
│Scrap]│  └──────┘     │                         │Web Scraper│
│      │               ▼                          │           │
│[Data │            ┌──────┐      ┌──────┐       │Config:    │
│Analy]│            │Agent2│─────▶│Agent3│       │URL: ...   │
│      │            └──────┘      └──────┘       │           │
│[Writ]│                                          │Status:    │
│      │                                          │🟢 Running │
│      │                                          │           │
├──────┴──────────────────────────────────────────┴───────────┤
│ MiniMap                                         Canvas Info │
│ [Zoom controls] [Grid toggle] [Fullscreen]                  │
└─────────────────────────────────────────────────────────────┘
```

**Styles:**
```css
.workflow-canvas-layout {
  display: grid;
  grid-template-columns: 240px 1fr 320px;
  grid-template-rows: auto auto 1fr auto;
  height: 100vh;
  background: var(--bg-primary);
  
  .topbar {
    grid-column: 1 / -1;
  }
  
  .toolbar {
    grid-column: 1 / -1;
    border-bottom: 1px solid var(--border-subtle);
    padding: var(--space-3);
    display: flex;
    gap: var(--space-2);
  }
  
  .agent-panel {
    border-right: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
    padding: var(--space-4);
    overflow-y: auto;
  }
  
  .canvas {
    position: relative;
    overflow: hidden;
    background-image: 
      radial-gradient(circle, var(--border-subtle) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  
  .properties-panel {
    border-left: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
    padding: var(--space-4);
    overflow-y: auto;
  }
  
  .bottom-bar {
    grid-column: 1 / -1;
    border-top: 1px solid var(--border-subtle);
    padding: var(--space-3);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
```

---

### 3. Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Real-time Workflow Monitoring                               │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Active   │ │ Completed│ │ Failed   │ │ Avg Time │       │
│ │    12    │ │   145    │ │    3     │ │  2.4s    │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│ Execution Timeline (Live)                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │ Agent1 ████████████▶                                   │ │
│ │ Agent2      ████████████▶                              │ │
│ │ Agent3           ████▶                                 │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Message Stream                     │ Agent Performance     │
│ ┌────────────────────────────────┐ │ ┌───────────────────┐ │
│ │ 10:34:12 Agent1 → Agent2       │ │ │                   │ │
│ │   Data: {"url": "..."}         │ │ │   [Bar Chart]     │ │
│ │                                │ │ │                   │ │
│ │ 10:34:13 Agent2 → Agent3       │ │ │                   │ │
│ │   Data: {"text": "..."}        │ │ │                   │ │
│ └────────────────────────────────┘ │ └───────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Interaction Patterns

### 1. Drag and Drop (Agent Nodes)

**Behavior:**
1. Hover over agent template → Preview highlight
2. Click and hold → Node lifts (shadow increases)
3. Drag onto canvas → Ghost preview shows placement
4. Release → Node animates into place with spring physics
5. Success feedback → Brief glow effect

**Code Example:**
```tsx
import { useDraggable } from '@dnd-kit/core';

function DraggableAgent({ type, name, icon }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: type,
    data: { type, name }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition: 'transform 200ms ease',
  } : undefined;
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...listeners} 
      {...attributes}
      className="agent-template"
    >
      <div className="agent-icon">{icon}</div>
      <span className="agent-name">{name}</span>
    </div>
  );
}
```

---

### 2. Connection Drawing

**Behavior:**
1. Hover over output port → Port enlarges, shows connection icon
2. Click output port → Start connection line
3. Drag to input port → Line follows cursor with bezier curve
4. Hover over valid input → Port highlights green
5. Release on valid input → Connection animates into place
6. Release on invalid target → Line snaps back with elastic animation

**Animation:**
```css
.connection-preview {
  stroke: var(--brand-primary);
  stroke-width: 2;
  stroke-dasharray: 5;
  animation: dash 1s linear infinite;
  pointer-events: none;
  
  &.valid {
    stroke: var(--success);
    stroke-width: 3;
  }
  
  &.invalid {
    stroke: var(--error);
    stroke-dasharray: 2;
  }
}
```

---

### 3. Live Updates (Real-time Status)

**Pattern: Optimistic UI Updates**
```tsx
function AgentNode({ agent }) {
  const [status, setStatus] = useState(agent.status);
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = supabase
      .channel('agent-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'agents',
        filter: `id=eq.${agent.id}`
      }, (payload) => {
        setStatus(payload.new.status);
      })
      .subscribe();
    
    return () => unsubscribe();
  }, [agent.id]);
  
  return (
    <div className={`agent-node status-${status}`}>
      <StatusIndicator status={status} />
      {/* ... */}
    </div>
  );
}
```

---

### 4. Contextual Actions

**Pattern: Right-click Context Menu**
```tsx
function AgentNode({ agent, onDelete, onDuplicate, onConfigure }) {
  const [contextMenu, setContextMenu] = useState(null);
  
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };
  
  return (
    <>
      <div onContextMenu={handleContextMenu} className="agent-node">
        {/* Node content */}
      </div>
      
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        >
          <MenuItem onClick={onConfigure}>
            <SettingsIcon /> Configure
          </MenuItem>
          <MenuItem onClick={onDuplicate}>
            <CopyIcon /> Duplicate
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={onDelete} variant="danger">
            <TrashIcon /> Delete
          </MenuItem>
        </ContextMenu>
      )}
    </>
  );
}
```

---

### 5. Loading States

**Skeleton Loading:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

**Usage:**
```tsx
function WorkflowCard({ workflow, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: '24px', width: '60%' }} />
        <div className="skeleton" style={{ height: '16px', width: '40%', marginTop: '8px' }} />
        <div className="skeleton" style={{ height: '100px', marginTop: '16px' }} />
      </div>
    );
  }
  
  return <Card>{/* Actual content */}</Card>;
}
```

---

## Responsive Design

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Laptop */
  --breakpoint-xl: 1280px;  /* Desktop */
  --breakpoint-2xl: 1536px; /* Large desktop */
}
```

### Mobile Adaptations

**Dashboard (Mobile):**
- Sidebar collapses to hamburger menu
- Metric cards stack vertically
- Tables scroll horizontally
- Touch-friendly tap targets (44x44px minimum)

**Canvas (Tablet):**
- Agent panel toggles as drawer
- Properties panel as bottom sheet
- Pinch-to-zoom for canvas
- Touch gestures for connections

```css
@media (max-width: 768px) {
  .workflow-canvas-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
  }
  
  .agent-panel,
  .properties-panel {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 100;
    
    &.open {
      transform: translateX(0);
    }
  }
  
  .canvas {
    touch-action: none; /* Enable gesture handling */
  }
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text on background: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

**Keyboard Navigation:**
```tsx
function WorkflowCanvas() {
  const handleKeyDown = (e) => {
    // Delete selected node
    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelectedNodes();
    }
    
    // Copy/paste
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') copySelectedNodes();
      if (e.key === 'v') pasteNodes();
      if (e.key === 'z') undo();
      if (e.key === 'y') redo();
    }
    
    // Pan canvas
    const panSpeed = 20;
    if (e.key === 'ArrowUp') panCanvas(0, panSpeed);
    if (e.key === 'ArrowDown') panCanvas(0, -panSpeed);
    if (e.key === 'ArrowLeft') panCanvas(panSpeed, 0);
    if (e.key === 'ArrowRight') panCanvas(-panSpeed, 0);
  };
  
  return (
    <div 
      onKeyDown={handleKeyDown} 
      tabIndex={0}
      role="application"
      aria-label="Workflow canvas"
    >
      {/* Canvas content */}
    </div>
  );
}
```

**Screen Reader Support:**
```tsx
<button 
  onClick={executeWorkflow}
  aria-label="Execute workflow: Research Pipeline"
  aria-describedby="workflow-status"
>
  <PlayIcon aria-hidden="true" />
  Execute
</button>
<span id="workflow-status" className="sr-only">
  Status: Ready to execute. 3 agents configured.
</span>
```

**Focus Indicators:**
```css
:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}

.button:focus-visible {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}
```

---

## Implementation Guide

### Tech Stack

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-flow-renderer": "^11.10.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "framer-motion": "^11.0.0",
    "@dnd-kit/core": "^6.0.0",
    "lucide-react": "^0.300.0",
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### File Structure

```
src/
├── components/
│   ├── ui/                    # Base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── workflow/              # Workflow-specific
│   │   ├── canvas.tsx
│   │   ├── agent-node.tsx
│   │   ├── connection-edge.tsx
│   │   └── toolbar.tsx
│   └── dashboard/             # Dashboard components
│       ├── metric-card.tsx
│       ├── workflow-list.tsx
│       └── activity-feed.tsx
├── styles/
│   ├── globals.css            # Global styles, CSS variables
│   ├── components/            # Component-specific styles
│   └── animations.css         # Reusable animations
├── hooks/
│   ├── use-workflow.ts
│   ├── use-realtime.ts
│   └── use-canvas.ts
├── store/
│   ├── workflow-store.ts      # Zustand store
│   └── ui-store.ts
└── lib/
    ├── api.ts
    └── utils.ts
```

### Animation Library Setup

```tsx
// framer-motion variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Usage
import { motion } from 'framer-motion';

function Dashboard() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {metrics.map(metric => (
        <motion.div key={metric.id} variants={fadeInUp}>
          <MetricCard {...metric} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

## Design Tokens (Tailwind Config)

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    }
  }
};
```

---

## Performance Optimizations

### Canvas Rendering

```tsx
// Virtualize large workflows
import { useVirtualizer } from '@tanstack/react-virtual';

function WorkflowCanvas({ nodes }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5
  });
  
  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <AgentNode key={virtualRow.index} {...nodes[virtualRow.index]} />
        ))}
      </div>
    </div>
  );
}
```

### Image Optimization

```tsx
// Lazy load agent icons
import { lazy, Suspense } from 'react';

const AgentIcon = lazy(() => import('./icons/agent-icon'));

function AgentNode({ type }) {
  return (
    <Suspense fallback={<div className="skeleton w-8 h-8" />}>
      <AgentIcon type={type} />
    </Suspense>
  );
}
```

---

## Appendix

### Design Resources

- **Figma File:** [Link to Figma design system]
- **Icon Set:** Lucide React (https://lucide.dev)
- **Color Palette Tool:** https://uicolors.app
- **Typography Scale:** https://typescale.com

### Inspiration

- Linear (workflow management)
- Figma (canvas interface)
- Raycast (command palette UX)
- Arc Browser (modern UI patterns)
- Vercel Dashboard (developer aesthetics)

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Design System Status:** Ready for Implementation
