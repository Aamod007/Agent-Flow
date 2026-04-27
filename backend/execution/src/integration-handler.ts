/**
 * Integration Handler
 * 
 * Executes app integration nodes (Slack, Gmail, GitHub, etc.)
 * Uses stored credentials from connections to authenticate with external services.
 */

import { DataItem } from './enhanced-executor';

// Buffer is globally available in Node.js
declare const Buffer: {
    from(str: string): { toString(encoding: string): string };
};

// ============================================================
// Types
// ============================================================

export interface IntegrationCredentials {
    id: string;
    providerId: string;
    credentials: Record<string, string>;
    status: 'active' | 'expired' | 'error';
}

export interface IntegrationConfig {
    connectionId?: string;
    operation: string;
    [key: string]: unknown;
}

export interface IntegrationResult {
    success: boolean;
    data?: DataItem[];
    error?: string;
    metadata?: {
        rateLimitRemaining?: number;
        executionTime?: number;
    };
}

// ============================================================
// Base Integration Handler
// ============================================================

export abstract class BaseIntegrationHandler {
    protected credentials: IntegrationCredentials | null = null;
    protected providerId: string;

    constructor(providerId: string) {
        this.providerId = providerId;
    }

    async setCredentials(credentials: IntegrationCredentials): Promise<void> {
        if (credentials.status !== 'active') {
            throw new Error(`Credentials are ${credentials.status}. Please reconnect.`);
        }
        this.credentials = credentials;
    }

    abstract execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult>;

    protected ensureCredentials(): void {
        if (!this.credentials) {
            throw new Error(`No credentials configured for ${this.providerId}`);
        }
    }
}

// ============================================================
// Slack Integration
// ============================================================

export class SlackIntegration extends BaseIntegrationHandler {
    constructor() {
        super('slack');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const token = this.credentials!.credentials.botToken || this.credentials!.credentials.accessToken;
        
        const startTime = Date.now();

        try {
            switch (operation) {
                case 'send_message':
                    return await this.sendMessage(token, config, input);
                case 'get_messages':
                    return await this.getMessages(token, config);
                case 'create_channel':
                    return await this.createChannel(token, config);
                case 'upload_file':
                    return await this.uploadFile(token, config, input);
                default:
                    throw new Error(`Unsupported Slack operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: { executionTime: Date.now() - startTime }
            };
        }
    }

    private async sendMessage(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const channel = config.channel as string;
        const messageTemplate = config.message as string;

        const results: DataItem[] = [];

        for (const item of input) {
            // Replace template variables
            let message = messageTemplate;
            Object.entries(item.json).forEach(([key, value]) => {
                message = message.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
            });

            const response = await fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channel,
                    text: message,
                }),
            });

            const data = await response.json();
            
            if (!data.ok) {
                throw new Error(`Slack API error: ${data.error}`);
            }

            results.push({
                json: {
                    ok: data.ok,
                    channel: data.channel,
                    ts: data.ts,
                    message: data.message,
                }
            });
        }

        return { success: true, data: results };
    }

    private async getMessages(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const channel = config.channel as string;
        const limit = (config.limit as number) || 10;

        const response = await fetch(`https://slack.com/api/conversations.history?channel=${channel}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        const items: DataItem[] = data.messages.map((msg: any) => ({
            json: {
                text: msg.text,
                user: msg.user,
                ts: msg.ts,
                type: msg.type,
            }
        }));

        return { success: true, data: items };
    }

