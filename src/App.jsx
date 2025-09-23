import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Sprout, ClipboardList, Package, Users } from "lucide-react";
import { Menu, X } from "lucide-react"; // icons for open/close
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient.js";







// Page components must take props
function DashboardPage({ crops, tasks, inventory, employees }) {
  return (
    <div className="grid grid-cols-1 gap-6 h-full w-full">
      {/* Crop Status */}
      <div className="bg-white border-l-4 border-green-500 rounded-xl shadow p-4 flex flex-col w-full">
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
                ></div>
                <span className="absolute inset-0 text-xs flex items-center justify-center text-gray-700 font-semibold">
                  {c.growth}%
                </span>
              </div>
              <p className="text-xs text-gray-500">Status: {c.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white border-l-4 border-yellow-500 rounded-xl shadow p-4 flex flex-col w-full">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
        </div>
        <div className="flex flex-col space-y-2">
          {tasks.slice(0, 3).map((t) => {
            let badgeColor = "bg-green-100 text-green-700"; 
            if (t.due_date === new Date().toISOString().split("T")[0]) {
              badgeColor = "bg-red-100 text-red-700";
            }
            return (
              <div
                key={t.id}
                className="flex justify-between items-center p-2 border rounded-md bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-800">{t.task}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor}`}>
                  {t.due_date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white border-l-4 border-pink-500 rounded-xl shadow p-4 flex flex-col w-full">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-800">Inventory</h3>
        </div>
        <div className="flex flex-col space-y-2">
          {inventory.slice(0, 3).map((i) => {
            const isLow = i.qty < 30;
            return (
              <div
                key={i.id}
                className="flex justify-between items-center p-2 border rounded-md bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-800">{i.item}</span>
                <span
                  className={`text-sm font-semibold ${
                    isLow ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  {i.qty} {isLow && <span className="ml-1 text-xs">(Low!)</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employees */}
      <div className="bg-white border-l-4 border-blue-500 rounded-xl shadow p-4 flex flex-col w-full">
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


function CropsPage({ crops }) {
  const [cropStatuses, setCropStatuses] = useState(
    crops.reduce((acc, crop) => {
      acc[crop.id] = crop.status;
      return acc;
    }, {})
  );

  const growthStages = [
    "Seed",
    "Germination",
    "Vegetative",
    "Flowering",
    "Harvest",
  ];

  const handleStatusChange = (id, newStatus) => {
    setCropStatuses((prev) => ({
      ...prev,
      [id]: newStatus,
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-xl mb-4">Crops</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {crops.map((c) => (
          <div
            key={c.id}
            className="bg-green-100 rounded-lg shadow p-4 flex flex-col justify-between items-center h-44"
          >
            <h4 className="font-semibold text-lg mb-2">{c.name}</h4>
            <p className="text-gray-700 mb-2">Growth: {c.growth}%</p>
            <select
              value={cropStatuses[c.id]}
              onChange={(e) => handleStatusChange(c.id, e.target.value)}
              className="border rounded px-2 py-1 text-gray-700"
            >
              {growthStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}



function TasksPage({ tasks }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-xl mb-4">Tasks</h3>
      {tasks.map((t) => (
        <p key={t.id} className="text-gray-700 mb-2">
          {t.task} — {t.due_date}
        </p>
      ))}
    </div>
  );
}

function InventoryPage({ inventory }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-xl mb-4">Inventory</h3>
      {inventory.map((i) => (
        <p key={i.id} className="text-gray-700 mb-2">
          {i.item}: {i.qty}
        </p>
      ))}
    </div>
  );
}

function EmployeesPage({ employees }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-xl mb-4">Employees</h3>
      {employees.map((e) => (
        <p key={e.id} className="text-gray-700 mb-2">
          {e.name} — {e.role}
        </p>
      ))}
    </div>
  );
}


function PageHeader() {
  const location = useLocation();

  // Optional mapping for nicer titles
  const titles = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/crops": "Crops",
    "/inventory": "Inventory",
    "/tasks": "Tasks",
    "/employees": "Employees",
  };

  // Fallback: dynamically generate title from path
  const dynamicTitle =
    location.pathname === "/"
      ? "Dashboard"
      : location.pathname.slice(1).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <h1 className="text-4xl font-bold text-center p-6 text-purple-600">
      {titles[location.pathname] || dynamicTitle}
    </h1>
  );
}

function App() {

    // remove the dummy arrays here
    // const crops = [...]
    // const tasks = [...]
    // etc.

    
      const [crops, setCrops] = useState([]);
      const [tasks, setTasks] = useState([]);
      const [inventory, setInventory] = useState([]);
      const [employees, setEmployees] = useState([]);

      // fetch data when app loads
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


  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
 return (
    <Router>
      <div className="w-screen h-screen flex bg-purple-100 rounded-xl overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "w-64" : "w-0"
          } bg-purple-800 text-white flex flex-col transition-all duration-300 overflow-hidden`}
        >
          <h1 className="text-2xl font-bold p-6 border-b border-purple-700">
            Farm Dashboard
          </h1>
          <nav className="flex-1 p-4 space-y-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${
                  isActive ? "bg-purple-600" : "hover:bg-purple-700"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/crops"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${
                  isActive ? "bg-purple-600" : "hover:bg-purple-700"
                }`
              }
            >
              Crops
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${
                  isActive ? "bg-purple-600" : "hover:bg-purple-700"
                }`
              }
            >
              Inventory
            </NavLink>
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${
                  isActive ? "bg-purple-600" : "hover:bg-purple-700"
                }`
              }
            >
              Tasks
            </NavLink>
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `block w-full text-left p-2 rounded ${
                  isActive ? "bg-purple-600" : "hover:bg-purple-700"
                }`
              }
            >
              Employees
            </NavLink>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 h-full relative overflow-y-auto">
        {/* Sidebar toggle button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1 left-1 z-10 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Page title */}
        <PageHeader />

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                crops={crops}
                tasks={tasks}
                inventory={inventory}
                employees={employees}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                crops={crops}
                tasks={tasks}
                inventory={inventory}
                employees={employees}
              />
            }
          />
          <Route path="/crops" element={<CropsPage crops={crops} />} />
          <Route path="/inventory" element={<InventoryPage inventory={inventory} />} />
          <Route path="/tasks" element={<TasksPage tasks={tasks} />} />
          <Route path="/employees" element={<EmployeesPage employees={employees} />} />
        </Routes>

      </main>
      </div>
    </Router>
  );
}


export default App;
