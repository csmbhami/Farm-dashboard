// src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";

import { supabase, cleanupOldSessions } from "./lib/supabaseClient";
import { useAccount } from "./context/AccountContext";

// Components
import Sidebar from "./components/Sidebar";
import PageHeader from "./components/PageHeader";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import DashboardPage from "./pages/DashboardPage";
import CropsPage from "./pages/CropsPage";
import TasksPage from "./pages/TasksPage";
import InventoryPage from "./pages/InventoryPage";
import EmployeesPage from "./pages/EmployeesPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Helper: Read session directly from localStorage (instant, no API call)
function getLocalSession() {
  try {
    const keys = Object.keys(localStorage);
    const authKey = keys.find(key => key.startsWith('sb-') && key.includes('auth-token'));
    if (!authKey) {
      console.log('[Auth] No auth key found in localStorage');
      return null;
    }
    
    const data = localStorage.getItem(authKey);
    if (!data) {
      console.log('[Auth] Auth key exists but no data');
      return null;
    }
    
    const parsed = JSON.parse(data);
    console.log('[Auth] Parsed session keys:', Object.keys(parsed));
    
    // Supabase stores session in different possible locations
    const session = parsed?.currentSession || parsed?.session || parsed;
    
    if (!session?.user) {
      console.log('[Auth] No user in session');
      return null;
    }
    
    // Check if session is expired
    const expiresAt = session?.expires_at;
    if (expiresAt && expiresAt < Math.floor(Date.now() / 1000)) {
      console.log('[Auth] Local session expired');
      return null;
    }
    
    console.log('[Auth] Found valid local session for:', session.user.email);
    return session;
  } catch (e) {
    console.warn('[Auth] Failed to read local session:', e);
    return null;
  }
}

export default function App() {
  // Run session cleanup on app start
  useEffect(() => {
    cleanupOldSessions();
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auth state
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Data state
  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  const { accountId, loading: accountLoading } = useAccount();
  const location = useLocation();

  // --- 1) Bootstrap auth with localStorage-first approach (instant!)
  useEffect(() => {
    let unsub = null;
    let mounted = true;
    let authResolved = false;

    (async () => {
      // INSTANT: Try reading from localStorage first
      const localSession = getLocalSession();
      
      if (localSession?.user) {
        console.log('[Auth] Using cached local session');
        if (mounted && !authResolved) {
          setUser(localSession.user);
          setAuthReady(true);
          authResolved = true;
        }
      } else {
        console.log('[Auth] No valid local session');
        if (mounted && !authResolved) {
          setAuthReady(true);
          setUser(null);
          authResolved = true;
        }
      }

      // Background: Verify session with Supabase (non-blocking)
      try {
        console.log('[Auth] Verifying session in background...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn("[Auth] Background verification error:", error.message);
          if (error.message.includes('invalid') || error.message.includes('expired')) {
            await supabase.auth.signOut();
            if (mounted) setUser(null);
          }
        } else if (mounted) {
          // Update user if it changed
          const newUser = data?.session?.user ?? null;
          setUser(newUser);
        }
      } catch (e) {
        console.error("[Auth] Background verification failed:", e.message);
        
        // Auto-recovery
        try {
          await supabase.auth.signOut();
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-')) {
                localStorage.removeItem(key);
              }
            });
          }
          if (mounted) setUser(null);
        } catch (signOutErr) {
          console.warn("[Auth] Auto-recovery failed:", signOutErr);
        }
      }

      // Set up auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        console.log('[Auth] Event:', event, session?.user?.email || 'no user');
        
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('[Auth] Token refresh failed');
          await supabase.auth.signOut();
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out');
        }
        
        setUser(session?.user ?? null);
      });
      
      unsub = () => subscription.unsubscribe();
    })();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, []);

  // --- 2) Fetch tenant data AFTER user + accountId exist
  useEffect(() => {
    if (!user || !accountId) return;
    let cancelled = false;

    setLoadingData(true);
    setError(null);

    (async () => {
      try {
        const [
          { data: cropsData, error: cropsErr },
          { data: tasksData, error: tasksErr },
          { data: inventoryData, error: invErr },
          { data: employeesData, error: empErr },
        ] = await Promise.all([
          supabase.from("crops").select("*").eq("account_id", accountId),
          supabase.from("tasks").select("*").eq("account_id", accountId),
          supabase.from("inventory").select("*").eq("account_id", accountId),
          supabase.from("employees").select("*").eq("account_id", accountId),
        ]);
        if (cropsErr || tasksErr || invErr || empErr) throw (cropsErr || tasksErr || invErr || empErr);

        if (!cancelled) {
          setCrops(cropsData || []);
          setTasks(tasksData || []);
          setInventory(inventoryData || []);
          setEmployees(employeesData || []);
        }
      } catch (e) {
        console.error("[Fetch] error:", e);
        if (!cancelled) setError(e.message || "Failed to load data.");
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, accountId]);

  // Force routes remount on auth flips
  const routesKey = useMemo(() => (user ? "authed" : "anon"), [user]);

  // Block only until auth is ready (don't wait for account)
  if (!authReady) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <div className="animate-pulse mb-2">
            <div className="w-12 h-12 bg-purple-600 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex bg-purple-100 overflow-hidden relative animate-fadeIn">
      {user && <Sidebar isOpen={isSidebarOpen} user={user} />}

      <main className="flex-1 p-6 h-full relative overflow-y-auto">
        {user && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1 left-1 z-10 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {user && <PageHeader />}

        {/* Show loading indicator while account is being resolved */}
        {user && accountLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-pulse mb-2">
                <div className="w-10 h-10 bg-purple-600 rounded-full mx-auto"></div>
              </div>
              <p className="text-gray-600">Loading your data...</p>
            </div>
          </div>
        )}

        {loadingData && user && !accountLoading && (
          <div className="mb-4 text-sm text-gray-600">Loading data…</div>
        )}
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        {/* Only render routes when account is ready */}
        {(!user || !accountLoading) && (
          <Routes key={routesKey}>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage
                    crops={crops}
                    tasks={tasks}
                    inventory={inventory}
                    employees={employees}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/crops"
              element={
                <PrivateRoute>
                  <CropsPage crops={crops} />
                </PrivateRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <TasksPage tasks={tasks} />
                </PrivateRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <PrivateRoute>
                  <InventoryPage inventory={inventory} />
                </PrivateRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <PrivateRoute>
                  <EmployeesPage employees={employees} />
                </PrivateRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}