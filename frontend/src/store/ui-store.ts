import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    // Sidebar states
    sidebarCollapsed: boolean;
    propertiesPanelOpen: boolean;
    monitorPanelOpen: boolean;

    // Theme
    theme: 'dark' | 'light' | 'system';
    accentColor: string;

    // View preferences
    workflowViewMode: 'grid' | 'list';
    showMinimap: boolean;
    showGrid: boolean;

    // Notifications
    notifications: Notification[];

    // Actions
    toggleSidebar: () => void;
    togglePropertiesPanel: () => void;
    toggleMonitorPanel: () => void;
    setTheme: (theme: 'dark' | 'light' | 'system') => void;
    setAccentColor: (color: string) => void;
    setWorkflowViewMode: (mode: 'grid' | 'list') => void;
    toggleMinimap: () => void;
    toggleGrid: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
}

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    timestamp: number;
    duration?: number;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Initial state
            sidebarCollapsed: false,
            propertiesPanelOpen: false,
            monitorPanelOpen: false,
            theme: 'dark',
            accentColor: 'indigo',
            workflowViewMode: 'grid',
            showMinimap: true,
            showGrid: true,
            notifications: [],

            // Actions
            toggleSidebar: () => set((state) => ({
                sidebarCollapsed: !state.sidebarCollapsed
            })),

            togglePropertiesPanel: () => set((state) => ({
                propertiesPanelOpen: !state.propertiesPanelOpen
            })),

            toggleMonitorPanel: () => set((state) => ({
                monitorPanelOpen: !state.monitorPanelOpen
            })),

            setTheme: (theme) => set({ theme }),

            setAccentColor: (accentColor) => set({ accentColor }),

            setWorkflowViewMode: (workflowViewMode) => set({ workflowViewMode }),

            toggleMinimap: () => set((state) => ({
                showMinimap: !state.showMinimap
            })),

            toggleGrid: () => set((state) => ({
                showGrid: !state.showGrid
            })),

            addNotification: (notification) => set((state) => ({
                notifications: [
                    ...state.notifications,
                    {
                        ...notification,
                        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        timestamp: Date.now(),
                    },
                ],
            })),

            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
            })),

            clearNotifications: () => set({ notifications: [] }),
        }),
        {
            name: 'agentflow-ui-preferences',
            partialize: (state) => ({
                theme: state.theme,
                accentColor: state.accentColor,
                workflowViewMode: state.workflowViewMode,
                showMinimap: state.showMinimap,
                showGrid: state.showGrid,
                sidebarCollapsed: state.sidebarCollapsed,
            }),
        }
    )
);

// Convenience hooks
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useNotifications = () => useUIStore((state) => state.notifications);