    private async createChannel(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const name = config.channelName as string;
        const isPrivate = config.isPrivate as boolean || false;

        const response = await fetch('https://slack.com/api/conversations.create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                is_private: isPrivate,
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return {
            success: true,
            data: [{
                json: {
                    id: data.channel.id,
                    name: data.channel.name,
                    is_private: data.channel.is_private,
                }
            }]
        };
    }

    private async uploadFile(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        // Implementation for file upload
        throw new Error('File upload not yet implemented');
    }
}

// ============================================================
// Gmail Integration
// ============================================================

export class GmailIntegration extends BaseIntegrationHandler {
    constructor() {
        super('gmail');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const accessToken = this.credentials!.credentials.accessToken;

        try {
            switch (operation) {
                case 'send_email':
                    return await this.sendEmail(accessToken, config, input);
                case 'get_emails':
                    return await this.getEmails(accessToken, config);
                default:
                    throw new Error(`Unsupported Gmail operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async sendEmail(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const results: DataItem[] = [];

        for (const item of input) {
            const to = this.resolveTemplate(config.to as string, item.json);
            const subject = this.resolveTemplate(config.subject as string, item.json);
            const body = this.resolveTemplate(config.body as string, item.json);

            // Create email in RFC 2822 format
            const email = [
                `To: ${to}`,
                `Subject: ${subject}`,
                'Content-Type: text/html; charset=utf-8',
                '',
                body,
            ].join('\r\n');

            const encodedEmail = Buffer.from(email).toString('base64url');

            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ raw: encodedEmail }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            results.push({
                json: {
                    id: data.id,
                    threadId: data.threadId,
                    to,
                    subject,
                }
            });
        }

        return { success: true, data: results };
    }

    private async getEmails(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const query = config.query as string || '';
        const maxResults = (config.maxResults as number) || 10;

        const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        // Fetch full message details for each message
        const messages: DataItem[] = [];
        for (const msg of data.messages || []) {
            const msgResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );
            const msgData = await msgResponse.json();
            
            const headers = msgData.payload?.headers || [];
            messages.push({
                json: {
                    id: msgData.id,
                    threadId: msgData.threadId,
                    subject: headers.find((h: any) => h.name === 'Subject')?.value,
                    from: headers.find((h: any) => h.name === 'From')?.value,
                    to: headers.find((h: any) => h.name === 'To')?.value,
                    date: headers.find((h: any) => h.name === 'Date')?.value,
                    snippet: msgData.snippet,
                }
            });
        }

        return { success: true, data: messages };
    }

    private resolveTemplate(template: string, data: Record<string, unknown>): string {
        let result = template;
        Object.entries(data).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
        });
        return result;
    }
}

// ============================================================
// GitHub Integration
// ============================================================

export class GitHubIntegration extends BaseIntegrationHandler {
    constructor() {
        super('github');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const token = this.credentials!.credentials.accessToken;

        try {
            switch (operation) {
                case 'create_issue':
                    return await this.createIssue(token, config, input);
                case 'get_issues':
                    return await this.getIssues(token, config);
                case 'get_repos':
                    return await this.getRepos(token);
                case 'create_comment':
                    return await this.createComment(token, config, input);
                default:
                    throw new Error(`Unsupported GitHub operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async createIssue(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const owner = config.owner as string;
        const repo = config.repo as string;
        const results: DataItem[] = [];

        for (const item of input) {
            const title = this.resolveTemplate(config.title as string, item.json);
            const body = this.resolveTemplate(config.body as string || '', item.json);

            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
                body: JSON.stringify({ title, body }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GitHub API error: ${error.message || 'Unknown error'}`);
            }

            const data = await response.json();
            results.push({
                json: {
                    id: data.id,
                    number: data.number,
                    title: data.title,
                    url: data.html_url,
                    state: data.state,
                }
            });
        }

        return { success: true, data: results };
    }

    private async getIssues(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const owner = config.owner as string;
        const repo = config.repo as string;
        const state = config.state as string || 'open';

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const items: DataItem[] = data.map((issue: any) => ({
            json: {
                id: issue.id,
                number: issue.number,
                title: issue.title,
                state: issue.state,
                url: issue.html_url,
                author: issue.user?.login,
                createdAt: issue.created_at,
            }
        }));

        return { success: true, data: items };
    }

    private async getRepos(token: string): Promise<IntegrationResult> {
        const response = await fetch('https://api.github.com/user/repos', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const items: DataItem[] = data.map((repo: any) => ({
            json: {
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                private: repo.private,
                description: repo.description,
            }
        }));

        return { success: true, data: items };
    }

    private async createComment(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const owner = config.owner as string;
        const repo = config.repo as string;
        const issueNumber = config.issueNumber as number;
        const results: DataItem[] = [];

        for (const item of input) {
            const body = this.resolveTemplate(config.commentBody as string, item.json);

            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json',
                    },
                    body: JSON.stringify({ body }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GitHub API error: ${error.message || 'Unknown error'}`);
            }

            const data = await response.json();
            results.push({
                json: {
                    id: data.id,
                    url: data.html_url,
                    body: data.body,
                }
            });
        }

        return { success: true, data: results };
    }

    private resolveTemplate(template: string, data: Record<string, unknown>): string {
        let result = template;
        Object.entries(data).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
        });
        return result;
    }
}

// ============================================================
// Google Sheets Integration
// ============================================================

export class GoogleSheetsIntegration extends BaseIntegrationHandler {
    constructor() {
        super('google-sheets');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const accessToken = this.credentials!.credentials.accessToken;

        try {
            switch (operation) {
                case 'read_rows':
                    return await this.readRows(accessToken, config);
                case 'append_row':
                    return await this.appendRow(accessToken, config, input);
                case 'update_row':
                    return await this.updateRow(accessToken, config, input);
                default:
                    throw new Error(`Unsupported Google Sheets operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private async readRows(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const spreadsheetId = config.spreadsheetId as string;
        const range = config.range as string || 'Sheet1!A:Z';

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Sheets API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const values = data.values || [];
        
        // First row is headers
        const headers = values[0] || [];
        const rows = values.slice(1);

        const items: DataItem[] = rows.map((row: string[], index: number) => {
            const json: Record<string, unknown> = { _rowIndex: index + 2 };
            headers.forEach((header: string, i: number) => {
                json[header] = row[i] || '';
            });
            return { json };
        });

        return { success: true, data: items };
    }

    private async appendRow(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const spreadsheetId = config.spreadsheetId as string;
        const range = config.range as string || 'Sheet1';

        const values = input.map(item => {
            const row: string[] = [];
            Object.entries(item.json).forEach(([_, value]) => {
                if (!_.startsWith('_')) {
                    row.push(String(value));
                }
            });
            return row;
        });

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Sheets API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return {
            success: true,
            data: [{
                json: {
                    updatedRange: data.updates?.updatedRange,
                    updatedRows: data.updates?.updatedRows,
                    updatedCells: data.updates?.updatedCells,
                }
            }]
        };
    }

    private async updateRow(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const spreadsheetId = config.spreadsheetId as string;
        const range = config.range as string;

        const values = input.map(item => {
            const row: string[] = [];
            Object.entries(item.json).forEach(([_, value]) => {
                if (!_.startsWith('_')) {
                    row.push(String(value));
                }
            });
            return row;
        });

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Sheets API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return {
            success: true,
            data: [{
                json: {
                    updatedRange: data.updatedRange,
                    updatedRows: data.updatedRows,
                    updatedCells: data.updatedCells,
                }
            }]
        };
    }
}

// ============================================================
// Notion Integration
// ============================================================

export class NotionIntegration extends BaseIntegrationHandler {
    private readonly BASE_URL = 'https://api.notion.com/v1';

    constructor() {
        super('notion');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const token = this.credentials!.credentials.accessToken || this.credentials!.credentials.apiKey;
        const startTime = Date.now();

        try {
            switch (operation) {
                case 'create_page':
                    return await this.createPage(token, config, input);
                case 'get_page':
                    return await this.getPage(token, config);
                case 'update_page':
                    return await this.updatePage(token, config, input);
                case 'query_database':
                    return await this.queryDatabase(token, config);
                case 'create_database':
                    return await this.createDatabase(token, config);
                default:
                    throw new Error(`Unsupported Notion operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: { executionTime: Date.now() - startTime }
            };
        }
    }

    private getHeaders(token: string) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
        };
    }

