/**
 * Integration Properties Panel
 * 
 * Configuration panel for app integration nodes.
 * Allows selecting connections and configuring operation-specific settings.
 */

import { useCallback } from 'react';
import { type Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    X,
    Link2,
    Settings,
    Trash2,
    Copy,
    Play,
    MessageSquare,
    Mail,
    FileSpreadsheet,
    GitBranch,
    FileText,
    Calendar,
    FolderOpen,
    ExternalLink,
} from 'lucide-react';
import { ConnectionSelector } from './ConnectionSelector';

// Define operations for each integration type
const INTEGRATION_OPERATIONS: Record<string, { value: string; label: string; description: string }[]> = {
    'slack-app': [
        { value: 'send_message', label: 'Send Message', description: 'Send a message to a channel' },
        { value: 'get_messages', label: 'Get Messages', description: 'Retrieve messages from a channel' },
        { value: 'create_channel', label: 'Create Channel', description: 'Create a new Slack channel' },
        { value: 'upload_file', label: 'Upload File', description: 'Upload a file to Slack' },
        { value: 'react', label: 'Add Reaction', description: 'Add emoji reaction to a message' },
    ],
    'gmail-app': [
        { value: 'send_email', label: 'Send Email', description: 'Compose and send an email' },
        { value: 'get_emails', label: 'Get Emails', description: 'Retrieve emails matching query' },
        { value: 'get_email', label: 'Get Email', description: 'Get a specific email by ID' },
        { value: 'reply', label: 'Reply to Email', description: 'Reply to an existing email' },
        { value: 'create_draft', label: 'Create Draft', description: 'Save email as draft' },
    ],
    'google-sheets-app': [
        { value: 'read_rows', label: 'Read Rows', description: 'Read data from spreadsheet' },
        { value: 'append_row', label: 'Append Row', description: 'Add a new row of data' },
        { value: 'update_row', label: 'Update Row', description: 'Modify existing row' },
        { value: 'delete_row', label: 'Delete Row', description: 'Remove a row' },
        { value: 'create_sheet', label: 'Create Sheet', description: 'Create new sheet/tab' },
    ],
    'github-app': [
        { value: 'create_issue', label: 'Create Issue', description: 'Open a new issue' },
        { value: 'get_issues', label: 'Get Issues', description: 'List repository issues' },
        { value: 'create_pr', label: 'Create Pull Request', description: 'Open a new PR' },
        { value: 'get_repos', label: 'Get Repositories', description: 'List user/org repos' },
        { value: 'create_comment', label: 'Create Comment', description: 'Add comment to issue/PR' },
        { value: 'get_commits', label: 'Get Commits', description: 'List repository commits' },
    ],
    'notion-app': [
        { value: 'create_page', label: 'Create Page', description: 'Create a new Notion page' },
        { value: 'get_page', label: 'Get Page', description: 'Retrieve page content' },
        { value: 'update_page', label: 'Update Page', description: 'Modify existing page' },
        { value: 'query_database', label: 'Query Database', description: 'Query a Notion database' },
        { value: 'create_database', label: 'Create Database', description: 'Create new database' },
    ],
    'google-calendar-app': [
        { value: 'create_event', label: 'Create Event', description: 'Schedule a new event' },
        { value: 'get_events', label: 'Get Events', description: 'List calendar events' },
        { value: 'update_event', label: 'Update Event', description: 'Modify existing event' },
        { value: 'delete_event', label: 'Delete Event', description: 'Remove an event' },
        { value: 'get_calendars', label: 'Get Calendars', description: 'List available calendars' },
    ],
    'google-drive-app': [
        { value: 'upload_file', label: 'Upload File', description: 'Upload a file to Drive' },
        { value: 'download_file', label: 'Download File', description: 'Download a file' },
        { value: 'list_files', label: 'List Files', description: 'List files in folder' },
        { value: 'create_folder', label: 'Create Folder', description: 'Create new folder' },
        { value: 'move_file', label: 'Move File', description: 'Move file to folder' },
        { value: 'share_file', label: 'Share File', description: 'Share file with others' },
    ],
    'discord-app': [
        { value: 'send_message', label: 'Send Message', description: 'Send message to channel' },
        { value: 'get_messages', label: 'Get Messages', description: 'Retrieve channel messages' },
        { value: 'create_channel', label: 'Create Channel', description: 'Create new channel' },
        { value: 'add_role', label: 'Add Role', description: 'Assign role to user' },
        { value: 'get_members', label: 'Get Members', description: 'List server members' },
    ],
    'jira-app': [
        { value: 'create_issue', label: 'Create Issue', description: 'Create new Jira issue' },
        { value: 'get_issues', label: 'Get Issues', description: 'Search for issues' },
        { value: 'update_issue', label: 'Update Issue', description: 'Modify existing issue' },
        { value: 'transition_issue', label: 'Transition Issue', description: 'Change issue status' },
        { value: 'add_comment', label: 'Add Comment', description: 'Add comment to issue' },
    ],
    'trello-app': [
        { value: 'create_card', label: 'Create Card', description: 'Create new Trello card' },
        { value: 'get_cards', label: 'Get Cards', description: 'List cards in list/board' },
        { value: 'update_card', label: 'Update Card', description: 'Modify card details' },
        { value: 'move_card', label: 'Move Card', description: 'Move card between lists' },
        { value: 'get_boards', label: 'Get Boards', description: 'List user boards' },
    ],
};

