/**
 * Global Configuration for AI Data Analyst React App
 */
export const CONFIG = {
  APP_NAME: 'AI Data Analyst',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://127.0.0.1:8001'
        : ''),
  
  // Storage Keys
  THEME_KEY: 'aida_theme',
  TOKEN_KEY: 'aida_auth_token',
  USER_KEY: 'aida_user',
  USERS_REGISTRY_KEY: 'aida_registered_users',
  ACTIVE_DATASET_KEY: 'aida_active_dataset_id',
  ACTIVE_DATASET_CACHE_KEY: 'aida_active_dataset_cache',
  ACTIVE_VIEW_KEY: 'aida_active_view',
  HISTORY_KEY: 'aida_analysis_history',
  SAVED_CHARTS_KEY: 'aida_saved_charts',
  
  // Limits
  MAX_FILE_SIZE_MB: 50,
  MAX_PREVIEW_ROWS: 100,
  DEFAULT_PAGE_SIZE: 10,
  
  // Standard Chart Colors (Blue-First Professional Analytics)
  CHART_COLORS: [
    '#2563eb', // Royal Blue (Primary)
    '#3b82f6', // Vivid Blue
    '#0ea5e9', // Sky Blue
    '#06b6d4', // Cyan
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#64748b', // Slate
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#ec4899'  // Pink
  ],

  COLOR_PALETTES: {
    blue: {
      name: 'Vivid Professional Blue',
      colors: ['#2563eb', '#3b82f6', '#1d4ed8', '#60a5fa', '#0ea5e9', '#0284c7', '#93c5fd'],
      primary: '#2563eb'
    },
    oceanic: {
      name: 'Oceanic Azure & Cyan',
      colors: ['#0284c7', '#06b6d4', '#0ea5e9', '#38bdf8', '#7dd3fc', '#0369a1', '#075985'],
      primary: '#0ea5e9'
    },
    indigo: {
      name: 'Electric Indigo & Violet',
      colors: ['#6366f1', '#4f46e5', '#8b5cf6', '#a855f7', '#3b82f6', '#06b6d4', '#4338ca'],
      primary: '#6366f1'
    },
    cyberpunk: {
      name: 'Cyberpunk Neon',
      colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#6366f1', '#d946ef'],
      primary: '#8b5cf6'
    },
    sunset: {
      name: 'Sunset Amber & Coral',
      colors: ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#fb923c', '#e11d48'],
      primary: '#f97316'
    }
  }
};