    private async createPage(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const results: DataItem[] = [];

        for (const item of input) {
            const title = this.resolveTemplate(config.title as string || '', item.json);
            const content = this.resolveTemplate(config.content as string || '', item.json);
            const parentId = config.parentPageId as string || config.databaseId as string;

            const body: any = {
                parent: config.databaseId
                    ? { database_id: config.databaseId as string }
                    : { page_id: parentId },
                properties: {
                    title: { title: [{ text: { content: title } }] }
                },
            };

            if (content) {
                body.children = [{
                    object: 'block',
                    type: 'paragraph',
                    paragraph: { rich_text: [{ type: 'text', text: { content } }] }
                }];
            }

            const response = await fetch(`${this.BASE_URL}/pages`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Notion API error: ${err.message || response.statusText}`);
            }

            const data = await response.json();
            results.push({
                json: { id: data.id, url: data.url, created_time: data.created_time }
            });
        }

        return { success: true, data: results };
    }

    private async getPage(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const pageId = config.pageId as string;
        const response = await fetch(`${this.BASE_URL}/pages/${pageId}`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Notion API error: ${err.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            data: [{
                json: {
                    id: data.id,
                    url: data.url,
                    properties: data.properties,
                    created_time: data.created_time,
                    last_edited_time: data.last_edited_time,
                }
            }]
        };
    }

    private async updatePage(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const pageId = config.pageId as string;
        const results: DataItem[] = [];

        for (const item of input) {
            const properties: any = {};
            if (config.title) {
                const title = this.resolveTemplate(config.title as string, item.json);
                properties.title = { title: [{ text: { content: title } }] };
            }

            const response = await fetch(`${this.BASE_URL}/pages/${pageId}`, {
                method: 'PATCH',
                headers: this.getHeaders(token),
                body: JSON.stringify({ properties }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Notion API error: ${err.message || response.statusText}`);
            }

            const data = await response.json();
            results.push({ json: { id: data.id, url: data.url, last_edited_time: data.last_edited_time } });
        }