// Provider ID mapping for connection selector
const PROVIDER_ID_MAP: Record<string, string> = {
    'slack-app': 'slack',
    'gmail-app': 'gmail',
    'google-sheets-app': 'google-sheets',
    'github-app': 'github',
    'notion-app': 'notion',
    'google-calendar-app': 'google-calendar',
    'google-drive-app': 'google-drive',
    'discord-app': 'discord',
    'jira-app': 'jira',
    'trello-app': 'trello',
};

// Integration icons
const INTEGRATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'slack-app': MessageSquare,
    'gmail-app': Mail,
    'google-sheets-app': FileSpreadsheet,
    'github-app': GitBranch,
    'notion-app': FileText,
    'google-calendar-app': Calendar,
    'google-drive-app': FolderOpen,
    'discord-app': MessageSquare,
    'jira-app': FileText,
    'trello-app': FileText,
};

// Integration colors
const INTEGRATION_COLORS: Record<string, string> = {
    'slack-app': '#4A154B',
    'gmail-app': '#EA4335',
    'google-sheets-app': '#0F9D58',
    'github-app': '#24292e',
    'notion-app': '#191919',
    'google-calendar-app': '#4285F4',
    'google-drive-app': '#FBBC04',
    'discord-app': '#5865F2',
    'jira-app': '#0052CC',
    'trello-app': '#0079BF',
};

interface IntegrationNodeData {
    label: string;
    operation?: string;
    connectionId?: string;
    [key: string]: unknown;
}

interface IntegrationPropertiesPanelProps {
    selectedNode: Node<IntegrationNodeData> | null;
    onClose: () => void;
    onUpdateNode: (nodeId: string, data: Partial<IntegrationNodeData>) => void;
    onDeleteNode: (nodeId: string) => void;
    onDuplicateNode: (nodeId: string) => void;
    onTestNode?: (nodeId: string) => void;
}

