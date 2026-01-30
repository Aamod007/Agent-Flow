/**
 * Expression Editor Component
 * 
 * n8n-like expression editor for referencing data from previous nodes
 * Supports: {{$json.field}}, {{$node["NodeName"].json}}, {{$input.item}}
 */

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
    Code2, 
    Variable, 
    ChevronRight,
    Sparkles,
    HelpCircle,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface ExpressionEditorProps {
    value: string;
    onChange: (value: string) => void;
    availableNodes?: NodeVariable[];
    placeholder?: string;
    className?: string;
    singleLine?: boolean;
}

interface NodeVariable {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    outputData?: any;
}

interface AutocompleteItem {
    label: string;
    value: string;
    type: 'node' | 'field' | 'method' | 'variable';
    description?: string;
}

// Built-in variables and methods
const BUILT_IN_VARIABLES: AutocompleteItem[] = [
    { label: '$json', value: '$json', type: 'variable', description: 'Current item data' },
    { label: '$input', value: '$input', type: 'variable', description: 'Input from previous node' },
    { label: '$node', value: '$node', type: 'variable', description: 'Access specific node data' },
    { label: '$workflow', value: '$workflow', type: 'variable', description: 'Workflow metadata' },
    { label: '$execution', value: '$execution', type: 'variable', description: 'Execution metadata' },
    { label: '$now', value: '$now', type: 'variable', description: 'Current timestamp' },
    { label: '$today', value: '$today', type: 'variable', description: 'Today\'s date' },
];

const BUILT_IN_METHODS: AutocompleteItem[] = [
    { label: '.toString()', value: '.toString()', type: 'method', description: 'Convert to string' },
    { label: '.toNumber()', value: '.toNumber()', type: 'method', description: 'Convert to number' },
    { label: '.toBoolean()', value: '.toBoolean()', type: 'method', description: 'Convert to boolean' },
    { label: '.isEmpty()', value: '.isEmpty()', type: 'method', description: 'Check if empty' },
    { label: '.first()', value: '.first()', type: 'method', description: 'Get first item' },
    { label: '.last()', value: '.last()', type: 'method', description: 'Get last item' },
    { label: '.length', value: '.length', type: 'method', description: 'Array/string length' },
];

// Parse expression and validate
function parseExpression(expr: string): { valid: boolean; error?: string } {
    try {
        // Check for balanced braces
        const openBraces = (expr.match(/\{\{/g) || []).length;
        const closeBraces = (expr.match(/\}\}/g) || []).length;
        
        if (openBraces !== closeBraces) {
            return { valid: false, error: 'Unbalanced braces' };
        }

        // Basic syntax validation
        const expressions = expr.match(/\{\{([^}]+)\}\}/g) || [];
        for (const exp of expressions) {
            const inner = exp.slice(2, -2).trim();
            if (!inner) {
                return { valid: false, error: 'Empty expression' };
            }
            if (!inner.startsWith('$')) {
                return { valid: false, error: `Expression must start with $: ${inner}` };
            }
        }

        return { valid: true };
    } catch (e) {
        return { valid: false, error: 'Invalid expression syntax' };
    }
}

// Extract fields from object for autocomplete
function extractFields(obj: any, prefix = ''): AutocompleteItem[] {
    const items: AutocompleteItem[] = [];
    
    if (!obj || typeof obj !== 'object') return items;

    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        items.push({
            label: path,
            value: path,
            type: 'field',
            description: typeof value === 'object' 
                ? (Array.isArray(value) ? `Array(${value.length})` : 'Object')
                : String(value).substring(0, 30)
        });

        // Recurse into objects (limit depth)
        if (typeof value === 'object' && value !== null && prefix.split('.').length < 3) {
            items.push(...extractFields(value, path));
        }
    }

    return items;
}

