# AgentFlow

AI Workflow Automation Platform - Build, deploy, and monitor AI agent workflows visually with n8n-like capabilities.

![AgentFlow](https://img.shields.io/badge/Version-2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Features
- 🎨 **Visual Workflow Builder** - Drag-and-drop workflow canvas with React Flow
- 🤖 **Multiple LLM Support** - Gemini, OpenAI, Groq, Ollama providers
- 📊 **Real-time Monitoring** - Live execution status and logs
- 📈 **Analytics Dashboard** - Workflow performance metrics

### Flow Control (n8n-like)
- 🔀 **Condition Node** - IF/ELSE branching with multiple operators
- 🔄 **Switch Node** - Multi-branch routing based on field values
- 🔁 **Loop Node** - Iterate over arrays with item/index access
- ⚡ **Merge Node** - Combine branches (Wait All, Wait Any, Append)

### Triggers & Scheduling
- 🌐 **Webhook Triggers** - HTTP endpoints to trigger workflows
- ⏰ **Schedule Triggers** - Cron-based execution with timezone support
- 🖱️ **Manual Triggers** - On-demand workflow execution

### Data & Integration
- 🔗 **HTTP Request Node** - REST API calls with auth support
- 🔧 **Transformer Node** - Set, rename, delete, filter operations
- 💻 **Code Node** - Custom JavaScript sandbox
- 📝 **Expression Engine** - Template variables (`{{ $input.data }}`)

### Reliability & Error Handling
- 🔄 **Retry Logic** - Exponential backoff with configurable attempts
- ⏱️ **Timeout Handling** - Per-node execution timeouts
- 🛡️ **Error Workflows** - Fallback execution on failure

### Collaboration
- 👥 **Teams** - Create and manage team workspaces
- 🔐 **Permissions** - Granular access control (view, edit, execute, admin)
- 📤 **Sharing** - Share workflows with users and teams
- 📜 **Version History** - Track changes and restore versions
- 📦 **Import/Export** - JSON workflow definitions

---

## 📁 Project Structure

```
AgentFlow/
├── backend/
│   ├── workflow/           # Workflow Service (port 3001)
│   │   ├── src/
│   │   │   ├── index.ts        # Main server & routes
│   │   │   ├── webhooks.ts     # Webhook trigger management
│   │   │   ├── scheduler.ts    # Cron-based scheduling
│   │   │   ├── versions.ts     # Version history & import/export
│   │   │   ├── permissions.ts  # Teams & access control
│   │   │   └── websocket.ts    # Real-time updates
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   │
│   ├── execution/          # Execution Service (port 3002)
│   │   └── src/
│   │       ├── index.ts            # Main server
│   │       ├── graph-executor.ts   # Graph-based workflow engine
│   │       ├── retry-handler.ts    # Retry & timeout logic
│   │       ├── expression-engine.ts # Template variables
│   │       ├── auth-handler.ts     # API authentication
│   │       └── types.ts            # Type definitions
│   │
│   └── gateway/            # API Gateway (port 3000)
│       └── src/
│           └── index.ts    # Request routing & proxying
│
├── frontend/               # React Frontend (port 5173)
│   └── src/
│       ├── components/
│       │   └── workflow/
│       │       ├── AgentNode.tsx       # AI agent node
│       │       ├── ConditionNode.tsx   # IF/ELSE branching
│       │       ├── SwitchNode.tsx      # Multi-way switch
│       │       ├── LoopNode.tsx        # Array iteration
│       │       ├── MergeNode.tsx       # Branch merging
│       │       ├── HttpNode.tsx        # HTTP requests
│       │       ├── TransformerNode.tsx # Data transformation
│       │       ├── TriggerNode.tsx     # Workflow triggers
│       │       ├── CodeNode.tsx        # JavaScript sandbox
│       │       └── Sidebar.tsx         # Node palette
│       ├── pages/
│       ├── hooks/
│       ├── store/          # Zustand state
│       └── lib/            # Utilities
│
└── .env                    # Environment configuration
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/agentflow.git
cd agentflow

# Install all dependencies
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend/workflow && npm install
cd ../execution && npm install
cd ../gateway && npm install
```

### Environment Setup

Create `.env` in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/agentflow"

# Service Ports
WORKFLOW_PORT=3001
GATEWAY_PORT=3000
EXECUTION_SERVICE_URL=http://localhost:3002

# API Keys
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Optional
SKIP_REDIS=true
WEBHOOK_BASE_URL=http://localhost:3001
```

### Database Setup

```bash
cd backend/workflow

# Create database tables
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Running

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Workflow Service
cd backend/workflow && npm run dev

# Terminal 3: Execution Service
cd backend/execution && npm run dev

# Terminal 4: Gateway
cd backend/gateway && npm run dev
```

**Access the app at:** http://localhost:5173

---

## 🔌 API Reference

### Gateway (port 3000)
All requests route through the gateway:

| Route | Service | Description |
|-------|---------|-------------|
| `/api/workflows/*` | Workflow | CRUD operations |
| `/api/executions/*` | Workflow | Execution history |
| `/api/analytics/*` | Workflow | Dashboard metrics |
| `/api/execute/*` | Execution | Run workflows |
| `/api/providers/*` | Execution | LLM providers |

### Workflow Service (port 3001)

#### Webhooks
```
POST   /webhooks                    # Create webhook
GET    /webhooks                    # List webhooks
POST   /webhooks/h/:path            # Trigger webhook
```

#### Schedules
```
POST   /schedules                   # Create schedule
GET    /schedules                   # List schedules
DELETE /schedules/:id               # Delete schedule
```

#### Versions
```
POST   /workflows/:id/versions      # Create version
GET    /workflows/:id/versions      # List versions
POST   /versions/:id/restore        # Restore version
GET    /workflows/:id/export        # Export workflow
POST   /workflows/import            # Import workflow
```

#### Teams & Permissions
```
POST   /teams                       # Create team
POST   /teams/:id/members           # Add member
POST   /workflows/:id/share/team    # Share with team
GET    /workflows/:id/permissions   # List permissions
```

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7
- TailwindCSS + shadcn/ui
- React Flow (workflow canvas)
- Zustand (state management)
- Recharts (analytics)

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM + PostgreSQL
- node-cron (scheduling)
- ws (WebSocket)

---

## 📊 Node Types

| Node | Type | Description |
|------|------|-------------|
| 🤖 Agent | `agent` | LLM-powered AI nodes |
| 🔀 Condition | `condition` | IF/ELSE branching |
| 🔄 Switch | `switch` | Multi-branch routing |
| 🔁 Loop | `loop` | Array iteration |
| ⚡ Merge | `merge` | Combine branches |
| 🌐 HTTP | `http` | REST API calls |
| 🔧 Transformer | `transformer` | Data manipulation |
| ⚡ Trigger | `trigger` | Webhook/schedule triggers |
| 💻 Code | `code` | JavaScript execution |

---

## 🔐 Authentication Types

The HTTP node supports:
- **API Key** - Header, query, or cookie
- **Basic Auth** - Username/password
- **Bearer Token** - JWT tokens
- **OAuth2** - Client credentials, refresh token

---

## 📝 Expression Syntax

Use template expressions in node configurations:

```javascript
{{ $input.data }}              // Input from previous node
{{ $node["HTTP"].data.body }}  // Other node's output
{{ $env.API_KEY }}             // Environment variable
{{ $now }}                     // Current timestamp
{{ $isEmpty($input) }}         // Utility function
{{ $default($input.name, "Unknown") }}  // Default value
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
