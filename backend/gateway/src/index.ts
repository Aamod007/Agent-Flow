import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import proxy from 'express-http-proxy';

// Load .env from project root (works from both root and backend/gateway)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.GATEWAY_PORT || process.env.PORT || 3000;
const WORKFLOW_SERVICE_URL = process.env.WORKFLOW_SERVICE_URL || 'http://localhost:3001';
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json());

// Error handler for proxy failures
const createProxyErrorHandler = (serviceName: string) => (err: Error, res: Response, next: NextFunction) => {
    console.error(`[Gateway] ${serviceName} proxy error:`, err.message);
    if (!res.headersSent) {
        res.status(503).json({ 
            error: `${serviceName} is unavailable`,
            message: 'The service might be starting up. Please try again in a moment.'
        });
    }
};

// Create proxy with error handling
const createProxy = (targetUrl: string, serviceName: string, pathResolver: (req: Request) => string) => {
    return proxy(targetUrl, {
        proxyReqPathResolver: pathResolver,
        proxyErrorHandler: createProxyErrorHandler(serviceName)
    });
};

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
});

// Proxy requests to Workflow Service
app.use('/api/workflows', createProxy(WORKFLOW_SERVICE_URL, 'Workflow Service', (req) => {
    return '/workflows' + (req.url === '/' ? '' : req.url);
}));

// Proxy execution endpoints to Workflow Service
app.use('/api/executions', createProxy(WORKFLOW_SERVICE_URL, 'Workflow Service', (req) => {
    return '/executions' + (req.url === '/' ? '' : req.url);
}));

// Proxy analytics endpoint
app.use('/api/analytics', createProxy(WORKFLOW_SERVICE_URL, 'Workflow Service', (req) => {
    return '/analytics' + (req.url === '/' ? '' : req.url);
}));

// Proxy templates endpoint
app.use('/api/templates', createProxy(WORKFLOW_SERVICE_URL, 'Workflow Service', () => '/templates'));

// Proxy user endpoints to Workflow Service
app.use('/api/user', createProxy(WORKFLOW_SERVICE_URL, 'Workflow Service', (req) => {
    return '/user' + (req.url === '/' ? '' : req.url);
}));

// Proxy connections endpoints to Workflow Service
app.use('/api/connections', createProxy(WORKFLOW_SERVICE_URL, 'Workflow Service', (req) => {
    return '/connections' + (req.url === '/' ? '' : req.url);
}));

// Proxy OAuth endpoints to Workflow Service
app.use('/api/oauth', createProxy(WORKFLOW_SERVICE_URL, 'Workflow Service', (req) => {
    return '/oauth' + (req.url === '/' ? '' : req.url);
}));

// Proxy model provider endpoints to Execution Service
app.use('/api/providers', createProxy(EXECUTION_SERVICE_URL, 'Execution Service', (req) => {
    return '/providers' + (req.url === '/' ? '' : req.url);
}));

// Direct execution endpoint (for testing)
app.use('/api/execute', createProxy(EXECUTION_SERVICE_URL, 'Execution Service', () => '/execute'));

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Gateway] Unhandled error:', err.message);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal gateway error' });
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`  - Workflow Service: ${WORKFLOW_SERVICE_URL}`);
    console.log(`  - Execution Service: ${EXECUTION_SERVICE_URL}`);
});