        return { success: true, data: results };
    }

    private async queryDatabase(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const databaseId = config.databaseId as string;
        const filterJson = config.filter as string;

        const body: any = {};
        if (filterJson) {
            try { body.filter = JSON.parse(filterJson); } catch { /* ignore invalid filter */ }
        }
        if (config.pageSize) body.page_size = config.pageSize;

        const response = await fetch(`${this.BASE_URL}/databases/${databaseId}/query`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Notion API error: ${err.message || response.statusText}`);
        }

        const data = await response.json();
        const items: DataItem[] = (data.results || []).map((page: any) => ({
            json: { id: page.id, url: page.url, properties: page.properties, created_time: page.created_time }
        }));

        return { success: true, data: items };
    }

    private async createDatabase(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const parentPageId = config.parentPageId as string;
        const title = config.title as string || 'Untitled Database';

        const response = await fetch(`${this.BASE_URL}/databases`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({
                parent: { page_id: parentPageId },
                title: [{ text: { content: title } }],
                properties: {
                    Name: { title: {} },
                },
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Notion API error: ${err.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            data: [{ json: { id: data.id, url: data.url, title: data.title } }]
        };
    }

    private resolveTemplate(template: string, data: Record<string, unknown>): string {
        let result = template;
        Object.entries(data).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
        });
        return result;
    }
}

// ============================================================
// Google Calendar Integration
// ============================================================

export class GoogleCalendarIntegration extends BaseIntegrationHandler {
    private readonly BASE_URL = 'https://www.googleapis.com/calendar/v3';

    constructor() {
        super('google-calendar');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const token = this.credentials!.credentials.accessToken;
        const startTime = Date.now();

        try {
            switch (operation) {
                case 'create_event':
                    return await this.createEvent(token, config, input);
                case 'get_events':
                    return await this.getEvents(token, config);
                case 'update_event':
                    return await this.updateEvent(token, config, input);
                case 'delete_event':
                    return await this.deleteEvent(token, config);
                case 'get_calendars':
                    return await this.getCalendars(token);
                default:
                    throw new Error(`Unsupported Google Calendar operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: { executionTime: Date.now() - startTime }
            };
        }
    }

    private async createEvent(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const calendarId = (config.calendarId as string) || 'primary';
        const results: DataItem[] = [];

        for (const item of input) {
            const summary = this.resolveTemplate(config.eventTitle as string || '', item.json);
            const description = this.resolveTemplate(config.description as string || '', item.json);

            const event: any = {
                summary,
                description,
                start: { dateTime: config.startTime as string, timeZone: (config.timezone as string) || 'UTC' },
                end: { dateTime: config.endTime as string, timeZone: (config.timezone as string) || 'UTC' },
            };

            if (config.attendees) {
                event.attendees = (config.attendees as string).split(',').map((e: string) => ({ email: e.trim() }));
            }

            const response = await fetch(`${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Google Calendar API error: ${err.error?.message || response.statusText}`);
            }

            const data = await response.json();
            results.push({
                json: { id: data.id, summary: data.summary, htmlLink: data.htmlLink, status: data.status, start: data.start, end: data.end }
            });
        }

        return { success: true, data: results };
    }

    private async getEvents(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const calendarId = (config.calendarId as string) || 'primary';
        const maxResults = (config.maxResults as number) || 10;
        const timeMin = (config.timeMin as string) || new Date().toISOString();

        const url = `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?maxResults=${maxResults}&timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Google Calendar API error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const items: DataItem[] = (data.items || []).map((event: any) => ({
            json: { id: event.id, summary: event.summary, start: event.start, end: event.end, htmlLink: event.htmlLink, status: event.status }
        }));

        return { success: true, data: items };
    }

    private async updateEvent(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const calendarId = (config.calendarId as string) || 'primary';
        const eventId = config.eventId as string;
        const results: DataItem[] = [];

        for (const item of input) {
            const body: any = {};
            if (config.eventTitle) body.summary = this.resolveTemplate(config.eventTitle as string, item.json);
            if (config.startTime) body.start = { dateTime: config.startTime as string };
            if (config.endTime) body.end = { dateTime: config.endTime as string };

            const response = await fetch(`${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Google Calendar API error: ${err.error?.message || response.statusText}`);
            }

            const data = await response.json();
            results.push({ json: { id: data.id, summary: data.summary, htmlLink: data.htmlLink } });
        }

        return { success: true, data: results };
    }

    private async deleteEvent(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const calendarId = (config.calendarId as string) || 'primary';
        const eventId = config.eventId as string;

        const response = await fetch(`${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok && response.status !== 204) {
            const err = await response.json();
            throw new Error(`Google Calendar API error: ${err.error?.message || response.statusText}`);
        }

        return { success: true, data: [{ json: { deleted: true, eventId } }] };
    }

    private async getCalendars(token: string): Promise<IntegrationResult> {
        const response = await fetch(`${this.BASE_URL}/users/me/calendarList`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Google Calendar API error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const items: DataItem[] = (data.items || []).map((cal: any) => ({
            json: { id: cal.id, summary: cal.summary, primary: cal.primary, accessRole: cal.accessRole }
        }));

        return { success: true, data: items };
    }

    private resolveTemplate(template: string, data: Record<string, unknown>): string {
        let result = template;
        Object.entries(data).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
        });
        return result;
    }
}

