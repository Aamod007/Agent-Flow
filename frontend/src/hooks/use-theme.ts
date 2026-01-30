import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'system';

const THEME_KEY = 'agentflow-theme';

function getSystemTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
    
    root.classList.remove('dark', 'light');
    root.classList.add(effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
    
    // Update color-scheme for native elements
    root.style.colorScheme = effectiveTheme;
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'dark';
        const stored = localStorage.getItem(THEME_KEY) as Theme | null;
        return stored || 'dark';
    });

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
    }, []);

    // Apply theme on mount and when it changes
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // Listen for system theme changes when in system mode
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('system');
        
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    return {
        theme,
        effectiveTheme,
        setTheme,
        isDark: effectiveTheme === 'dark',
        isLight: effectiveTheme === 'light',
    };
}

export default useTheme;
