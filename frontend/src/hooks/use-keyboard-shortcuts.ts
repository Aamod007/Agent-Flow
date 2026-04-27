import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

const shortcuts: Shortcut[] = [];

// Register a keyboard shortcut
export function registerShortcut(
  key: string,
  handler: ShortcutHandler,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description?: string;
  } = {}
) {
  const shortcut: Shortcut = {
    key: key.toLowerCase(),
    ctrl: options.ctrl || false,
    shift: options.shift || false,
    alt: options.alt || false,
    handler,
    description: options.description || ''
  };
  
  // Remove existing shortcut with same key combo
  const index = shortcuts.findIndex(s => 
    s.key === shortcut.key &&
    s.ctrl === shortcut.ctrl &&
    s.shift === shortcut.shift &&
    s.alt === shortcut.alt
  );
  
  if (index >= 0) {
    shortcuts[index] = shortcut;
  } else {
    shortcuts.push(shortcut);
  }

  return () => {
    const i = shortcuts.indexOf(shortcut);
    if (i >= 0) shortcuts.splice(i, 1);
  };
}

// Get all registered shortcuts
export function getShortcuts(): Shortcut[] {
  return [...shortcuts];
}

// Format shortcut for display
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' + ');
}

// Hook to use keyboard shortcuts
export function useKeyboardShortcuts(
  customShortcuts?: {
    key: string;
    handler: ShortcutHandler;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description?: string;
  }[]
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    // Check custom shortcuts first
    if (customShortcuts) {
      for (const shortcut of customShortcuts) {
        if (
          shortcut.key.toLowerCase() === key &&
          (shortcut.ctrl || false) === ctrl &&
          (shortcut.shift || false) === shift &&
          (shortcut.alt || false) === alt
        ) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    }

    // Check global shortcuts
    for (const shortcut of shortcuts) {
      if (
        shortcut.key === key &&
        shortcut.ctrl === ctrl &&
        shortcut.shift === shift &&
        shortcut.alt === alt
      ) {
        event.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, [customShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcuts for workflow editor
export const WORKFLOW_SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, description: 'Save workflow' },
  RUN: { key: 'Enter', ctrl: true, description: 'Run workflow' },
  UNDO: { key: 'z', ctrl: true, description: 'Undo' },
  REDO: { key: 'z', ctrl: true, shift: true, description: 'Redo' },
  DELETE: { key: 'Delete', description: 'Delete selected' },
  DUPLICATE: { key: 'd', ctrl: true, description: 'Duplicate selected' },
  COPY: { key: 'c', ctrl: true, description: 'Copy selected' },
  PASTE: { key: 'v', ctrl: true, description: 'Paste' },
  SELECT_ALL: { key: 'a', ctrl: true, description: 'Select all' },
  ESCAPE: { key: 'Escape', description: 'Deselect / Close panel' },
  ZOOM_IN: { key: '=', ctrl: true, description: 'Zoom in' },
  ZOOM_OUT: { key: '-', ctrl: true, description: 'Zoom out' },
  ZOOM_FIT: { key: '0', ctrl: true, description: 'Fit to view' },
  TOGGLE_DEBUG: { key: 'd', ctrl: true, shift: true, description: 'Toggle debug panel' },
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Toggle sidebar' },
  HELP: { key: '/', ctrl: true, description: 'Show shortcuts' }
};

export default useKeyboardShortcuts;
