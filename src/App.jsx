import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { Sprout, ClipboardList, Package, Users, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

// ✅ Private route wrapper
function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    }
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}

//
// ---------------------- AUTH PAGES ----------------------
//
function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2 mb-3 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2 mb-3 w-full"
      />
      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Registering..." : "Register"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">Account created! Check your email for verification.</p>}
    </div>
  );
}

import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // ✅ Successful login
    setLoading(false);
    navigate("/dashboard"); // redirect after login
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2 mb-3 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2 mb-3 w-full"
      />
      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Loading..." : "Login"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <p className="mt-3 text-sm text-gray-600 text-center">
        Don’t have an account?{" "}
        <a href="/register" className="text-purple-600 hover:underline">
          Register
        </a>
      </p>
    </div>
  );
}


//
// ---------------------- DASHBOARD + PAGES ----------------------
//

function DashboardPage({ crops, tasks, inventory, employees }) {
  return (
    <div className="grid grid-cols-1 gap-6 h-full w-full">
      {/* Crop Status */}
      <div className="bg-white border-l-4 border-green-500 rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sprout className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Crop Status</h3>
        </div>
        <div className="flex flex-col space-y-4">
          {crops.slice(0, 3).map((c) => (
            <div key={c.id} className="flex flex-col space-y-2">
              <p className="text-sm font-medium text-gray-800">{c.name}</p>
              <div className="w-full bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full ${
                    c.status === "Healthy"
                      ? "bg-green-500"
                      : c.status === "Needs Water"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${c.growth}%` }}
                />
                <span className="absolute inset-0 text-xs flex items-center justify-center text-gray-700 font-semibold">
                  {c.growth}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white border-l-4 border-yellow-500 rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
        </div>
        <div className="flex flex-col space-y-2">
          {tasks.slice(0, 3).map((t) => (
            <div key={t.id} className="flex justify-between items-center p-2 border rounded-md bg-gray-50">
              <span className="text-sm font-medium text-gray-800">{t.task}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                {t.due_date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white border-l-4 border-pink-500 rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-800">Inventory</h3>
        </div>
        <div className="flex flex-col space-y-2">
          {inventory.slice(0, 3).map((i) => (
            <div key={i.id} className="flex justify-between items-center p-2 border rounded-md bg-gray-50">
              <span className="text-sm font-medium text-gray-800">{i.item}</span>
              <span className={`text-sm font-semibold ${i.qty < 30 ? "text-red-600" : "text-gray-700"}`}>
                {i.qty} {i.qty < 30 && <span className="ml-1 text-xs">(Low!)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Employees */}
      <div className="bg-white border-l-4 border-blue-500 rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Employees</h3>
        </div>
        <div className="flex flex-col space-y-2">
          {employees.slice(0, 3).map((e) => (
            <p key={e.id} className="text-sm font-medium text-gray-800">
              {e.name} <span className="text-xs text-gray-500">— {e.role}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  const location = useLocation();
  const titles = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/crops": "Crops",
    "/inventory": "Inventory",
    "/tasks": "Tasks",
    "/employees": "Employees",
  };
  return <h1 className="text-4xl font-bold text-center p-6 text-purple-600">{titles[location.pathname]}</h1>;
}

//
// ---------------------- MAIN APP ----------------------
//

export default function App() {
  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

   useEffect(() => {
    // check current session on load
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    getUser();

    // listen for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

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
      <div className="w-screen h-screen flex bg-purple-100 rounded-xl overflow-hidden">
        {/* Sidebar */}
        {user && (
        <aside
          className={`${
            isSidebarOpen ? "w-64" : "w-0"
          } bg-purple-800 text-white flex flex-col transition-all duration-300 overflow-hidden`}
        >
          <h1 className="text-2xl font-bold p-6 border-b border-purple-700">Farm Dashboard</h1>
          <nav className="flex-1 p-4 space-y-2">
            

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${isActive ? "bg-purple-600" : "hover:bg-purple-700"}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/crops"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${isActive ? "bg-purple-600" : "hover:bg-purple-700"}`
              }
            >
              Crops
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${isActive ? "bg-purple-600" : "hover:bg-purple-700"}`
              }
            >
              Inventory
            </NavLink>
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${isActive ? "bg-purple-600" : "hover:bg-purple-700"}`
              }
            >
              Tasks
            </NavLink>
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${isActive ? "bg-purple-600" : "hover:bg-purple-700"}`
              }
            >
              Employees
            </NavLink>
          </nav>
        </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-6 h-full relative overflow-y-auto">
          {/* Sidebar toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1 left-1 z-10 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {user && (
          <button
              onClick={async () => await supabase.auth.signOut()}
              className="absolute top-1 right-1 z-10 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Logout
          </button>
          )}
          <PageHeader />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage crops={crops} tasks={tasks} inventory={inventory} employees={employees} />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage crops={crops} tasks={tasks} inventory={inventory} employees={employees} />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