export default function IntegrationPropertiesPanel({
    selectedNode,
    onClose,
    onUpdateNode,
    onDeleteNode,
    onDuplicateNode,
    onTestNode,
}: IntegrationPropertiesPanelProps) {
    if (!selectedNode) {
        return (
            <div className="w-80 border-l border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <Settings className="w-12 h-12 mx-auto mb-4 text-[hsl(220_7%_45%)]" />
                        <p className="text-sm text-[hsl(220_9%_63%)]">
                            Select an integration node to configure
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const nodeType = selectedNode.type || '';
    const isIntegrationNode = nodeType.endsWith('-app');
    
    if (!isIntegrationNode) {
        return null; // Fall back to default properties panel
    }

    const providerId = PROVIDER_ID_MAP[nodeType] || '';
    const operations = INTEGRATION_OPERATIONS[nodeType] || [];
    const Icon = INTEGRATION_ICONS[nodeType] || Link2;
    const color = INTEGRATION_COLORS[nodeType] || '#6366f1';
    const data = selectedNode.data;

    const handleLabelChange = useCallback((label: string) => {
        onUpdateNode(selectedNode.id, { label });
    }, [selectedNode, onUpdateNode]);

    const handleOperationChange = useCallback((operation: string) => {
        onUpdateNode(selectedNode.id, { operation });
    }, [selectedNode, onUpdateNode]);

    const handleConnectionChange = useCallback((connectionId: string | undefined) => {
        onUpdateNode(selectedNode.id, { connectionId });
    }, [selectedNode, onUpdateNode]);

    const handleFieldChange = useCallback((field: string, value: string) => {
        onUpdateNode(selectedNode.id, { [field]: value });
    }, [selectedNode, onUpdateNode]);

    // Get operation-specific fields
    const getOperationFields = () => {
        const operation = data.operation || operations[0]?.value;
        
        switch (nodeType) {
            case 'slack-app':
                if (operation === 'send_message') {
                    return (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Channel</Label>
                                <Input
                                    value={(data.channel as string) || ''}
                                    onChange={(e) => handleFieldChange('channel', e.target.value)}
                                    placeholder="#general or channel ID"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Message</Label>
                                <Textarea
                                    value={(data.message as string) || ''}
                                    onChange={(e) => handleFieldChange('message', e.target.value)}
                                    placeholder="Hello from AgentFlow! Use {{data.field}} for dynamic content"
                                    className="min-h-[80px] bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                        </>
                    );
                }
                break;
            
            case 'gmail-app':
                if (operation === 'send_email') {
                    return (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">To</Label>
                                <Input
                                    value={(data.to as string) || ''}
                                    onChange={(e) => handleFieldChange('to', e.target.value)}
                                    placeholder="recipient@example.com"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Subject</Label>
                                <Input
                                    value={(data.subject as string) || ''}
                                    onChange={(e) => handleFieldChange('subject', e.target.value)}
                                    placeholder="Email subject"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Body</Label>
                                <Textarea
                                    value={(data.body as string) || ''}
                                    onChange={(e) => handleFieldChange('body', e.target.value)}
                                    placeholder="Email body content..."
                                    className="min-h-[100px] bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                        </>
                    );
                }
                if (operation === 'get_emails') {
                    return (
                        <div className="space-y-2">
                            <Label className="text-xs text-[hsl(220_9%_63%)]">Search Query</Label>
                            <Input
                                value={(data.query as string) || ''}
                                onChange={(e) => handleFieldChange('query', e.target.value)}
                                placeholder="is:unread from:example.com"
                                className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                            />
                            <p className="text-[10px] text-[hsl(220_7%_45%)]">
                                Use Gmail search syntax
                            </p>
                        </div>
                    );
                }
                break;

            case 'google-sheets-app':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs text-[hsl(220_9%_63%)]">Spreadsheet ID</Label>
                            <Input
                                value={(data.spreadsheetId as string) || ''}
                                onChange={(e) => handleFieldChange('spreadsheetId', e.target.value)}
                                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                                className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-[hsl(220_9%_63%)]">Sheet Name</Label>
                            <Input
                                value={(data.sheetName as string) || ''}
                                onChange={(e) => handleFieldChange('sheetName', e.target.value)}
                                placeholder="Sheet1"
                                className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-[hsl(220_9%_63%)]">Range</Label>
                            <Input
                                value={(data.range as string) || ''}
                                onChange={(e) => handleFieldChange('range', e.target.value)}
                                placeholder="A1:D10"
                                className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                            />
                        </div>
                    </>
                );

            case 'github-app':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs text-[hsl(220_9%_63%)]">Owner</Label>
                            <Input
                                value={(data.owner as string) || ''}
                                onChange={(e) => handleFieldChange('owner', e.target.value)}
                                placeholder="octocat"
                                className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-[hsl(220_9%_63%)]">Repository</Label>
                            <Input
                                value={(data.repo as string) || ''}
                                onChange={(e) => handleFieldChange('repo', e.target.value)}
                                placeholder="hello-world"
                                className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                            />
                        </div>
                        {(operation === 'create_issue' || operation === 'create_pr') && (
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Title</Label>
                                <Input
                                    value={(data.title as string) || ''}
                                    onChange={(e) => handleFieldChange('title', e.target.value)}
                                    placeholder="Issue/PR title"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                        )}
                    </>
                );

            case 'notion-app':
                if (operation === 'query_database') {
                    return (
                        <div className="space-y-2">
                            <Label className="text-xs text-[hsl(220_9%_63%)]">Database ID</Label>
                            <Input
                                value={(data.databaseId as string) || ''}
                                onChange={(e) => handleFieldChange('databaseId', e.target.value)}
                                placeholder="abc123..."
                                className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                            />
                        </div>
                    );
                }
                return (
                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)]">Page Title</Label>
                        <Input
                            value={(data.title as string) || ''}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            placeholder="New Page Title"
                            className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                        />
                    </div>
                );

            case 'google-calendar-app':
                if (operation === 'create_event' || operation === 'update_event') {
                    return (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Event Title</Label>
                                <Input
                                    value={(data.eventTitle as string) || ''}
                                    onChange={(e) => handleFieldChange('eventTitle', e.target.value)}
                                    placeholder="Team Meeting"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Start Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={(data.startTime as string) || ''}
                                    onChange={(e) => handleFieldChange('startTime', e.target.value)}
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">End Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={(data.endTime as string) || ''}
                                    onChange={(e) => handleFieldChange('endTime', e.target.value)}
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                        </>
                    );
                }
                break;

            case 'discord-app':
                if (operation === 'send_message') {
                    return (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Channel ID</Label>
                                <Input
                                    value={(data.channelId as string) || ''}
                                    onChange={(e) => handleFieldChange('channelId', e.target.value)}
                                    placeholder="Discord channel ID"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Message</Label>
                                <Textarea
                                    value={(data.message as string) || ''}
                                    onChange={(e) => handleFieldChange('message', e.target.value)}
                                    placeholder="Hello from AgentFlow! Use {{data.field}} for dynamic content"
                                    className="min-h-[80px] bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                        </>
                    );
                }
                if (operation === 'get_messages') {
                    return (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Channel ID</Label>
                                <Input
                                    value={(data.channelId as string) || ''}
                                    onChange={(e) => handleFieldChange('channelId', e.target.value)}
                                    placeholder="Discord channel ID"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Limit</Label>
                                <Input
                                    type="number"
                                    value={(data.limit as string) || '10'}
                                    onChange={(e) => handleFieldChange('limit', e.target.value)}
                                    placeholder="10"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                        </>
                    );
                }
                if (operation === 'create_channel') {
                    return (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Guild (Server) ID</Label>
                                <Input
                                    value={(data.guildId as string) || ''}
                                    onChange={(e) => handleFieldChange('guildId', e.target.value)}
                                    placeholder="Discord server ID"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Channel Name</Label>
                                <Input
                                    value={(data.channelName as string) || ''}
                                    onChange={(e) => handleFieldChange('channelName', e.target.value)}
                                    placeholder="new-channel"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                />
                            </div>
                        </>
                    );
                }
                if (operation === 'add_role' || operation === 'get_members') {
                    return (
                        <div className="space-y-2">
                            <Label className="text-xs text-[hsl(220_9%_63%)]">Guild (Server) ID</Label>
                            <Input
                                value={(data.guildId as string) || ''}
                                onChange={(e) => handleFieldChange('guildId', e.target.value)}
                                placeholder="Discord server ID"
                                className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                            />
                        </div>
                    );
                }
                break;

            case 'google-drive-app':
                if (operation === 'list_files' || operation === 'create_folder') {
                    return (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">Folder ID</Label>
                                <Input
                                    value={(data.folderId as string) || ''}
                                    onChange={(e) => handleFieldChange('folderId', e.target.value)}
                                    placeholder="Parent folder ID (optional)"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                                />
                            </div>
                            {operation === 'create_folder' && (
                                <div className="space-y-2">
                                    <Label className="text-xs text-[hsl(220_9%_63%)]">Folder Name</Label>
                                    <Input
                                        value={(data.folderName as string) || ''}
                                        onChange={(e) => handleFieldChange('folderName', e.target.value)}
                                        placeholder="New Folder"
                                        className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                    />
                                </div>
                            )}
                        </>
                    );
                }
                if (operation === 'download_file' || operation === 'share_file') {
                    return (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-[hsl(220_9%_63%)]">File ID</Label>
                                <Input
                                    value={(data.fileId as string) || ''}
                                    onChange={(e) => handleFieldChange('fileId', e.target.value)}
                                    placeholder="Google Drive file ID"
                                    className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm font-mono"
                                />
                            </div>
                            {operation === 'share_file' && (
                                <div className="space-y-2">
                                    <Label className="text-xs text-[hsl(220_9%_63%)]">Share with Email</Label>
                                    <Input
                                        value={(data.email as string) || ''}
                                        onChange={(e) => handleFieldChange('email', e.target.value)}
                                        placeholder="user@example.com"
                                        className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                                    />
                                </div>
                            )}
                        </>
                    );
                }
                break;

            default:
                return null;
        }

        return null;
    };

    return (
        <div className="w-80 border-l border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(225_8%_18%)]">
                <div className="flex items-center gap-2">
                    <div 
                        className="p-1.5 rounded-md"
                        style={{ backgroundColor: `${color}30` }}
                    >
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-[hsl(220_13%_91%)]">
                        Integration Settings
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-[hsl(225_9%_15%)] text-[hsl(220_9%_63%)] hover:text-[hsl(220_13%_91%)] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[hsl(220_9%_63%)] uppercase tracking-wider">
                        Node Settings
                    </h4>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)]">Name</Label>
                        <Input
                            value={data.label || ''}
                            onChange={(e) => handleLabelChange(e.target.value)}
                            placeholder="Node name"
                            className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm"
                        />
                    </div>
                </div>

                {/* Connection */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[hsl(220_9%_63%)] uppercase tracking-wider flex items-center gap-2">
                        <Link2 className="w-3 h-3" />
                        Connection
                    </h4>

                    <ConnectionSelector
                        providerId={providerId}
                        value={data.connectionId as string}
                        onChange={handleConnectionChange}
                    />

                    <a
                        href="/dashboard/connections"
                        target="_blank"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        Manage Connections <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                {/* Operation */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[hsl(220_9%_63%)] uppercase tracking-wider">
                        Operation
                    </h4>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)]">Action</Label>
                        <Select
                            value={(data.operation as string) || operations[0]?.value}
                            onValueChange={handleOperationChange}
                        >
                            <SelectTrigger className="h-9 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {operations.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                        <div>
                                            <div>{op.label}</div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {op.description}
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Operation-specific fields */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[hsl(220_9%_63%)] uppercase tracking-wider">
                        Configuration
                    </h4>
                    {getOperationFields()}
                </div>

                {/* Expression Hint */}
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-[10px] text-indigo-300 leading-relaxed">
                        <strong>Tip:</strong> Use expressions like <code className="bg-indigo-500/20 px-1 rounded">{'{{$input.field}}'}</code> to 
                        reference data from previous nodes.
                    </p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[hsl(225_8%_18%)] space-y-2">
                <div className="flex items-center gap-2">
                    {onTestNode && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => onTestNode(selectedNode.id)}
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Test Step
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-[hsl(220_9%_63%)] hover:text-[hsl(220_13%_91%)]"
                        onClick={() => onDuplicateNode(selectedNode.id)}
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => onDeleteNode(selectedNode.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
