/**
 * App Integration Nodes
 * 
 * Pre-configured nodes for connecting to popular apps and services.
 * Each node uses saved connections from the Connections page.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import {
    MessageSquare,
    Mail,
    FileSpreadsheet,
    GitBranch,
    FileText,
    Calendar,
    FolderOpen,
    Trello,
    CheckSquare,
} from 'lucide-react';

// Base interface for all integration node data
export interface IntegrationNodeData {
    label: string;
    connectionId?: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    lastRun?: string;
    outputCount?: number;
    [key: string]: unknown;
}

// ============================================
// SLACK NODE
// ============================================

export interface SlackNodeData extends IntegrationNodeData {
    operation: 'send_message' | 'get_messages' | 'create_channel' | 'upload_file' | 'react';
    channel?: string;
    message?: string;
    username?: string;
}

function SlackNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as SlackNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'send_message';

    const operationLabels: Record<string, string> = {
        send_message: 'Send Message',
        get_messages: 'Get Messages',
        create_channel: 'Create Channel',
        upload_file: 'Upload File',
        react: 'Add Reaction',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#4A154B] shadow-[0_0_20px_rgba(74,21,75,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#4A154B]/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#4A154B] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#4A154B]/20 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#4A154B]">
                    <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Slack'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-purple-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.channel && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <span className="text-[hsl(220_7%_45%)]">#</span>
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.channel}</span>
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
                {status === 'success' && nodeData.outputCount !== undefined && (
                    <div className="text-[10px] text-emerald-400">
                        ✓ {nodeData.outputCount} item(s) processed
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#4A154B] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const SlackNode = memo(SlackNodeComponent);

// ============================================
// GMAIL NODE
// ============================================

export interface GmailNodeData extends IntegrationNodeData {
    operation: 'send_email' | 'get_emails' | 'get_email' | 'reply' | 'create_draft';
    to?: string;
    subject?: string;
    query?: string;
}

function GmailNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as GmailNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'send_email';

    const operationLabels: Record<string, string> = {
        send_email: 'Send Email',
        get_emails: 'Get Emails',
        get_email: 'Get Email',
        reply: 'Reply to Email',
        create_draft: 'Create Draft',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#EA4335] shadow-[0_0_20px_rgba(234,67,53,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#EA4335]/50'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#EA4335] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#EA4335]/10 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#EA4335]">
                    <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Gmail'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-red-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {operation === 'send_email' && nodeData.to && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <span className="text-[hsl(220_7%_45%)]">To:</span>
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.to}</span>
                    </div>
                )}
                {operation === 'get_emails' && nodeData.query && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <span className="text-[hsl(220_7%_45%)]">Query:</span>
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.query}</span>
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#EA4335] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const GmailNode = memo(GmailNodeComponent);

// ============================================
// GOOGLE SHEETS NODE
// ============================================

export interface GoogleSheetsNodeData extends IntegrationNodeData {
    operation: 'read_rows' | 'append_row' | 'update_row' | 'delete_row' | 'create_sheet';
    spreadsheetId?: string;
    sheetName?: string;
    range?: string;
}

function GoogleSheetsNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as GoogleSheetsNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'read_rows';

    const operationLabels: Record<string, string> = {
        read_rows: 'Read Rows',
        append_row: 'Append Row',
        update_row: 'Update Row',
        delete_row: 'Delete Row',
        create_sheet: 'Create Sheet',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#0F9D58] shadow-[0_0_20px_rgba(15,157,88,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#0F9D58]/50'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#0F9D58] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#0F9D58]/10 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#0F9D58]">
                    <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Google Sheets'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-green-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.sheetName && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <FileSpreadsheet className="w-3 h-3 text-[hsl(220_7%_45%)]" />
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.sheetName}</span>
                    </div>
                )}
                {nodeData.range && (
                    <div className="text-[10px] text-[hsl(220_9%_63%)]">
                        Range: {nodeData.range}
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#0F9D58] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const GoogleSheetsNode = memo(GoogleSheetsNodeComponent);

// ============================================
// GITHUB NODE
// ============================================

export interface GitHubNodeData extends IntegrationNodeData {
    operation: 'create_issue' | 'get_issues' | 'create_pr' | 'get_repos' | 'create_comment' | 'get_commits';
    owner?: string;
    repo?: string;
    title?: string;
}

function GitHubNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as GitHubNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'get_issues';

    const operationLabels: Record<string, string> = {
        create_issue: 'Create Issue',
        get_issues: 'Get Issues',
        create_pr: 'Create Pull Request',
        get_repos: 'Get Repositories',
        create_comment: 'Create Comment',
        get_commits: 'Get Commits',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#181717] shadow-[0_0_20px_rgba(100,100,100,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#6e7681]'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#6e7681] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#24292e]/50 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#24292e]">
                    <GitBranch className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'GitHub'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-slate-400 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.owner && nodeData.repo && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded font-mono">
                        <span className="text-[hsl(220_13%_91%)] truncate">
                            {nodeData.owner}/{nodeData.repo}
                        </span>
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#6e7681] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const GitHubNode = memo(GitHubNodeComponent);

// ============================================
// NOTION NODE
// ============================================

export interface NotionNodeData extends IntegrationNodeData {
    operation: 'create_page' | 'get_page' | 'update_page' | 'query_database' | 'create_database';
    databaseId?: string;
    pageId?: string;
    title?: string;
}

function NotionNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as NotionNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'create_page';

    const operationLabels: Record<string, string> = {
        create_page: 'Create Page',
        get_page: 'Get Page',
        update_page: 'Update Page',
        query_database: 'Query Database',
        create_database: 'Create Database',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#000000] shadow-[0_0_20px_rgba(0,0,0,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#505050]'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#505050] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#191919]/50 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#191919]">
                    <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Notion'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-slate-300 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.title && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <FileText className="w-3 h-3 text-[hsl(220_7%_45%)]" />
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.title}</span>
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#505050] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const NotionNode = memo(NotionNodeComponent);

// ============================================
// GOOGLE CALENDAR NODE
// ============================================

export interface GoogleCalendarNodeData extends IntegrationNodeData {
    operation: 'create_event' | 'get_events' | 'update_event' | 'delete_event' | 'get_calendars';
    calendarId?: string;
    eventTitle?: string;
    startTime?: string;
    endTime?: string;
}

function GoogleCalendarNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as GoogleCalendarNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'get_events';

    const operationLabels: Record<string, string> = {
        create_event: 'Create Event',
        get_events: 'Get Events',
        update_event: 'Update Event',
        delete_event: 'Delete Event',
        get_calendars: 'Get Calendars',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#4285F4] shadow-[0_0_20px_rgba(66,133,244,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#4285F4]/50'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#4285F4] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#4285F4]/10 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#4285F4]">
                    <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Google Calendar'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-blue-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.eventTitle && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <Calendar className="w-3 h-3 text-[hsl(220_7%_45%)]" />
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.eventTitle}</span>
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#4285F4] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const GoogleCalendarNode = memo(GoogleCalendarNodeComponent);

// ============================================
// GOOGLE DRIVE NODE
// ============================================

export interface GoogleDriveNodeData extends IntegrationNodeData {
    operation: 'upload_file' | 'download_file' | 'list_files' | 'create_folder' | 'move_file' | 'share_file';
    folderId?: string;
    fileName?: string;
}

function GoogleDriveNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as GoogleDriveNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'list_files';

    const operationLabels: Record<string, string> = {
        upload_file: 'Upload File',
        download_file: 'Download File',
        list_files: 'List Files',
        create_folder: 'Create Folder',
        move_file: 'Move File',
        share_file: 'Share File',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#FBBC04] shadow-[0_0_20px_rgba(251,188,4,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#FBBC04]/50'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#FBBC04] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#FBBC04]/10 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#FBBC04]">
                    <FolderOpen className="w-4 h-4 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Google Drive'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-amber-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.fileName && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <FolderOpen className="w-3 h-3 text-[hsl(220_7%_45%)]" />
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.fileName}</span>
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#FBBC04] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const GoogleDriveNode = memo(GoogleDriveNodeComponent);

// ============================================
// DISCORD NODE
// ============================================

export interface DiscordNodeData extends IntegrationNodeData {
    operation: 'send_message' | 'get_messages' | 'create_channel' | 'add_role' | 'get_members';
    channelId?: string;
    guildId?: string;
    message?: string;
}

function DiscordNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as DiscordNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'send_message';

    const operationLabels: Record<string, string> = {
        send_message: 'Send Message',
        get_messages: 'Get Messages',
        create_channel: 'Create Channel',
        add_role: 'Add Role',
        get_members: 'Get Members',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#5865F2] shadow-[0_0_20px_rgba(88,101,242,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#5865F2]/50'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#5865F2] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#5865F2]/10 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#5865F2]">
                    <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Discord'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-indigo-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.channelId && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <span className="text-[hsl(220_7%_45%)]">#</span>
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.channelId}</span>
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#5865F2] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const DiscordNode = memo(DiscordNodeComponent);

// ============================================
// JIRA NODE
// ============================================

export interface JiraNodeData extends IntegrationNodeData {
    operation: 'create_issue' | 'get_issues' | 'update_issue' | 'transition_issue' | 'add_comment';
    projectKey?: string;
    issueType?: string;
    summary?: string;
}

function JiraNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as JiraNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'create_issue';

    const operationLabels: Record<string, string> = {
        create_issue: 'Create Issue',
        get_issues: 'Get Issues',
        update_issue: 'Update Issue',
        transition_issue: 'Transition Issue',
        add_comment: 'Add Comment',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#0052CC] shadow-[0_0_20px_rgba(0,82,204,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#0052CC]/50'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#0052CC] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#0052CC]/10 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#0052CC]">
                    <CheckSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Jira'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-blue-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.projectKey && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded font-mono">
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.projectKey}</span>
                    </div>
                )}
                {nodeData.summary && (
                    <div className="text-[10px] text-[hsl(220_9%_63%)] truncate">
                        {nodeData.summary}
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#0052CC] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const JiraNode = memo(JiraNodeComponent);

// ============================================
// TRELLO NODE
// ============================================

export interface TrelloNodeData extends IntegrationNodeData {
    operation: 'create_card' | 'get_cards' | 'update_card' | 'move_card' | 'get_boards';
    boardId?: string;
    listId?: string;
    cardName?: string;
}

function TrelloNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as TrelloNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'create_card';

    const operationLabels: Record<string, string> = {
        create_card: 'Create Card',
        get_cards: 'Get Cards',
        update_card: 'Update Card',
        move_card: 'Move Card',
        get_boards: 'Get Boards',
    };

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-[#0079BF] shadow-[0_0_20px_rgba(0,121,191,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-[#0079BF]/50'
            )}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#0079BF] hover:!scale-125 transition-transform"
            />

            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[#0079BF]/10 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-[#0079BF]">
                    <Trello className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Trello'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {operationLabels[operation]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-blue-400 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            <div className="p-3 space-y-2">
                {nodeData.cardName && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] p-2 rounded">
                        <Trello className="w-3 h-3 text-[hsl(220_7%_45%)]" />
                        <span className="text-[hsl(220_13%_91%)] truncate">{nodeData.cardName}</span>
                    </div>
                )}
                {!nodeData.connectionId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                        ⚠ No connection configured
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-[#0079BF] hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export const TrelloNode = memo(TrelloNodeComponent);

// Export all node types mapping
export const APP_INTEGRATION_NODE_TYPES = {
    // Generic app nodes (for sidebar)
    'slack-app': SlackNode,
    'gmail-app': GmailNode,
    'google-sheets-app': GoogleSheetsNode,
    'github-app': GitHubNode,
    'notion-app': NotionNode,
    'google-calendar-app': GoogleCalendarNode,
    'google-drive-app': GoogleDriveNode,
    'discord-app': DiscordNode,
    'jira-app': JiraNode,
    'trello-app': TrelloNode,
    
    // Specific operation nodes (for execution)
    // Slack
    'slack-send-message': SlackNode,
    'slack-get-messages': SlackNode,
    'slack-create-channel': SlackNode,
    'slack-upload-file': SlackNode,
    // Gmail
    'gmail-send-email': GmailNode,
    'gmail-get-emails': GmailNode,
    'gmail-get-email': GmailNode,
    'gmail-reply': GmailNode,
    'gmail-create-draft': GmailNode,
    // GitHub
    'github-create-issue': GitHubNode,
    'github-get-issues': GitHubNode,
    'github-create-comment': GitHubNode,
    'github-get-repos': GitHubNode,
    'github-create-pr': GitHubNode,
    'github-get-commits': GitHubNode,
    // Google Sheets
    'google-sheets-read-rows': GoogleSheetsNode,
    'google-sheets-append-row': GoogleSheetsNode,
    'google-sheets-update-row': GoogleSheetsNode,
    'google-sheets-delete-row': GoogleSheetsNode,
    'google-sheets-create-sheet': GoogleSheetsNode,
    // Notion
    'notion-create-page': NotionNode,
    'notion-get-page': NotionNode,
    'notion-update-page': NotionNode,
    'notion-query-database': NotionNode,
    'notion-create-database': NotionNode,
    // Google Calendar
    'google-calendar-create-event': GoogleCalendarNode,
    'google-calendar-get-events': GoogleCalendarNode,
    'google-calendar-update-event': GoogleCalendarNode,
    'google-calendar-delete-event': GoogleCalendarNode,
    'google-calendar-get-calendars': GoogleCalendarNode,
    // Google Drive
    'google-drive-upload-file': GoogleDriveNode,
    'google-drive-download-file': GoogleDriveNode,
    'google-drive-list-files': GoogleDriveNode,
    'google-drive-create-folder': GoogleDriveNode,
    'google-drive-move-file': GoogleDriveNode,
    'google-drive-share-file': GoogleDriveNode,
    // Discord
    'discord-send-message': DiscordNode,
    'discord-get-messages': DiscordNode,
    'discord-create-channel': DiscordNode,
    'discord-add-role': DiscordNode,
    'discord-get-members': DiscordNode,
    // Jira
    'jira-create-issue': JiraNode,
    'jira-get-issues': JiraNode,
    'jira-update-issue': JiraNode,
    'jira-transition-issue': JiraNode,
    'jira-add-comment': JiraNode,
    // Trello
    'trello-create-card': TrelloNode,
    'trello-get-cards': TrelloNode,
    'trello-update-card': TrelloNode,
    'trello-move-card': TrelloNode,
    'trello-get-boards': TrelloNode,
};


