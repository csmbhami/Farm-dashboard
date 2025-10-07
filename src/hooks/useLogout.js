// src/hooks/useLogout.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      console.log('[Logout] Starting logout...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Logout] Error:', error.message);
      }
      
      console.log('[Logout] Successfully signed out');
      
    } catch (error) {
      console.error('[Logout] Failed:', error);
      
      // Fallback: manually clear
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } finally {
      setIsLoggingOut(false);
    }
    
    // Force hard redirect (more reliable than navigate)
    console.log('[Logout] Redirecting to login...');
    window.location.href = '/login';
  };

  return { logout, isLoggingOut };
}