// ============================================================
// Google Drive Integration
// ============================================================

export class GoogleDriveIntegration extends BaseIntegrationHandler {
    private readonly BASE_URL = 'https://www.googleapis.com/drive/v3';

    constructor() {
        super('google-drive');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const token = this.credentials!.credentials.accessToken;
        const startTime = Date.now();

        try {
            switch (operation) {
                case 'list_files':
                    return await this.listFiles(token, config);
                case 'create_folder':
                    return await this.createFolder(token, config);
                case 'share_file':
                    return await this.shareFile(token, config);
                case 'download_file':
                    return await this.downloadFile(token, config);
                case 'upload_file':
                case 'move_file':
                    throw new Error(`${operation} requires binary handling – not yet implemented`);
                default:
                    throw new Error(`Unsupported Google Drive operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: { executionTime: Date.now() - startTime }
            };
        }
    }

    private async listFiles(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const folderId = config.folderId as string;
        const pageSize = (config.pageSize as number) || 20;
        let query = '';
        if (folderId) query = `'${folderId}' in parents and trashed = false`;
        else query = 'trashed = false';

        const url = `${this.BASE_URL}/files?pageSize=${pageSize}&q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Google Drive API error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const items: DataItem[] = (data.files || []).map((file: any) => ({
            json: { id: file.id, name: file.name, mimeType: file.mimeType, size: file.size, modifiedTime: file.modifiedTime, webViewLink: file.webViewLink }
        }));

        return { success: true, data: items };
    }

    private async createFolder(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const folderName = config.folderName as string || config.fileName as string || 'New Folder';
        const parentId = config.folderId as string;

        const body: any = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };
        if (parentId) body.parents = [parentId];

        const response = await fetch(`${this.BASE_URL}/files`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Google Drive API error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data: [{ json: { id: data.id, name: data.name, mimeType: data.mimeType } }] };
    }

    private async shareFile(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const fileId = config.fileId as string;
        const email = config.email as string;
        const role = (config.role as string) || 'reader';

        const response = await fetch(`${this.BASE_URL}/files/${fileId}/permissions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'user', role, emailAddress: email }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Google Drive API error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data: [{ json: { permissionId: data.id, role: data.role } }] };
    }

    private async downloadFile(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const fileId = config.fileId as string;

        const response = await fetch(`${this.BASE_URL}/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`Google Drive download error: ${response.statusText}`);
        }

        const text = await response.text();
        return { success: true, data: [{ json: { fileId, content: text } }] };
    }
}

// ============================================================
// Discord Integration
// ============================================================

export class DiscordIntegration extends BaseIntegrationHandler {
    private readonly BASE_URL = 'https://discord.com/api/v10';

