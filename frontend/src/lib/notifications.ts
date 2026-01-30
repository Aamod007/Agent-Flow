// Browser notification utilities for AgentFlow

export type NotificationType = 'workflow-complete' | 'workflow-failed' | 'workflow-started' | 'info';

interface NotificationOptions {
    title: string;
    body: string;
    type?: NotificationType;
    onClick?: () => void;
    tag?: string;
}

// Check if browser notifications are supported and permitted
export function canShowNotifications(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
}

// Request permission for browser notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('Browser notifications are not supported');
        return 'denied';
    }
    
    return await Notification.requestPermission();
}

// Get icon based on notification type
function getNotificationIcon(type: NotificationType): string {
    // Using simple emoji as fallback, could be replaced with actual icons
    switch (type) {
        case 'workflow-complete':
            return '/icons/success.png';
        case 'workflow-failed':
            return '/icons/error.png';
        case 'workflow-started':
            return '/icons/running.png';
        default:
            return '/favicon.ico';
    }
}

// Show a browser notification
export function showNotification(options: NotificationOptions): Notification | null {
    if (!canShowNotifications()) {
        console.warn('Notifications not permitted');
        return null;
    }

    const { title, body, type = 'info', onClick, tag } = options;
    
    const notification = new Notification(title, {
        body,
        icon: getNotificationIcon(type),
        tag: tag || `agentflow-${Date.now()}`,
        badge: '/favicon.ico',
        requireInteraction: type === 'workflow-failed', // Failed workflows stay until clicked
    });

    if (onClick) {
        notification.onclick = () => {
            onClick();
            notification.close();
            window.focus();
        };
    }

    // Auto-close after 5 seconds for non-error notifications
    if (type !== 'workflow-failed') {
        setTimeout(() => notification.close(), 5000);
    }

    return notification;
}

// Workflow-specific notification helpers
export function notifyWorkflowComplete(workflowName: string, executionId?: string) {
    return showNotification({
        title: 'Workflow Completed ✓',
        body: `"${workflowName}" has finished successfully`,
        type: 'workflow-complete',
        tag: `workflow-complete-${executionId || Date.now()}`,
        onClick: () => {
            // Navigate to execution results if executionId provided
            if (executionId) {
                window.location.href = `/workflows?execution=${executionId}`;
            }
        }
    });
}

export function notifyWorkflowFailed(workflowName: string, error?: string, executionId?: string) {
    return showNotification({
        title: 'Workflow Failed ✗',
        body: error ? `"${workflowName}": ${error}` : `"${workflowName}" has failed`,
        type: 'workflow-failed',
        tag: `workflow-failed-${executionId || Date.now()}`,
        onClick: () => {
            if (executionId) {
                window.location.href = `/workflows?execution=${executionId}`;
            }
        }
    });
}

export function notifyWorkflowStarted(workflowName: string) {
    return showNotification({
        title: 'Workflow Started',
        body: `"${workflowName}" is now running`,
        type: 'workflow-started',
        tag: `workflow-started-${Date.now()}`
    });
}
