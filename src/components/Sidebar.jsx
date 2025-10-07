import { NavLink } from "react-router-dom";
import { useLogout } from '../hooks/useLogout';

export default function Sidebar({ isOpen, user }) {
  const { logout, isLoggingOut } = useLogout();
  
  if (!user) return null;

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-0"
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

      <div className="p-4 border-t border-purple-700">
        <button
          onClick={logout}
          disabled={isLoggingOut}
          className="w-full p-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}