export function ExpressionEditor({
    value,
    onChange,
    availableNodes = [],
    placeholder = 'Enter value or expression {{$json.field}}',
    className,
    singleLine = false
}: ExpressionEditorProps) {
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [autocompleteItems, setAutocompleteItems] = useState<AutocompleteItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [_isExpressionMode, _setIsExpressionMode] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    // Check if we're inside an expression
    const checkExpressionMode = useCallback((text: string, pos: number) => {
        const beforeCursor = text.substring(0, pos);
        const openIndex = beforeCursor.lastIndexOf('{{');
        const closeIndex = beforeCursor.lastIndexOf('}}');
        return openIndex > closeIndex;
    }, []);

    // Update autocomplete items based on context
    const updateAutocomplete = useCallback((text: string, pos: number) => {
        const isInExpression = checkExpressionMode(text, pos);
        _setIsExpressionMode(isInExpression);

        if (!isInExpression) {
            setShowAutocomplete(false);
            return;
        }

        const beforeCursor = text.substring(0, pos);
        const openIndex = beforeCursor.lastIndexOf('{{');
        const currentExpression = beforeCursor.substring(openIndex + 2);

        let items: AutocompleteItem[] = [];

        // Check what we're typing
        if (currentExpression.startsWith('$node["')) {
            // Show node names
            const nodeItems = availableNodes.map(node => ({
                label: node.nodeName,
                value: `$node["${node.nodeName}"]`,
                type: 'node' as const,
                description: node.nodeType
            }));
            items = nodeItems;
        } else if (currentExpression.includes('.')) {
            // Show fields/methods
            const parts = currentExpression.split('.');
            const lastPart = parts[parts.length - 1];
            
            // Filter methods that match
            items = BUILT_IN_METHODS.filter(m => 
                m.label.toLowerCase().includes(lastPart.toLowerCase())
            );

            // Add fields from available node data
            for (const node of availableNodes) {
                if (currentExpression.includes(node.nodeName) && node.outputData) {
                    items.push(...extractFields(node.outputData).filter(f =>
                        f.label.toLowerCase().includes(lastPart.toLowerCase())
                    ));
                }
            }
        } else {
            // Show variables
            items = BUILT_IN_VARIABLES.filter(v =>
                v.label.toLowerCase().includes(currentExpression.toLowerCase())
            );
        }

        setAutocompleteItems(items);
        setShowAutocomplete(items.length > 0);
        setSelectedIndex(0);
    }, [availableNodes, checkExpressionMode]);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const newValue = e.target.value;
        const newPosition = e.target.selectionStart || 0;
        onChange(newValue);
        setCursorPosition(newPosition);
        updateAutocomplete(newValue, newPosition);
    };

    // Handle key navigation in autocomplete
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showAutocomplete) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, autocompleteItems.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
            case 'Tab':
                if (autocompleteItems[selectedIndex]) {
                    e.preventDefault();
                    insertAutocomplete(autocompleteItems[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowAutocomplete(false);
                break;
        }
    };

    // Insert autocomplete selection
    const insertAutocomplete = (item: AutocompleteItem) => {
        if (!inputRef.current) return;

        const beforeCursor = value.substring(0, cursorPosition);
        const afterCursor = value.substring(cursorPosition);
        const openIndex = beforeCursor.lastIndexOf('{{');
        
        const newValue = value.substring(0, openIndex + 2) + item.value + afterCursor;
        onChange(newValue);
        setShowAutocomplete(false);

        // Move cursor after inserted value
        const newPosition = openIndex + 2 + item.value.length;
        setTimeout(() => {
            inputRef.current?.setSelectionRange(newPosition, newPosition);
            inputRef.current?.focus();
        }, 0);
    };

    // Validation status
    const validation = parseExpression(value);
    const hasExpression = value.includes('{{');

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
                setShowAutocomplete(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const InputComponent = singleLine ? 'input' : 'textarea';

    return (
        <div className={cn('relative', className)}>
            {/* Expression mode indicator */}
            <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                    {hasExpression ? (
                        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                        <Variable className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                        {hasExpression ? 'Expression' : 'Fixed Value'}
                    </span>
                </div>
                {hasExpression && (
                    <div className="flex items-center gap-1">
                        {validation.valid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        {!validation.valid && (
                            <span className="text-[10px] text-red-400">{validation.error}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="relative">
                <InputComponent
                    ref={inputRef as any}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onSelect={(e: any) => setCursorPosition(e.target.selectionStart || 0)}
                    placeholder={placeholder}
                    className={cn(
                        'w-full font-mono text-sm',
                        'bg-background border border-border rounded-md',
                        'px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                        'text-foreground placeholder:text-muted-foreground',
                        !singleLine && 'min-h-[80px] resize-y',
                        !validation.valid && hasExpression && 'border-red-500/50'
                    )}
                />

                {/* Quick insert button */}
                <button
                    type="button"
                    onClick={() => {
                        const newValue = value + '{{}}';
                        onChange(newValue);
                        setTimeout(() => {
                            if (inputRef.current) {
                                const pos = newValue.length - 2;
                                inputRef.current.setSelectionRange(pos, pos);
                                inputRef.current.focus();
                                updateAutocomplete(newValue, pos);
                            }
                        }, 0);
                    }}
                    className={cn(
                        'absolute right-2 top-2 p-1 rounded',
                        'text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10',
                        'transition-colors'
                    )}
                    title="Insert expression"
                >
                    <Sparkles className="w-4 h-4" />
                </button>
            </div>

            {/* Autocomplete dropdown */}
            {showAutocomplete && autocompleteItems.length > 0 && (
                <div
                    ref={autocompleteRef}
                    className={cn(
                        'absolute z-50 mt-1 w-full',
                        'bg-popover border border-border rounded-lg shadow-xl',
                        'max-h-[200px] overflow-y-auto'
                    )}
                >
                    {autocompleteItems.map((item, index) => (
                        <button
                            key={item.value}
                            onClick={() => insertAutocomplete(item)}
                            className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 text-left',
                                'hover:bg-muted/50 transition-colors',
                                index === selectedIndex && 'bg-muted'
                            )}
                        >
                            <div className={cn(
                                'w-5 h-5 rounded flex items-center justify-center text-xs',
                                item.type === 'variable' && 'bg-indigo-500/20 text-indigo-400',
                                item.type === 'node' && 'bg-purple-500/20 text-purple-400',
                                item.type === 'field' && 'bg-emerald-500/20 text-emerald-400',
                                item.type === 'method' && 'bg-amber-500/20 text-amber-400'
                            )}>
                                {item.type === 'variable' && '$'}
                                {item.type === 'node' && 'N'}
                                {item.type === 'field' && '.'}
                                {item.type === 'method' && 'ƒ'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-mono text-foreground truncate">
                                    {item.label}
                                </div>
                                {item.description && (
                                    <div className="text-xs text-muted-foreground truncate">
                                        {item.description}
                                    </div>
                                )}
                            </div>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        </button>
                    ))}
                </div>
            )}

            {/* Help text */}
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                <HelpCircle className="w-3 h-3" />
                <span>
                    Use <code className="px-1 bg-muted rounded">{'{{$json.field}}'}</code> to reference data
                </span>
            </div>
        </div>
    );
}

export default memo(ExpressionEditor);
