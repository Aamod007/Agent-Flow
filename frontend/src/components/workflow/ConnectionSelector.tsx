/**
 * Connection Selector Component
 * 
 * A reusable dropdown for selecting saved connections (credentials)
 * to use with integration nodes in workflows.
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Link2,
    Check,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getProvider, type SavedConnection } from '@/lib/connections';

interface ConnectionSelectorProps {
    providerId: string;
    value?: string;
    onChange: (connectionId: string | undefined) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function ConnectionSelector({
    providerId,
    value,
    onChange,
    className,
    placeholder = 'Select connection...',
    disabled = false,
}: ConnectionSelectorProps) {
    const [connections, setConnections] = useState<SavedConnection[]>([]);
    const [loading, setLoading] = useState(true);

    const provider = getProvider(providerId);

    useEffect(() => {
        loadConnections();
    }, [providerId]);

    const loadConnections = async () => {
        try {
            setLoading(true);
            const allConnections = await api.getConnections();
            const filtered = allConnections.filter(c => c.providerId === providerId);
            setConnections(filtered);
        } catch (error) {
            console.error('Failed to load connections:', error);
            // Use mock data for development
            setConnections([]);
        } finally {
            setLoading(false);
        }
    };

    const selectedConnection = connections.find(c => c.id === value);

    const handleAddNew = () => {
        // Open connections page in new tab
        window.open('/dashboard/connections?add=' + providerId, '_blank');
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center gap-2">
                <Select
                    value={value || ''}
                    onValueChange={(val) => onChange(val || undefined)}
                    disabled={disabled || loading}
                >
                    <SelectTrigger className="flex-1 bg-[hsl(225_15%_5%)] border-[hsl(225_8%_20%)] text-sm">
                        <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {connections.length === 0 ? (
                            <div className="py-3 px-2 text-center text-sm text-muted-foreground">
                                No {provider?.name || 'connections'} connected
                            </div>
                        ) : (
                            connections.map((conn) => (
                                <SelectItem key={conn.id} value={conn.id}>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            'w-2 h-2 rounded-full',
                                            conn.status === 'active' ? 'bg-emerald-500' :
                                            conn.status === 'expired' ? 'bg-amber-500' : 'bg-red-500'
                                        )} />
                                        <span>{conn.name}</span>
                                    </div>
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={loadConnections}
                    disabled={loading}
                >
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleAddNew}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Connection Status */}
            {selectedConnection && (
                <div className={cn(
                    'flex items-center gap-2 p-2 rounded text-xs',
                    selectedConnection.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : selectedConnection.status === 'expired'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                )}>
                    {selectedConnection.status === 'active' ? (
                        <>
                            <Check className="w-3 h-3" />
                            <span>Connected to {selectedConnection.name}</span>
                        </>
                    ) : selectedConnection.status === 'expired' ? (
                        <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Connection expired - reconnect required</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Connection error - check settings</span>
                        </>
                    )}
                </div>
            )}

            {/* No connection warning */}
            {!value && !loading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    <span>
                        No credential selected.{' '}
                        <button 
                            className="text-primary hover:underline"
                            onClick={handleAddNew}
                        >
                            Add new connection
                        </button>
                    </span>
                </p>
            )}
        </div>
    );
}

export default ConnectionSelector;
