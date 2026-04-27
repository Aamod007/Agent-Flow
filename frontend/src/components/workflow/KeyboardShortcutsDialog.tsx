import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { WORKFLOW_SHORTCUTS, formatShortcut } from '../../hooks/use-keyboard-shortcuts';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const shortcutCategories = [
    {
      name: 'General',
      shortcuts: [
        WORKFLOW_SHORTCUTS.SAVE,
        WORKFLOW_SHORTCUTS.RUN,
        WORKFLOW_SHORTCUTS.HELP,
        WORKFLOW_SHORTCUTS.ESCAPE
      ]
    },
    {
      name: 'Editing',
      shortcuts: [
        WORKFLOW_SHORTCUTS.UNDO,
        WORKFLOW_SHORTCUTS.REDO,
        WORKFLOW_SHORTCUTS.COPY,
        WORKFLOW_SHORTCUTS.PASTE,
        WORKFLOW_SHORTCUTS.DUPLICATE,
        WORKFLOW_SHORTCUTS.DELETE,
        WORKFLOW_SHORTCUTS.SELECT_ALL
      ]
    },
    {
      name: 'View',
      shortcuts: [
        WORKFLOW_SHORTCUTS.ZOOM_IN,
        WORKFLOW_SHORTCUTS.ZOOM_OUT,
        WORKFLOW_SHORTCUTS.ZOOM_FIT,
        WORKFLOW_SHORTCUTS.TOGGLE_SIDEBAR,
        WORKFLOW_SHORTCUTS.TOGGLE_DEBUG
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {shortcutCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs font-mono">
                        {formatShortcut(shortcut as any)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Ctrl + /</kbd> to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default KeyboardShortcutsDialog;
