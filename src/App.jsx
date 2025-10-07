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

  // --- 1) Bootstrap auth with auto-recovery
  useEffect(() => {
    let unsub = null;
    let mounted = true;

    (async () => {
      try {
        // Race getSession against a timeout to detect hangs
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) {
          console.warn("[Auth] getSession error:", error.message);
          // If it's an invalid token error, clear it
          if (error.message.includes('invalid') || error.message.includes('expired')) {
            await supabase.auth.signOut();
          }
        }
        
        if (mounted) {
          setUser(data?.session?.user ?? null);
          setAuthReady(true);
        }
      } catch (e) {
        console.error("[Auth] getSession failed:", e.message);
        
        // Auto-recovery: clear corrupted session
        try {
          console.log("[Auth] Attempting auto-recovery...");
          await supabase.auth.signOut();
          
          // Clear any stuck storage keys
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') && key.includes('auth-token')) {
                localStorage.removeItem(key);
              }
            });
          }
        } catch (signOutErr) {
          console.warn("[Auth] Auto-recovery failed:", signOutErr);
        }
        
        if (mounted) {
          setUser(null);
          setAuthReady(true);
        }
      }

      // Set up auth listener with error handling
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        console.log('[Auth] Event:', event, session?.user?.email || 'no user');
        
        // Handle token refresh failures
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('[Auth] Token refresh failed, clearing session');
          await supabase.auth.signOut();
        }
        
        // Handle signed out state
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

  // Block only until the very first auth check completes
  if (!authReady) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-purple-50">
        <p className="text-gray-600">Starting app…</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex bg-purple-100 overflow-hidden relative">
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

        {loadingData && user && (
          <div className="mb-4 text-sm text-gray-600">Loading data…</div>
        )}
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

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
      </main>
    </div>
  );
}