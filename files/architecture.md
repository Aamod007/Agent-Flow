# Architecture Document: AgentFlow

**Version:** 1.0  
**Date:** January 29, 2026  
**Project:** AgentFlow - Multi-Agent Workflow Orchestrator  
**Document Owner:** Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Principles](#architecture-principles)
4. [High-Level Architecture](#high-level-architecture)
5. [Component Architecture](#component-architecture)
6. [Data Architecture](#data-architecture)
7. [Infrastructure Architecture](#infrastructure-architecture)
8. [Security Architecture](#security-architecture)
9. [Integration Architecture](#integration-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Technology Stack](#technology-stack)
12. [Scalability and Performance](#scalability-and-performance)
13. [Monitoring and Observability](#monitoring-and-observability)
14. [Disaster Recovery](#disaster-recovery)
15. [Development and Testing](#development-and-testing)

---

## Executive Summary

AgentFlow is a cloud-native, microservices-based platform for orchestrating multi-agent AI workflows. The architecture is designed for scalability, reliability, and extensibility, leveraging modern cloud infrastructure and serverless computing. The system integrates deeply with Gemini 3 API for AI capabilities and uses event-driven communication for real-time agent coordination.

### Key Architectural Decisions

- **Microservices Architecture:** Separate services for workflow execution, agent management, and monitoring
- **Event-Driven Communication:** Message queue for asynchronous agent communication
- **Serverless Execution:** AWS Lambda for on-demand workflow execution
- **Real-time Updates:** WebSocket connections for live visualization
- **Multi-tenant Design:** Isolated workspaces with shared infrastructure
- **API-First:** All features accessible via REST and GraphQL APIs

---

## System Overview

### System Context

AgentFlow operates as a cloud-based SaaS platform that enables users to create and execute multi-agent workflows. The system integrates with:

- **Gemini 3 API:** Primary AI model for agent intelligence
- **External APIs:** Third-party services (email, Slack, databases)
- **User Applications:** Web browser, mobile apps, CLI tools
- **Storage Systems:** Cloud storage for workflow artifacts
- **Authentication Providers:** OAuth 2.0, SAML for enterprise

### System Boundaries

**In Scope:**
- Workflow design and visualization
- Agent orchestration and execution
- Real-time monitoring and analytics
- Template marketplace
- API integrations
- User authentication and authorization

**Out of Scope:**
- Custom AI model training
- On-device agent execution
- Physical hardware integration
- End-user support chatbots

---

## Architecture Principles

### 1. Scalability First
- Horizontal scaling for all stateless components
- Auto-scaling based on load metrics
- Database sharding for multi-tenancy
- CDN for static assets

### 2. Resilience and Fault Tolerance
- Circuit breakers for external dependencies
- Retry mechanisms with exponential backoff
- Dead letter queues for failed messages
- Graceful degradation when services unavailable

### 3. Security by Design
- Zero-trust security model
- Encryption at rest and in transit
- Principle of least privilege
- Regular security audits

### 4. Observability
- Distributed tracing for all requests
- Centralized logging
- Real-time metrics and alerting
- Performance profiling

### 5. API-First Development
- All features exposed via APIs
- Versioned APIs for backward compatibility
- Comprehensive API documentation
- Rate limiting and throttling

### 6. Developer Experience
- Clear separation of concerns
- Comprehensive testing at all levels
- CI/CD automation
- Infrastructure as Code

---

## High-Level Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Users / Clients                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ Web Browser  │  │ Mobile App   │  │ CLI Tool     │  │ Third-party  ││
│  │  (React)     │  │ (React Native)│  │  (Node.js)   │  │ Integration  ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘│
└─────────┼──────────────────┼──────────────────┼──────────────────┼───────┘
          │                  │                  │                  │
          └──────────────────┴──────────────────┴──────────────────┘
                                      │
                              ┌───────▼────────┐
                              │   CloudFlare   │
                              │  CDN + WAF     │
                              └───────┬────────┘
                                      │
          ┌───────────────────────────┴───────────────────────────┐
          │                     API Gateway                        │
          │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
          │  │ REST API    │  │ GraphQL API │  │ WebSocket   │  │
          │  │ (Express.js)│  │ (Apollo)    │  │ (Socket.io) │  │
          │  └─────────────┘  └─────────────┘  └─────────────┘  │
          └─────┬──────────────────┬─────────────────┬───────────┘
                │                  │                 │
    ┌───────────┴──────────┬───────┴───────┬─────────┴────────────┐
    │                      │               │                      │
┌───▼─────────────┐  ┌────▼──────────┐  ┌─▼──────────────┐  ┌───▼────────────┐
│ Workflow        │  │ Agent         │  │ Monitoring     │  │ User           │
│ Service         │  │ Execution     │  │ Service        │  │ Service        │
│                 │  │ Service       │  │                │  │                │
│ • Create flows  │  │ • Run agents  │  │ • Metrics      │  │ • Auth         │
│ • Manage agents │  │ • Coordinate  │  │ • Logging      │  │ • Workspaces   │
│ • Templates     │  │ • State mgmt  │  │ • Alerts       │  │ • Billing      │
└─────┬───────────┘  └───┬───────────┘  └────┬───────────┘  └────┬───────────┘
      │                  │                    │                    │
      └──────────────────┴────────────────────┴────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
      ┌───────▼────────┐     ┌────────▼────────┐    ┌────────▼────────┐
      │ Message Queue  │     │   Data Layer    │    │  External APIs  │
      │   (RabbitMQ)   │     │                 │    │                 │
      │                │     │ • PostgreSQL    │    │ • Gemini 3      │
      │ • Agent msgs   │     │ • Redis Cache   │    │ • Gmail         │
      │ • Task queue   │     │ • MongoDB       │    │ • Slack         │
      │ • Events       │     │ • S3 Storage    │    │ • Custom APIs   │
      └────────────────┘     └─────────────────┘    └─────────────────┘
```

### Request Flow

**User Creates Workflow:**
1. User designs workflow in React UI
2. Frontend sends workflow definition to API Gateway
3. Workflow Service validates and stores in PostgreSQL
4. Success response returned to user

**User Executes Workflow:**
1. User triggers workflow execution via UI
2. API Gateway routes request to Agent Execution Service
3. Agent Execution Service publishes tasks to Message Queue
4. Worker processes pick up tasks and execute agents
5. Agents communicate via Message Queue
6. Results stored in database and pushed to UI via WebSocket

---

## Component Architecture

### Frontend Layer

#### Web Application (React)

**Technology:** React 18, TypeScript, Vite  
**State Management:** Redux Toolkit + RTK Query  
**UI Components:** Material-UI + Custom Design System  
**Canvas Library:** React Flow for workflow visualization

**Key Modules:**
- **Canvas Module:** Drag-and-drop workflow designer
- **Agent Library:** Browse and configure agent templates
- **Monitoring Dashboard:** Real-time metrics and logs
- **Settings Module:** User preferences and integrations

**Structure:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── WorkflowCanvas.tsx
│   │   │   ├── AgentNode.tsx
│   │   │   ├── ConnectionEdge.tsx
│   │   │   └── CanvasControls.tsx
│   │   ├── AgentLibrary/
│   │   │   ├── TemplateGrid.tsx
│   │   │   ├── TemplateCard.tsx
│   │   │   └── TemplateConfig.tsx
│   │   ├── Monitoring/
│   │   │   ├── MetricsDashboard.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   └── AlertManager.tsx
│   │   └── common/
│   ├── features/
│   │   ├── workflows/
│   │   │   ├── workflowSlice.ts
│   │   │   └── workflowAPI.ts
│   │   ├── agents/
│   │   │   ├── agentSlice.ts
│   │   │   └── agentAPI.ts
│   │   └── auth/
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useWorkflow.ts
│   │   └── useAgent.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── websocket.ts
│   │   └── storage.ts
│   └── utils/
└── public/
```

**Performance Optimizations:**
- Code splitting by route
- Lazy loading for agent templates
- Virtual scrolling for large lists
- Memoization for expensive calculations
- Web Workers for heavy computations

---

### Backend Services

#### 1. API Gateway

**Technology:** Node.js, Express.js, Apollo Server  
**Purpose:** Single entry point for all client requests  
**Responsibilities:**
- Request routing
- Authentication/authorization
- Rate limiting
- Request/response transformation
- API versioning

**Endpoints:**
```
REST API:
POST   /api/v1/workflows           - Create workflow
GET    /api/v1/workflows/:id       - Get workflow
PUT    /api/v1/workflows/:id       - Update workflow
DELETE /api/v1/workflows/:id       - Delete workflow
POST   /api/v1/workflows/:id/execute - Execute workflow
GET    /api/v1/templates           - List templates
GET    /api/v1/agents              - List available agents

GraphQL API:
query {
  workflow(id: ID!) {
    id, name, agents { id, type, config }
  }
}
mutation {
  createWorkflow(input: WorkflowInput!) {
    id, name
  }
}

WebSocket:
/ws/workflows/:id/monitor - Real-time workflow updates
/ws/collaboration/:id     - Collaborative editing
```

**Implementation:**
```javascript
// express-server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Authentication middleware
app.use('/api/', authMiddleware);

// Route to services
app.use('/api/v1/workflows', 
  createProxyMiddleware({ target: 'http://workflow-service:3001' })
);
app.use('/api/v1/agents', 
  createProxyMiddleware({ target: 'http://agent-service:3002' })
);

app.listen(3000);
```

---

#### 2. Workflow Service

**Technology:** Node.js, TypeScript, Prisma ORM  
**Purpose:** Manage workflow definitions and metadata  
**Database:** PostgreSQL

**Responsibilities:**
- CRUD operations for workflows
- Workflow validation
- Template management
- Version control
- Access control

**Data Model:**
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  userId: string;
  workspaceId: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  agents: Agent[];
  connections: Connection[];
  config: WorkflowConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface Agent {
  id: string;
  workflowId: string;
  type: string;
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface Connection {
  id: string;
  workflowId: string;
  sourceAgentId: string;
  targetAgentId: string;
  condition?: string;
}
```

**Service Structure:**
```
workflow-service/
├── src/
│   ├── controllers/
│   │   ├── WorkflowController.ts
│   │   └── TemplateController.ts
│   ├── services/
│   │   ├── WorkflowService.ts
│   │   ├── ValidationService.ts
│   │   └── VersionService.ts
│   ├── models/
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   └── utils/
└── tests/
```

---

#### 3. Agent Execution Service

**Technology:** Node.js, TypeScript, Bull (job queue)  
**Purpose:** Execute workflows and coordinate agents  
**Database:** Redis (for state), MongoDB (for logs)

**Responsibilities:**
- Workflow execution orchestration
- Agent lifecycle management
- Message routing between agents
- State management
- Error handling and retries

**Architecture:**
```typescript
class AgentExecutionService {
  async executeWorkflow(workflowId: string, input: any): Promise<ExecutionResult> {
    // 1. Load workflow definition
    const workflow = await this.workflowService.getWorkflow(workflowId);
    
    // 2. Create execution context
    const executionId = generateId();
    const context = new ExecutionContext(executionId, workflow, input);
    
    // 3. Initialize agents
    const agents = await this.initializeAgents(workflow.agents);
    
    // 4. Execute workflow
    const result = await this.orchestrate(context, agents);
    
    // 5. Store results
    await this.saveExecution(executionId, result);
    
    return result;
  }
  
  async orchestrate(context: ExecutionContext, agents: Agent[]): Promise<any> {
    // Build execution graph
    const graph = this.buildExecutionGraph(context.workflow);
    
    // Execute in topological order with parallelization
    const executor = new GraphExecutor(graph, agents);
    return await executor.run();
  }
}
```

**Execution Flow:**
```
1. User triggers workflow
2. Create execution context
3. Load workflow definition
4. Initialize agents
   - Create agent instances
   - Load configurations
   - Authenticate with external services
5. Execute workflow
   - Resolve dependencies
   - Execute agents in parallel where possible
   - Pass messages between agents
   - Handle errors and retries
6. Collect results
7. Update monitoring metrics
8. Send completion notification
```

---

#### 4. Agent Runner (Worker Process)

**Technology:** Node.js, Gemini 3 SDK  
**Purpose:** Execute individual agents in isolated environments  
**Deployment:** Kubernetes pods or AWS Lambda

**Responsibilities:**
- Execute agent logic
- Call Gemini 3 API
- Execute tools (code, web scraping, etc.)
- Handle timeouts
- Report progress

**Implementation:**
```typescript
class AgentRunner {
  async run(agent: Agent, input: any, context: ExecutionContext): Promise<any> {
    try {
      // 1. Setup sandbox environment
      const sandbox = await this.createSandbox(agent);
      
      // 2. Initialize Gemini client
      const gemini = new GeminiClient({
        apiKey: process.env.GEMINI_API_KEY,
        model: agent.config.model || 'gemini-3-marathon'
      });
      
      // 3. Prepare prompt
      const prompt = this.buildPrompt(agent, input, context);
      
      // 4. Execute agent
      const response = await gemini.generateContent({
        contents: prompt,
        tools: this.getAvailableTools(agent),
        generationConfig: {
          maxOutputTokens: agent.config.maxTokens || 2048,
          temperature: agent.config.temperature || 0.7
        }
      });
      
      // 5. Process tool calls
      if (response.functionCalls) {
        const toolResults = await this.executeTools(
          response.functionCalls, 
          sandbox
        );
        // Continue conversation with tool results
      }
      
      // 6. Extract and validate result
      const result = this.parseResult(response);
      await this.validateResult(result, agent.config.schema);
      
      return result;
      
    } catch (error) {
      // Handle errors
      await this.handleError(error, agent, context);
      throw error;
    } finally {
      // Cleanup
      await this.destroySandbox();
    }
  }
}
```

---

#### 5. Monitoring Service

**Technology:** Node.js, InfluxDB (time-series), Elasticsearch (logs)  
**Purpose:** Collect and analyze system metrics and logs

**Responsibilities:**
- Metric collection from all services
- Log aggregation
- Real-time alerting
- Performance analytics
- Cost tracking

**Metrics Collected:**
```typescript
interface Metrics {
  // Workflow metrics
  workflowExecutionCount: Counter;
  workflowExecutionDuration: Histogram;
  workflowSuccessRate: Gauge;
  
  // Agent metrics
  agentExecutionTime: Histogram;
  agentTokenUsage: Counter;
  agentErrorRate: Gauge;
  
  // System metrics
  apiLatency: Histogram;
  apiThroughput: Counter;
  queueDepth: Gauge;
  
  // Resource metrics
  cpuUsage: Gauge;
  memoryUsage: Gauge;
  diskIO: Counter;
}
```

**Alert Rules:**
```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 0.05
    duration: 5m
    severity: critical
    
  - name: SlowExecution
    condition: p95_latency > 5000ms
    duration: 10m
    severity: warning
    
  - name: HighCost
    condition: daily_cost > $100
    duration: 1h
    severity: warning
```

---

#### 6. User Service

**Technology:** Node.js, Passport.js (auth), Stripe (billing)  
**Purpose:** User authentication, authorization, and account management

**Responsibilities:**
- User registration and login
- OAuth 2.0 integration
- RBAC (Role-Based Access Control)
- Workspace management
- Billing and subscriptions

**Authentication Flow:**
```
1. User visits AgentFlow
2. Redirected to login page
3. Options: Email/Password, Google OAuth, GitHub OAuth
4. Successful authentication
5. JWT token issued (expires in 24h)
6. Token stored in httpOnly cookie
7. All API requests include token
8. API Gateway validates token
9. User identity passed to services
```

**Authorization Model:**
```typescript
enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

enum Permission {
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_READ = 'workflow:read',
  WORKFLOW_UPDATE = 'workflow:update',
  WORKFLOW_DELETE = 'workflow:delete',
  WORKFLOW_EXECUTE = 'workflow:execute',
  TEMPLATE_PUBLISH = 'template:publish',
  WORKSPACE_MANAGE = 'workspace:manage'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [/* all permissions */],
  [Role.ADMIN]: [/* most permissions except billing */],
  [Role.MEMBER]: [/* read/write workflows */],
  [Role.VIEWER]: [/* read-only */]
};
```

---

## Data Architecture

### Database Design

#### PostgreSQL (Primary Database)

**Purpose:** Store structured data for workflows, users, and templates

**Schema:**
```sql
-- Users and Workspaces
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id),
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft',
  definition JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflows_workspace ON workflows(workspace_id);
CREATE INDEX idx_workflows_status ON workflows(status);

-- Executions
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  status VARCHAR(50) DEFAULT 'running',
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INT
);

CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);

-- Templates
CREATE TABLE agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  icon_url TEXT,
  config_schema JSONB NOT NULL,
  default_config JSONB,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  downloads INT DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON agent_templates(category);
CREATE INDEX idx_templates_public ON agent_templates(is_public);
```

**Partitioning Strategy:**
- Partition `workflow_executions` by month for performance
- Shard `workflows` by `workspace_id` for multi-tenancy

---

#### MongoDB (Logs and Events)

**Purpose:** Store unstructured logs and event streams

**Collections:**
```javascript
// Agent Logs
{
  _id: ObjectId,
  executionId: UUID,
  agentId: UUID,
  timestamp: ISODate,
  level: 'info' | 'warn' | 'error',
  message: String,
  metadata: Object,
  duration: Number
}

// Agent Messages
{
  _id: ObjectId,
  executionId: UUID,
  fromAgent: UUID,
  toAgent: UUID,
  timestamp: ISODate,
  messageType: String,
  payload: Object
}

// Audit Logs
{
  _id: ObjectId,
  userId: UUID,
  action: String,
  resource: String,
  resourceId: UUID,
  timestamp: ISODate,
  ipAddress: String,
  userAgent: String
}
```

**Indexing:**
```javascript
db.agent_logs.createIndex({ executionId: 1, timestamp: -1 });
db.agent_messages.createIndex({ executionId: 1, timestamp: 1 });
db.audit_logs.createIndex({ userId: 1, timestamp: -1 });
```

---

#### Redis (Cache and State)

**Purpose:** Fast in-memory storage for sessions, cache, and execution state

**Data Structures:**
```
// User sessions
SET user:session:{token} {userId, workspaceId, expiresAt} EX 86400

// Workflow execution state
HSET execution:{executionId} status "running"
HSET execution:{executionId} currentStep "agent-2"
HSET execution:{executionId} startTime "2026-01-29T10:00:00Z"

// Rate limiting
INCR ratelimit:{userId}:{window} EX 60

// Cache
SET cache:workflow:{id} {workflow-json} EX 300
SET cache:template:{id} {template-json} EX 3600
```

---

#### S3 (Object Storage)

**Purpose:** Store large files and artifacts

**Buckets:**
- `agentflow-workflows`: Workflow export files
- `agentflow-logs`: Log archives (30+ days old)
- `agentflow-artifacts`: Agent-generated files
- `agentflow-backups`: Database backups

**Structure:**
```
agentflow-artifacts/
├── {workspace-id}/
│   ├── {workflow-id}/
│   │   ├── {execution-id}/
│   │   │   ├── input.json
│   │   │   ├── output.json
│   │   │   ├── agent-1-output.txt
│   │   │   └── agent-2-report.pdf
```

---

## Infrastructure Architecture (Free Tier)

### Cloud Provider: Multi-Cloud Free Tier Strategy

#### Compute

**Vercel (Frontend):**
- Free unlimited deployments
- Automatic HTTPS
- Edge functions for API routes
- 100GB bandwidth/month (free)

**Railway.app (Backend):**
- $5/month free credit
- 500 hours/month execution
- Automatic deployments from GitHub
- Built-in PostgreSQL (alternative to Supabase)

**Alternative: Render.com (Free Tier):**
- 750 hours/month (free web service)
- Automatic HTTPS
- Auto-deploy from GitHub

**Ollama (Local Agent Execution):**
- Completely free
- Run locally or on Railway
- No API costs
- Privacy-first

**Configuration:**
```yaml
# vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}

# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/health"
restartPolicyType = "on-failure"
```

---

#### Database & Storage

**Supabase (Free Tier):**
- PostgreSQL database (500MB)
- 2GB bandwidth/month
- Real-time subscriptions
- Row-level security
- Automatic backups
- Built-in auth

**Upstash Redis (Free Tier):**
- 10,000 commands/day
- Global edge caching
- Persistent storage
- Perfect for sessions & cache

**Cloudflare R2 (Free Tier):**
- 10GB storage
- 1M Class A operations/month
- 10M Class B operations/month
- Zero egress fees

**Structure:**
```
Supabase PostgreSQL:
├── users (auth handled by Supabase)
├── workspaces
├── workflows
├── executions
└── templates

Upstash Redis:
├── user:session:{token}
├── cache:workflow:{id}
├── queue:agent:tasks
└── ratelimit:{userId}

Cloudflare R2:
└── agentflow-storage/
    ├── workflows/
    ├── artifacts/
    └── logs/
```

---

#### Message Queue

**BullMQ + Upstash Redis:**
```typescript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.UPSTASH_REDIS_HOST,
  port: 6379,
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {}
});

// Create queue
const workflowQueue = new Queue('workflows', { connection });

// Add job
await workflowQueue.add('execute', {
  workflowId: '123',
  input: { query: 'test' }
});

// Process jobs
const worker = new Worker('workflows', async (job) => {
  const { workflowId, input } = job.data;
  await executeWorkflow(workflowId, input);
}, { connection });
```

**Alternative (Development): In-Memory Queue**
```typescript
// Simple in-memory queue for local development
class SimpleQueue {
  private queue: Array<{ id: string; data: any }> = [];
  
  async add(name: string, data: any) {
    this.queue.push({ id: generateId(), data });
    this.process();
  }
  
  private async process() {
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      await this.handler(job);
    }
  }
}
```

---

#### Networking

**Cloudflare (Free Tier):**
- Unlimited DDoS protection
- Free SSL/TLS
- CDN with edge caching
- Web Application Firewall (WAF)
- DNS management

**Configuration:**
```
Domain Setup:
├── agentflow.app (primary domain)
├── www.agentflow.app → agentflow.app (redirect)
├── api.agentflow.app → Railway backend
└── cdn.agentflow.app → Cloudflare R2

SSL: Automatic (Cloudflare + Vercel)
CDN: Edge caching for static assets
WAF: Basic protection (free tier)
```

---

## Security Architecture

### Authentication

**JWT Tokens:**
```typescript
interface JWTPayload {
  sub: string;        // User ID
  email: string;
  workspaceId: string;
  role: string;
  iat: number;        // Issued at
  exp: number;        // Expires at (24 hours)
}
```

**Token Flow:**
1. User logs in → JWT issued
2. Frontend stores in httpOnly cookie
3. Every API request includes cookie
4. API Gateway validates signature
5. Expired tokens refreshed automatically

**OAuth 2.0 Integration:**
- Google Sign-In
- GitHub OAuth
- Microsoft Azure AD (Enterprise)

---

### Authorization

**RBAC Implementation:**
```typescript
class AuthorizationMiddleware {
  async checkPermission(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    const resource = req.params.workflowId;
    const action = req.method; // GET, POST, PUT, DELETE
    
    // Check workspace membership
    const member = await db.workspaceMembers.findOne({
      workspaceId: user.workspaceId,
      userId: user.id
    });
    
    // Check role permissions
    const hasPermission = this.roleHasPermission(
      member.role, 
      `workflow:${action.toLowerCase()}`
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  }
}
```

---

### Encryption

**Data at Rest:**
- PostgreSQL: Transparent Data Encryption (TDE)
- MongoDB: Encryption at rest enabled
- S3: Server-side encryption (AES-256)
- Redis: Encryption enabled

**Data in Transit:**
- TLS 1.3 for all connections
- Certificate pinning for mobile apps
- Mutual TLS for service-to-service

**Secrets Management:**
- AWS Secrets Manager for API keys
- Rotation every 90 days
- Audit log for all secret access

---

### API Security

**Rate Limiting:**
```typescript
const rateLimits = {
  anonymous: { requests: 10, window: '1m' },
  free: { requests: 100, window: '1h' },
  pro: { requests: 1000, window: '1h' },
  enterprise: { requests: 10000, window: '1h' }
};
```

**Input Validation:**
- Schema validation with Joi/Zod
- SQL injection prevention (parameterized queries)
- XSS protection (Content Security Policy)
- CSRF tokens for state-changing operations

**DDoS Protection:**
- CloudFlare WAF (Web Application Firewall)
- Rate limiting per IP and user
- Challenge pages for suspicious traffic

---

## Integration Architecture

### Gemini 3 API Integration

**SDK Usage:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private client: GoogleGenerativeAI;
  
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  
  async executeAgent(agent: Agent, input: any): Promise<any> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-3-marathon',
      tools: this.buildTools(agent),
      systemInstruction: agent.config.systemPrompt
    });
    
    const chat = model.startChat({
      history: this.buildHistory(agent, input)
    });
    
    const result = await chat.sendMessage(input.message);
    return this.parseResponse(result);
  }
  
  private buildTools(agent: Agent): Tool[] {
    const tools = [];
    
    if (agent.config.enableWebSearch) {
      tools.push({
        functionDeclarations: [{
          name: 'web_search',
          description: 'Search the web for information',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            }
          }
        }]
      });
    }
    
    // Add custom tools from agent config
    for (const tool of agent.config.tools || []) {
      tools.push(this.buildToolDeclaration(tool));
    }
    
    return tools;
  }
}
```

---

### Multi-Model Provider Architecture

**Purpose:** Support multiple AI model providers with unified interface

**Adapter Pattern Implementation:**

```typescript
// Base interface for all model providers
interface ModelProvider {
  name: string;
  type: 'cloud' | 'local' | 'custom';
  generateResponse(prompt: string, config: ModelConfig): Promise<ModelResponse>;
  streamResponse(prompt: string, config: ModelConfig): AsyncIterator<string>;
  supportsFunctionCalling(): boolean;
  supportsVision(): boolean;
  getTokenCount(text: string): number;
  estimateCost(inputTokens: number, outputTokens: number): number;
}

// Model configuration
interface ModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  tools?: Tool[];
  systemPrompt?: string;
}

// Unified response format
interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls' | 'error';
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metadata: {
    model: string;
    provider: string;
    latency: number;
    cost: number;
  };
}
```

**Provider Implementations:**

```typescript
// 1. Gemini Provider
class GeminiProvider implements ModelProvider {
  name = 'gemini';
  type = 'cloud' as const;
  private client: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }
  
  async generateResponse(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    const model = this.client.getGenerativeModel({
      model: config.model || 'gemini-3-marathon',
      systemInstruction: config.systemPrompt
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topP: config.topP
      },
      tools: config.tools
    });
    
    return this.formatResponse(result);
  }
  
  supportsFunctionCalling = () => true;
  supportsVision = () => true;
  
  getTokenCount(text: string): number {
    // Approximate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  estimateCost(inputTokens: number, outputTokens: number): number {
    // Gemini 3 pricing (example)
    const inputCost = (inputTokens / 1000) * 0.00035;
    const outputCost = (outputTokens / 1000) * 0.00105;
    return inputCost + outputCost;
  }
}

// 2. OpenAI Provider
class OpenAIProvider implements ModelProvider {
  name = 'openai';
  type = 'cloud' as const;
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }
  
  async generateResponse(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    const response = await this.client.chat.completions.create({
      model: config.model || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: config.systemPrompt || '' },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty,
      tools: config.tools?.map(t => this.convertToOpenAITool(t))
    });
    
    return this.formatResponse(response);
  }
  
  supportsFunctionCalling = () => true;
  supportsVision = () => true;
  
  estimateCost(inputTokens: number, outputTokens: number): number {
    // GPT-4 pricing
    const inputCost = (inputTokens / 1000) * 0.03;
    const outputCost = (outputTokens / 1000) * 0.06;
    return inputCost + outputCost;
  }
}

// 3. Anthropic Provider
class AnthropicProvider implements ModelProvider {
  name = 'anthropic';
  type = 'cloud' as const;
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async generateResponse(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    const response = await this.client.messages.create({
      model: config.model || 'claude-3-sonnet-20240229',
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature,
      system: config.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      tools: config.tools?.map(t => this.convertToAnthropicTool(t))
    });
    
    return this.formatResponse(response);
  }
  
  supportsFunctionCalling = () => true;
  supportsVision = () => true;
}

// 4. Ollama Provider (Local)
class OllamaProvider implements ModelProvider {
  name = 'ollama';
  type = 'local' as const;
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }
  
  async generateResponse(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama3',
        prompt: this.buildPrompt(prompt, config.systemPrompt),
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
          top_p: config.topP,
          stop: config.stopSequences
        }
      })
    });
    
    const data = await response.json();
    return this.formatResponse(data);
  }
  
  async *streamResponse(prompt: string, config: ModelConfig): AsyncIterator<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama3',
        prompt: this.buildPrompt(prompt, config.systemPrompt),
        stream: true,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens
        }
      })
    });
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.response) {
          yield data.response;
        }
      }
    }
  }
  
  supportsFunctionCalling = () => false; // Most Ollama models don't support function calling
  supportsVision = () => false; // Text-only for most models
  
  estimateCost(inputTokens: number, outputTokens: number): number {
    return 0; // Local execution is free
  }
  
  // Ollama-specific methods
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json();
    return data.models.map(m => m.name);
  }
  
  async downloadModel(model: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model })
    });
  }
  
  async deleteModel(model: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model })
    });
  }
  
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private buildPrompt(userPrompt: string, systemPrompt?: string): string {
    if (!systemPrompt) return userPrompt;
    return `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`;
  }
}

// 5. Custom Provider (for vLLM, LM Studio, etc.)
class CustomProvider implements ModelProvider {
  name = 'custom';
  type = 'custom' as const;
  private endpoint: string;
  private headers: Record<string, string>;
  
  constructor(endpoint: string, apiKey?: string) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
    };
  }
  
  async generateResponse(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    // Assume OpenAI-compatible format
    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: config.model || 'default',
        messages: [
          { role: 'system', content: config.systemPrompt || '' },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });
    
    const data = await response.json();
    return this.formatResponse(data);
  }
  
  supportsFunctionCalling = () => false;
  supportsVision = () => false;
  estimateCost = () => 0; // User-managed
}
```

**Provider Manager:**

```typescript
class ModelProviderManager {
  private providers: Map<string, ModelProvider> = new Map();
  
  registerProvider(provider: ModelProvider): void {
    this.providers.set(provider.name, provider);
  }
  
  getProvider(name: string): ModelProvider | undefined {
    return this.providers.get(name);
  }
  
  async executeAgent(
    agent: Agent, 
    input: any, 
    context: ExecutionContext
  ): Promise<ModelResponse> {
    const providerName = agent.config.provider || 'gemini';
    const provider = this.getProvider(providerName);
    
    if (!provider) {
      // Fallback to primary provider
      const fallback = this.getProvider(agent.config.fallbackProvider || 'gemini');
      if (!fallback) throw new Error('No provider available');
      return this.executeWithProvider(fallback, agent, input, context);
    }
    
    try {
      return await this.executeWithProvider(provider, agent, input, context);
    } catch (error) {
      // Try fallback if available
      if (agent.config.fallbackProvider) {
        const fallback = this.getProvider(agent.config.fallbackProvider);
        if (fallback) {
          console.log(`Falling back to ${fallback.name}`);
          return await this.executeWithProvider(fallback, agent, input, context);
        }
      }
      throw error;
    }
  }
  
  private async executeWithProvider(
    provider: ModelProvider,
    agent: Agent,
    input: any,
    context: ExecutionContext
  ): Promise<ModelResponse> {
    const prompt = this.buildPrompt(agent, input, context);
    const config = this.buildConfig(agent);
    
    const startTime = Date.now();
    const response = await provider.generateResponse(prompt, config);
    const latency = Date.now() - startTime;
    
    // Track metrics
    await this.trackMetrics({
      agentId: agent.id,
      provider: provider.name,
      model: config.model,
      latency,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cost: response.metadata.cost
    });
    
    return response;
  }
}
```

**Ollama Service Layer:**

```typescript
class OllamaService {
  private provider: OllamaProvider;
  
  constructor() {
    this.provider = new OllamaProvider();
  }
  
  async getStatus(): Promise<OllamaStatus> {
    const isConnected = await this.provider.checkConnection();
    if (!isConnected) {
      return { connected: false, models: [] };
    }
    
    const models = await this.provider.listModels();
    return {
      connected: true,
      models: models.map(name => ({
        name,
        size: this.getModelSize(name),
        family: this.getModelFamily(name)
      }))
    };
  }
  
  async downloadModel(model: string): Promise<void> {
    // Download with progress tracking
    await this.provider.downloadModel(model);
    // Notify user via WebSocket
    this.notifyModelDownloaded(model);
  }
  
  async installOllama(): Promise<void> {
    // Provide installation instructions
    throw new Error('Please install Ollama from https://ollama.ai');
  }
  
  private getModelSize(name: string): string {
    // Parse model name for size (e.g., "llama3:8b" -> "8B")
    const match = name.match(/:(\d+)b/i);
    return match ? `${match[1]}B` : 'Unknown';
  }
  
  private getModelFamily(name: string): string {
    if (name.startsWith('llama')) return 'Llama';
    if (name.startsWith('mistral')) return 'Mistral';
    if (name.startsWith('codellama')) return 'Code Llama';
    if (name.startsWith('phi')) return 'Phi';
    return 'Other';
  }
}
```

**Frontend Integration:**

```typescript
// React component for model selection
function ModelSelector({ agent, onChange }) {
  const [providers, setProviders] = useState([]);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  
  useEffect(() => {
    fetchProviders();
    checkOllamaStatus();
  }, []);
  
  const checkOllamaStatus = async () => {
    const status = await api.ollama.getStatus();
    setOllamaStatus(status);
  };
  
  const downloadModel = async (model) => {
    await api.ollama.downloadModel(model);
    await checkOllamaStatus();
  };
  
  return (
    <div>
      <Select
        value={agent.config.provider}
        onChange={(e) => onChange({ ...agent, config: { ...agent.config, provider: e.target.value }})}
      >
        <option value="gemini">Gemini 3 (Cloud)</option>
        <option value="openai">OpenAI (Cloud)</option>
        <option value="anthropic">Anthropic (Cloud)</option>
        <option value="ollama" disabled={!ollamaStatus?.connected}>
          Ollama (Local) {ollamaStatus?.connected ? '✓' : '✗'}
        </option>
        <option value="custom">Custom Endpoint</option>
      </Select>
      
      {agent.config.provider === 'ollama' && ollamaStatus?.connected && (
        <Select
          value={agent.config.model}
          onChange={(e) => onChange({ ...agent, config: { ...agent.config, model: e.target.value }})}
        >
          {ollamaStatus.models.map(model => (
            <option key={model.name} value={model.name}>
              {model.name} ({model.size})
            </option>
          ))}
        </Select>
      )}
      
      {agent.config.provider === 'ollama' && !ollamaStatus?.connected && (
        <Alert severity="warning">
          Ollama not detected. <Link href="https://ollama.ai">Install Ollama</Link>
        </Alert>
      )}
    </div>
  );
}
```

**Benefits:**
- **Flexibility:** Switch models without changing workflow logic
- **Cost Optimization:** Use expensive models only when needed
- **Privacy:** Run sensitive data through local models
- **Reliability:** Automatic fallback to alternative providers
- **Testing:** Compare model performance side-by-side
- **Offline Support:** Work without internet using Ollama

**Supported Ollama Models:**
- Llama 3 (8B, 70B, 405B)
- Mistral (7B, Mixtral 8x7B)
- Code Llama (7B, 13B, 34B)
- Phi-3 (Mini, Small, Medium)
- Gemma (2B, 7B)
- Qwen, DeepSeek, Vicuna, and 60+ more

---

### MCP (Model Context Protocol) Integration

**Purpose:** Enable agents to use external tools via standardized protocol

**Implementation:**
```typescript
class MCPClient {
  async executeTool(tool: MCPTool, params: any): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      method: 'tools/execute',
      params: {
        name: tool.name,
        arguments: params
      },
      id: generateId()
    };
    
    const response = await fetch(tool.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new MCPError(result.error);
    }
    
    return result.result;
  }
}
```

**Built-in MCP Tools:**
- File system operations
- Database queries (read-only)
- Web scraping (via Playwright)
- API calls with OAuth
- Email sending

---

### Third-Party Integrations

**Gmail Integration:**
```typescript
class GmailIntegration {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://agentflow.ai/oauth/callback'
    );
    
    oauth2Client.setCredentials({
      refresh_token: user.gmailRefreshToken
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const message = this.createMessage(to, subject, body);
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: message }
    });
  }
}
```

**Slack Integration:**
```typescript
class SlackIntegration {
  async postMessage(channel: string, text: string): Promise<void> {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.slackToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ channel, text })
    });
  }
}
```

---

## Deployment Architecture

### CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: agentflow/api:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster agentflow-prod \
            --service api-gateway \
            --force-new-deployment
```

---

### Environments

**Development:**
- Branch: `develop`
- URL: `dev.agentflow.ai`
- Database: Shared dev database
- Auto-deploy on commit

**Staging:**
- Branch: `staging`
- URL: `staging.agentflow.ai`
- Database: Production-like data (anonymized)
- Deploy via GitHub release

**Production:**
- Branch: `main`
- URL: `app.agentflow.ai`
- Database: Production database
- Blue-green deployment
- Rollback capability

---

### Infrastructure as Code

**Terraform Configuration:**
```hcl
# terraform/main.tf
provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "agentflow" {
  name = "agentflow-${var.environment}"
}

resource "aws_ecs_service" "api_gateway" {
  name            = "api-gateway"
  cluster         = aws_ecs_cluster.agentflow.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = var.api_gateway_count
  
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api-gateway"
    container_port   = 3000
  }
  
  autoscaling {
    min_capacity = 2
    max_capacity = 10
    
    target_tracking_scaling_policy {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
      target_value           = 70
    }
  }
}
```

---

## Scalability and Performance

### Horizontal Scaling

**Service Scaling:**
- API Gateway: 2-10 instances (CPU-based)
- Workflow Service: 2-10 instances (request-based)
- Agent Execution: 5-50 instances (queue depth)
- Agent Runners: 0-500 Lambda functions (on-demand)

**Database Scaling:**
- PostgreSQL: Read replicas (2-5)
- MongoDB: Sharded cluster (3-10 shards)
- Redis: Cluster mode (3-6 nodes)

---

### Caching Strategy

**Multi-Layer Cache:**
```
Layer 1: Browser Cache (1 hour)
  - Static assets
  - Template icons

Layer 2: CDN Cache (24 hours)
  - Images, CSS, JS
  - Public templates

Layer 3: Redis Cache (5-60 minutes)
  - Workflow definitions
  - User sessions
  - API responses

Layer 4: Database Query Cache (1 minute)
  - Frequent queries
```

---

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Latency (p95) | <200ms | APM tools |
| Workflow Start Time | <500ms | Custom metrics |
| Agent Execution Time | <30s (avg) | Logs |
| WebSocket Latency | <100ms | Network monitoring |
| Database Query Time | <50ms (p95) | Query profiling |
| Page Load Time | <2s | Lighthouse |

---

## Monitoring and Observability

### Logging

**Log Aggregation Stack:**
- **Fluentd:** Log collection from all services
- **Elasticsearch:** Log storage and indexing
- **Kibana:** Log visualization and search

**Log Format:**
```json
{
  "timestamp": "2026-01-29T10:00:00.000Z",
  "service": "agent-execution",
  "level": "info",
  "message": "Agent execution completed",
  "executionId": "exec-123",
  "agentId": "agent-456",
  "duration": 2340,
  "tokenUsage": 1500,
  "userId": "user-789"
}
```

---

### Metrics

**Prometheus + Grafana:**

**Dashboards:**
1. System Overview: CPU, memory, network across all services
2. Workflow Performance: Execution times, success rates
3. Agent Analytics: Token usage, costs, error rates
4. API Metrics: Request rates, latencies, errors
5. Business Metrics: User signups, workflow creations

**Key Metrics:**
```promql
# Workflow execution rate
rate(workflow_executions_total[5m])

# Agent success rate
sum(rate(agent_executions_success[5m])) / sum(rate(agent_executions_total[5m]))

# API latency
histogram_quantile(0.95, api_request_duration_seconds_bucket)

# Queue depth
rabbitmq_queue_messages{queue="agent.tasks"}
```

---

### Tracing

**OpenTelemetry Integration:**
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('agentflow');

async function executeWorkflow(workflowId: string) {
  const span = tracer.startSpan('execute_workflow');
  span.setAttribute('workflow.id', workflowId);
  
  try {
    const workflow = await loadWorkflow(workflowId);
    span.addEvent('workflow_loaded');
    
    const result = await orchestrate(workflow);
    span.addEvent('orchestration_complete');
    
    return result;
  } finally {
    span.end();
  }
}
```

---

### Alerting

**PagerDuty Integration:**

**Critical Alerts:**
- Service down (>5 minutes)
- Database connection failure
- API error rate >5%
- Workflow execution failure >20%

**Warning Alerts:**
- High latency (p95 >500ms for 10 minutes)
- Queue backlog (>1000 messages for 15 minutes)
- High memory usage (>80% for 10 minutes)

---

## Disaster Recovery

### Backup Strategy

**Automated Backups:**
- PostgreSQL: Full backup daily, incremental every 6 hours
- MongoDB: Snapshot every 12 hours
- Redis: RDB snapshot every hour
- S3: Versioning enabled, lifecycle policies

**Retention Policy:**
- Daily backups: 30 days
- Weekly backups: 3 months
- Monthly backups: 1 year

---

### Recovery Procedures

**RTO (Recovery Time Objective):** 1 hour  
**RPO (Recovery Point Objective):** 6 hours

**Recovery Steps:**
1. Incident detected and PagerDuty alert triggered
2. On-call engineer assesses severity
3. If critical: Activate disaster recovery plan
4. Restore from most recent backup
5. Validate data integrity
6. Switch DNS to backup region (if needed)
7. Monitor system health
8. Post-incident review

---

## Development and Testing

### Development Environment

**Local Setup:**
```bash
# Clone repository
git clone https://github.com/agentflow/agentflow.git
cd agentflow

# Install dependencies
npm install

# Start Docker services
docker-compose up -d postgres redis rabbitmq

# Run database migrations
npm run migrate

# Start development servers
npm run dev:api        # API Gateway on :3000
npm run dev:workflow   # Workflow Service on :3001
npm run dev:agent      # Agent Service on :3002
npm run dev:frontend   # React app on :5173
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: agentflow
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

---

### Testing Strategy

**Unit Tests:**
- Framework: Jest
- Coverage target: 80%
- Run on every commit

**Integration Tests:**
- Framework: Supertest
- Test API endpoints end-to-end
- Run before deployment

**E2E Tests:**
- Framework: Playwright
- Test user workflows in browser
- Run nightly

**Load Tests:**
- Framework: k6
- Simulate 1000 concurrent users
- Run weekly

**Example Test:**
```typescript
describe('Workflow Execution', () => {
  it('should execute a simple 2-agent workflow', async () => {
    // Create workflow
    const workflow = await createWorkflow({
      name: 'Test Workflow',
      agents: [
        { type: 'web-scraper', config: { url: 'https://example.com' } },
        { type: 'summarizer', config: {} }
      ],
      connections: [
        { from: 'agent-1', to: 'agent-2' }
      ]
    });
    
    // Execute
    const execution = await executeWorkflow(workflow.id, { query: 'test' });
    
    // Assert
    expect(execution.status).toBe('completed');
    expect(execution.result).toBeDefined();
  });
});
```

---

## Technology Stack (Free & Optimized)

### Frontend
- **Framework:** React 18, TypeScript
- **Build Tool:** Vite (faster than Webpack)
- **State:** Zustand (lighter than Redux)
- **UI:** shadcn/ui + Tailwind CSS (free, customizable)
- **Canvas:** React Flow (MIT license)
- **Icons:** Lucide React (free)
- **Charts:** Recharts (free)
- **API Client:** TanStack Query (React Query)

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js (lightweight)
- **Language:** TypeScript
- **ORM:** Prisma (works with Supabase PostgreSQL)
- **Queue:** BullMQ (Redis-backed)
- **Validation:** Zod (TypeScript-first)

### Databases
- **Primary:** PostgreSQL (Supabase free tier)
- **Cache:** Upstash Redis (free tier)
- **File Storage:** Cloudflare R2 (free tier)

### Infrastructure
- **Frontend Hosting:** Vercel (free, unlimited)
- **Backend Hosting:** Railway.app or Render.com (free tier)
- **Database:** Supabase (free tier)
- **CDN:** Cloudflare (free tier)
- **DNS:** Cloudflare (free)

### AI/ML
- **Primary Model:** Gemini API (free tier: 60 req/min)
- **Fast Inference:** Groq API (free, very fast)
- **Local Models:** Ollama (completely free)
- **Fallback:** Together.ai (free tier)
- **SDK:** @google/generative-ai, groq-sdk

### DevOps
- **CI/CD:** GitHub Actions (2000 min/month free)
- **Version Control:** GitHub (free)
- **Monitoring:** Sentry (free tier: 5K events/month)
- **Analytics:** Vercel Analytics (free)
- **Logging:** Supabase Logs (built-in, free)

---

## Appendix

### Glossary

- **Agent:** An autonomous AI entity that performs tasks
- **Workflow:** A graph of connected agents that collaborate
- **Orchestration:** Coordination of agent execution
- **Marathon Agent:** Gemini 3's long-running agent capability
- **MCP:** Model Context Protocol for tool integration
- **Template:** Pre-configured agent or workflow

### References

- Gemini 3 API Docs: https://ai.google.dev/gemini-api
- React Flow: https://reactflow.dev/
- MCP Specification: https://modelcontextprotocol.io/
- AWS ECS: https://docs.aws.amazon.com/ecs/

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Next Review:** February 15, 2026
