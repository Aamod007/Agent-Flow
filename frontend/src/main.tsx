import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply initial theme before render to prevent flash
const THEME_KEY = 'agentflow-theme';
const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const storedTheme = localStorage.getItem(THEME_KEY) || 'dark';
const effectiveTheme = storedTheme === 'system' ? getSystemTheme() : storedTheme;
document.documentElement.classList.add(effectiveTheme);
document.documentElement.setAttribute('data-theme', effectiveTheme);
document.documentElement.style.colorScheme = effectiveTheme;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
