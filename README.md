# AgentFlow

AI Workflow Automation Platform - Build, deploy, and monitor AI agent workflows visually.

## Project Structure

```
AgentFlow/
├── backend/
│   ├── workflow/       # Workflow service (port 3001) - CRUD, execution orchestration
│   ├── execution/      # Execution service (port 3002) - LLM calls, job processing
│   └── gateway/        # API Gateway (port 3000) - Request routing
├── frontend/           # React + Vite frontend (port 5173)
│   ├── src/
│   │   ├── components/ # UI components (shadcn/ui)
│   │   ├── pages/      # Route pages
│   │   ├── hooks/      # Custom React hooks
│   │   ├── store/      # Zustand state management
│   │   └── lib/        # Utilities & API client
└── files/              # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or Prisma Accelerate)
- Gemini API key (or other LLM provider)

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install individually
cd backend/workflow && npm install
cd ../execution && npm install
cd ../gateway && npm install
cd ../../frontend && npm install
```

### Environment Setup

1. **Workflow Service** (`backend/workflow/.env`):
```env
DATABASE_URL="your-prisma-accelerate-url"
PORT=3001
```

2. **Execution Service** (`backend/execution/.env`):
```env
GEMINI_API_KEY="your-gemini-key"
PORT=3002
```

### Database Setup

```bash
cd backend/workflow
npx prisma migrate deploy
npx prisma generate
```

### Running

```bash
# Run all services (from root)
npm run dev

# Or run individually
npm run dev:workflow   # Backend workflow service
npm run dev:execution  # Backend execution service
npm run dev:gateway    # API gateway
npm run dev:frontend   # Frontend
```

## Features

- ✅ Visual workflow builder with drag-and-drop
- ✅ Multiple LLM provider support (Gemini, OpenAI, Groq, Ollama)
- ✅ Real-time execution monitoring
- ✅ Workflow templates
- ✅ Analytics dashboard
- ✅ User settings & API key management

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- React Flow (workflow canvas)
- Zustand (state management)
- Recharts (analytics)

**Backend:**
- Node.js + Express
- TypeScript
- Prisma + PostgreSQL
- BullMQ (optional job queue)

## API Endpoints

### Gateway (port 3000)
All requests are proxied through the gateway:
- `/api/workflows/*` → Workflow Service
- `/api/executions/*` → Workflow Service
- `/api/analytics/*` → Workflow Service
- `/api/user/*` → Workflow Service
- `/api/execute/*` → Execution Service
- `/api/providers/*` → Execution Service

## License

MIT