    constructor() {
        super('discord');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const token = this.credentials!.credentials.botToken || this.credentials!.credentials.accessToken;
        const startTime = Date.now();

        try {
            switch (operation) {
                case 'send_message':
                    return await this.sendMessage(token, config, input);
                case 'get_messages':
                    return await this.getMessages(token, config);
                case 'create_channel':
                    return await this.createChannel(token, config);
                case 'add_role':
                    return await this.addRole(token, config);
                case 'get_members':
                    return await this.getMembers(token, config);
                default:
                    throw new Error(`Unsupported Discord operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: { executionTime: Date.now() - startTime }
            };
        }
    }

    private getHeaders(token: string) {
        return {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json',
        };
    }

    private async sendMessage(token: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const channelId = config.channelId as string;
        const messageTemplate = config.message as string;
        const results: DataItem[] = [];

        for (const item of input) {
            let content = messageTemplate;
            Object.entries(item.json).forEach(([key, value]) => {
                content = content.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
            });

            const response = await fetch(`${this.BASE_URL}/channels/${channelId}/messages`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Discord API error: ${err.message || response.statusText}`);
            }

            const data = await response.json();
            results.push({
                json: { id: data.id, channel_id: data.channel_id, content: data.content, timestamp: data.timestamp }
            });
        }

        return { success: true, data: results };
    }

    private async getMessages(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const channelId = config.channelId as string;
        const limit = (config.limit as number) || 10;

        const response = await fetch(`${this.BASE_URL}/channels/${channelId}/messages?limit=${limit}`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Discord API error: ${err.message || response.statusText}`);
        }

        const data = await response.json();
        const items: DataItem[] = data.map((msg: any) => ({
            json: { id: msg.id, content: msg.content, author: msg.author?.username, timestamp: msg.timestamp }
        }));

        return { success: true, data: items };
    }

    private async createChannel(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const guildId = config.guildId as string;
        const name = config.channelName as string;
        const type = (config.channelType as number) || 0; // 0 = text

        const response = await fetch(`${this.BASE_URL}/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ name, type }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Discord API error: ${err.message || response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data: [{ json: { id: data.id, name: data.name, type: data.type } }] };
    }

    private async addRole(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const guildId = config.guildId as string;
        const userId = config.userId as string;
        const roleId = config.roleId as string;

        const response = await fetch(`${this.BASE_URL}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
        });

        if (!response.ok && response.status !== 204) {
            const err = await response.json();
            throw new Error(`Discord API error: ${err.message || response.statusText}`);
        }

        return { success: true, data: [{ json: { success: true, userId, roleId } }] };
    }

    private async getMembers(token: string, config: IntegrationConfig): Promise<IntegrationResult> {
        const guildId = config.guildId as string;
        const limit = (config.limit as number) || 10;

        const response = await fetch(`${this.BASE_URL}/guilds/${guildId}/members?limit=${limit}`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Discord API error: ${err.message || response.statusText}`);
        }

        const data = await response.json();
        const items: DataItem[] = data.map((member: any) => ({
            json: { userId: member.user?.id, username: member.user?.username, nick: member.nick, roles: member.roles, joined_at: member.joined_at }
        }));

        return { success: true, data: items };
    }
}

// ============================================================
// Jira Integration
// ============================================================

export class JiraIntegration extends BaseIntegrationHandler {
    constructor() {
        super('jira');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const startTime = Date.now();

        try {
            switch (operation) {
                case 'create_issue':
                    return await this.createIssue(config, input);
                case 'get_issues':
                    return await this.getIssues(config);
                case 'update_issue':
                    return await this.updateIssue(config, input);
                case 'transition_issue':
                    return await this.transitionIssue(config);
                case 'add_comment':
                    return await this.addComment(config, input);
                default:
                    throw new Error(`Unsupported Jira operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: { executionTime: Date.now() - startTime }
            };
        }
    }

    private getBaseUrl(): string {
        return `https://${this.credentials!.credentials.domain || this.credentials!.credentials.host}.atlassian.net/rest/api/3`;
    }

    private getHeaders(): Record<string, string> {
        const email = this.credentials!.credentials.email;
        const apiToken = this.credentials!.credentials.apiToken || this.credentials!.credentials.accessToken;
        const encoded = Buffer.from(`${email}:${apiToken}`).toString('base64');
        return {
            'Authorization': `Basic ${encoded}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    private async createIssue(config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const results: DataItem[] = [];

        for (const item of input) {
            const summary = this.resolveTemplate(config.summary as string || '', item.json);
            const description = this.resolveTemplate(config.description as string || '', item.json);

            const body = {
                fields: {
                    project: { key: config.projectKey as string },
                    summary,
                    description: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }] },
                    issuetype: { name: (config.issueType as string) || 'Task' },
                },
            };

            const response = await fetch(`${this.getBaseUrl()}/issue`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Jira API error: ${JSON.stringify(err.errors || err.errorMessages || err)}`);
            }

            const data = await response.json();
            results.push({ json: { id: data.id, key: data.key, self: data.self } });
        }

        return { success: true, data: results };
    }

    private async getIssues(config: IntegrationConfig): Promise<IntegrationResult> {
        const jql = (config.jql as string) || `project=${config.projectKey} ORDER BY created DESC`;
        const maxResults = (config.maxResults as number) || 10;

        const response = await fetch(`${this.getBaseUrl()}/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Jira API error: ${JSON.stringify(err.errorMessages || err)}`);
        }

        const data = await response.json();
        const items: DataItem[] = (data.issues || []).map((issue: any) => ({
            json: { id: issue.id, key: issue.key, summary: issue.fields?.summary, status: issue.fields?.status?.name, assignee: issue.fields?.assignee?.displayName, created: issue.fields?.created }
        }));

        return { success: true, data: items };
    }

