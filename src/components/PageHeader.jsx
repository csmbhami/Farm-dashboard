import { useLocation } from "react-router-dom";

export default function PageHeader() {
  const location = useLocation();
  const titles = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/crops": "Crops",
    "/inventory": "Inventory",
    "/tasks": "Tasks",
    "/employees": "Employees",
    "/login": "Login",
    "/register": "Register",
  };
  return (
    <h1 className="text-4xl font-bold text-center p-6 text-purple-600">
      {titles[location.pathname] || "Farm Dashboard"}
    </h1>
  );
}
