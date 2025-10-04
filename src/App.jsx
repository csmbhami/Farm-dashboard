// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Track auth state (controls sidebar + protected routes)
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch data (runs once on load; you can refetch on demand later)
  useEffect(() => {
    const fetchData = async () => {
      const { data: cropsData } = await supabase.from("crops").select("*");
      const { data: tasksData } = await supabase.from("tasks").select("*");
      const { data: inventoryData } = await supabase.from("inventory").select("*");
      const { data: employeesData } = await supabase.from("employees").select("*");

      setCrops(cropsData || []);
      setTasks(tasksData || []);
      setInventory(inventoryData || []);
      setEmployees(employeesData || []);
    };

    fetchData();
  }, []);

  return (
    <Router>
      <div className="w-screen h-screen flex bg-purple-100 overflow-hidden">
        {/* Sidebar (component hides itself if user is null) */}
        <Sidebar isOpen={isSidebarOpen} user={user} />

        {/* Main content */}
        <main className="flex-1 p-6 h-full relative overflow-y-auto">
          {/* Sidebar toggle (show only when logged in) */}
          {user && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute top-1 left-1 z-10 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <PageHeader />

          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route
              path="/"
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}
