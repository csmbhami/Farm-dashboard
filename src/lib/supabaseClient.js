import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatically refresh tokens before they expire
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session in other tabs
    detectSessionInUrl: true,
    // Storage key - change this if you update your Supabase project
    storageKey: 'sb-auth-token',
    // Handle storage failures gracefully
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (e) {
          console.warn('Storage getItem failed:', e);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (e) {
          console.warn('Storage setItem failed:', e);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('Storage removeItem failed:', e);
        }
      },
    },
  },
})

export const __SB_ID = supabaseUrl?.split('//')[1]?.split('.')[0] || 'unknown';

// Health check: clear sessions older than 7 days
export function cleanupOldSessions() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const expiresAt = parsed?.expires_at;
            if (expiresAt && expiresAt * 1000 < Date.now()) {
              console.log('[Cleanup] Removing expired session:', key);
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid JSON, remove it
            console.log('[Cleanup] Removing corrupted session:', key);
            localStorage.removeItem(key);
          }
        }
      }
    });
  } catch (e) {
    console.warn('[Cleanup] Failed:', e);
  }
}