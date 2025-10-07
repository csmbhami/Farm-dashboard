// src/context/AccountContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AccountCtx = createContext(null);
export const useAccount = () => useContext(AccountCtx);

export function AccountProvider({ children }) {
  const [accountId, setAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  async function resolveAccount({ blocking } = { blocking: false }) {
    try {
      if (blocking) setLoading(true);

      // Quick check: try to get user from localStorage first
      let user = null;
      try {
        const keys = Object.keys(localStorage);
        const authKey = keys.find(key => key.startsWith('sb-') && key.includes('auth-token'));
        if (authKey) {
          const data = JSON.parse(localStorage.getItem(authKey));
          user = data?.user;
        }
      } catch (e) {
        console.warn('[Account] Failed to read from localStorage');
      }

      // Fallback to API if no local user
      if (!user) {
        const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) console.error("[Account] getSession error:", sessErr);
        user = sessionData?.session?.user ?? null;
      }

      if (!user) {
        console.log('[Account] No user, clearing accountId');
        setAccountId(null);
        setLoading(false);
        return;
      }

      console.log('[Account] Resolving account for user:', user.email);
      
      // Add timeout to the RPC call
      const rpcPromise = supabase.rpc("ensure_personal_account");
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RPC timeout')), 3000)
      );

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);
      
      if (error) {
        console.error("[Account] ensure_personal_account error:", error);
        setAccountId(null);
        setLoading(false);
        return;
      }
      
      if (mounted.current) {
        console.log('[Account] Account resolved:', data);
        setAccountId(data);
        setLoading(false);
      }
    } catch (err) {
      console.error("[Account] resolveAccount fatal:", err);
      if (mounted.current) {
        setAccountId(null);
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    mounted.current = true;

    // Initial (blocking)
    resolveAccount({ blocking: true });

    // Auth state changes: handle sign out immediately
    const sub = supabase.auth.onAuthStateChange(async (event) => {
      console.log('[AccountContext] Auth event:', event);
      
      // Immediately clear accountId on sign out - don't wait for resolution
      if (event === "SIGNED_OUT") {
        if (mounted.current) {
          setAccountId(null);
          setLoading(false);
        }
        return;
      }
      
      // Block only on sign in
      const block = event === "SIGNED_IN";
      await resolveAccount({ blocking: block });
    });

    // Silent refresh on tab focus
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        resolveAccount({ blocking: false });
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted.current = false;
      sub.data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <AccountCtx.Provider value={{ accountId, loading }}>
      {children}
    </AccountCtx.Provider>
  );
}