    private async updateIssue(config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const issueKey = config.issueKey as string;
        const results: DataItem[] = [];

        for (const item of input) {
            const fields: any = {};
            if (config.summary) fields.summary = this.resolveTemplate(config.summary as string, item.json);

            const response = await fetch(`${this.getBaseUrl()}/issue/${issueKey}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ fields }),
            });

            if (!response.ok && response.status !== 204) {
                const err = await response.json();
                throw new Error(`Jira API error: ${JSON.stringify(err.errors || err.errorMessages || err)}`);
            }

            results.push({ json: { updated: true, issueKey } });
        }

        return { success: true, data: results };
    }

    private async transitionIssue(config: IntegrationConfig): Promise<IntegrationResult> {
        const issueKey = config.issueKey as string;
        const transitionId = config.transitionId as string;

        const response = await fetch(`${this.getBaseUrl()}/issue/${issueKey}/transitions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ transition: { id: transitionId } }),
        });

        if (!response.ok && response.status !== 204) {
            const err = await response.json();
            throw new Error(`Jira API error: ${JSON.stringify(err.errorMessages || err)}`);
        }

        return { success: true, data: [{ json: { transitioned: true, issueKey, transitionId } }] };
    }

    private async addComment(config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const issueKey = config.issueKey as string;
        const results: DataItem[] = [];

        for (const item of input) {
            const comment = this.resolveTemplate(config.commentBody as string || '', item.json);

            const response = await fetch(`${this.getBaseUrl()}/issue/${issueKey}/comment`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }] }
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Jira API error: ${JSON.stringify(err.errorMessages || err)}`);
            }

            const data = await response.json();
            results.push({ json: { id: data.id, body: comment, created: data.created } });
        }

        return { success: true, data: results };
    }

    private resolveTemplate(template: string, data: Record<string, unknown>): string {
        let result = template;
        Object.entries(data).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
        });
        return result;
    }
}

// ============================================================
// Trello Integration
// ============================================================

export class TrelloIntegration extends BaseIntegrationHandler {
    private readonly BASE_URL = 'https://api.trello.com/1';

    constructor() {
        super('trello');
    }

    async execute(operation: string, config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        this.ensureCredentials();
        const startTime = Date.now();

        try {
            switch (operation) {
                case 'create_card':
                    return await this.createCard(config, input);
                case 'get_cards':
                    return await this.getCards(config);
                case 'update_card':
                    return await this.updateCard(config, input);
                case 'move_card':
                    return await this.moveCard(config);
                case 'get_boards':
                    return await this.getBoards();
                default:
                    throw new Error(`Unsupported Trello operation: ${operation}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: { executionTime: Date.now() - startTime }
            };
        }
    }

    private getAuthParams(): string {
        const key = this.credentials!.credentials.apiKey;
        const token = this.credentials!.credentials.apiToken || this.credentials!.credentials.accessToken;
        return `key=${key}&token=${token}`;
    }

    private async createCard(config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const listId = config.listId as string;
        const results: DataItem[] = [];

        for (const item of input) {
            const name = this.resolveTemplate(config.cardName as string || '', item.json);
            const desc = this.resolveTemplate(config.description as string || '', item.json);

            const response = await fetch(`${this.BASE_URL}/cards?${this.getAuthParams()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, desc, idList: listId }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Trello API error: ${err}`);
            }

            const data = await response.json();
            results.push({ json: { id: data.id, name: data.name, url: data.url, shortUrl: data.shortUrl } });
        }

        return { success: true, data: results };
    }

    private async getCards(config: IntegrationConfig): Promise<IntegrationResult> {
        const listId = config.listId as string;
        const boardId = config.boardId as string;

        const endpoint = listId
            ? `${this.BASE_URL}/lists/${listId}/cards?${this.getAuthParams()}`
            : `${this.BASE_URL}/boards/${boardId}/cards?${this.getAuthParams()}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Trello API error: ${err}`);
        }

        const data = await response.json();
        const items: DataItem[] = data.map((card: any) => ({
            json: { id: card.id, name: card.name, desc: card.desc, url: card.url, idList: card.idList, due: card.due }
        }));

        return { success: true, data: items };
    }

    private async updateCard(config: IntegrationConfig, input: DataItem[]): Promise<IntegrationResult> {
        const cardId = config.cardId as string;
        const results: DataItem[] = [];

        for (const item of input) {
            const body: any = {};
            if (config.cardName) body.name = this.resolveTemplate(config.cardName as string, item.json);
            if (config.description) body.desc = this.resolveTemplate(config.description as string, item.json);

            const response = await fetch(`${this.BASE_URL}/cards/${cardId}?${this.getAuthParams()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Trello API error: ${err}`);
            }

            const data = await response.json();
            results.push({ json: { id: data.id, name: data.name, url: data.url } });
        }

        return { success: true, data: results };
    }

    private async moveCard(config: IntegrationConfig): Promise<IntegrationResult> {
        const cardId = config.cardId as string;
        const targetListId = config.targetListId as string;

        const response = await fetch(`${this.BASE_URL}/cards/${cardId}?${this.getAuthParams()}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idList: targetListId }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Trello API error: ${err}`);
        }

        const data = await response.json();
        return { success: true, data: [{ json: { id: data.id, name: data.name, idList: data.idList } }] };
    }

    private async getBoards(): Promise<IntegrationResult> {
        const response = await fetch(`${this.BASE_URL}/members/me/boards?${this.getAuthParams()}`);

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Trello API error: ${err}`);
        }

        const data = await response.json();
        const items: DataItem[] = data.map((board: any) => ({
            json: { id: board.id, name: board.name, url: board.url, desc: board.desc }
        }));

        return { success: true, data: items };
    }

    private resolveTemplate(template: string, data: Record<string, unknown>): string {
        let result = template;
        Object.entries(data).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
        });
        return result;
    }
}

// ============================================================
// Integration Factory
// ============================================================

const integrationHandlers: Map<string, BaseIntegrationHandler> = new Map();

export function getIntegrationHandler(providerId: string): BaseIntegrationHandler {
    if (!integrationHandlers.has(providerId)) {
        switch (providerId) {
            case 'slack':
                integrationHandlers.set(providerId, new SlackIntegration());
                break;
            case 'gmail':
                integrationHandlers.set(providerId, new GmailIntegration());
                break;
            case 'github':
                integrationHandlers.set(providerId, new GitHubIntegration());
                break;
            case 'google-sheets':
                integrationHandlers.set(providerId, new GoogleSheetsIntegration());
                break;
            case 'notion':
                integrationHandlers.set(providerId, new NotionIntegration());
                break;
            case 'google-calendar':
                integrationHandlers.set(providerId, new GoogleCalendarIntegration());
                break;
            case 'google-drive':
                integrationHandlers.set(providerId, new GoogleDriveIntegration());
                break;
            case 'discord':
                integrationHandlers.set(providerId, new DiscordIntegration());
                break;
            case 'jira':
                integrationHandlers.set(providerId, new JiraIntegration());
                break;
            case 'trello':
                integrationHandlers.set(providerId, new TrelloIntegration());
                break;
            default:
                throw new Error(`Unknown integration provider: ${providerId}`);
        }
    }
    return integrationHandlers.get(providerId)!;
}

export async function executeIntegration(
    providerId: string,
    operation: string,
    config: IntegrationConfig,
    credentials: IntegrationCredentials,
    input: DataItem[]
): Promise<IntegrationResult> {
    const handler = getIntegrationHandler(providerId);
    await handler.setCredentials(credentials);
    return handler.execute(operation, config, input);
}
