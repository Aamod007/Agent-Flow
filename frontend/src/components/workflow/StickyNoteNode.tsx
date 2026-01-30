/**
 * Sticky Note Node - Comments/Notes for documentation
 */

import { memo } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { StickyNote } from 'lucide-react';

export interface StickyNoteNodeData {
    content: string;
    color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'gray';
    fontSize?: 'sm' | 'md' | 'lg';
    [key: string]: unknown;
}

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
    yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-300 dark:border-yellow-700',
        text: 'text-yellow-900 dark:text-yellow-100'
    },
    blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-900 dark:text-blue-100'
    },
    green: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        border: 'border-emerald-300 dark:border-emerald-700',
        text: 'text-emerald-900 dark:text-emerald-100'
    },
    pink: {
        bg: 'bg-pink-100 dark:bg-pink-900/30',
        border: 'border-pink-300 dark:border-pink-700',
        text: 'text-pink-900 dark:text-pink-100'
    },
    purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        border: 'border-purple-300 dark:border-purple-700',
        text: 'text-purple-900 dark:text-purple-100'
    },
    gray: {
        bg: 'bg-slate-100 dark:bg-slate-800/50',
        border: 'border-slate-300 dark:border-slate-600',
        text: 'text-slate-900 dark:text-slate-100'
    }
};

const FONT_SIZE_CLASSES = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
};

function StickyNoteNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as StickyNoteNodeData;
    const color = nodeData.color || 'yellow';
    const fontSize = nodeData.fontSize || 'md';
    const colors = COLOR_CLASSES[color] || COLOR_CLASSES.yellow;

    return (
        <>
            {/* Resizer for selected notes */}
            <NodeResizer
                minWidth={150}
                minHeight={100}
                isVisible={selected}
                lineClassName="!border-indigo-400"
                handleClassName="!w-2 !h-2 !bg-indigo-500 !border-none"
            />

            <div
                className={cn(
                    'min-w-[150px] min-h-[100px] p-3 rounded-lg border-2 shadow-md',
                    'transition-all duration-200',
                    colors.bg,
                    selected ? 'border-indigo-400 shadow-lg' : colors.border,
                    'hover:shadow-lg'
                )}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Header with icon */}
                <div className="flex items-center gap-1.5 mb-2 opacity-60">
                    <StickyNote className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Note</span>
                </div>

                {/* Content */}
                <div 
                    className={cn(
                        'whitespace-pre-wrap break-words',
                        colors.text,
                        FONT_SIZE_CLASSES[fontSize]
                    )}
                >
                    {nodeData.content || 'Double-click to edit...'}
                </div>
            </div>
        </>
    );
}

export default memo(StickyNoteNode);
