import { Sprout, ClipboardList, Package, Users } from "lucide-react";

export default function DashboardPage({ crops, tasks, inventory, employees }) {
  return (
    <div className="grid grid-cols-1 gap-6 h-full w-full">
      {/* Crops */}
      <div className="bg-white border-l-4 border-green-500 rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sprout className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Crop Status</h3>
        </div>
        {crops.slice(0, 3).map((c) => (
          <div key={c.id} className="mb-2">
            <p className="font-medium">{c.name}</p>
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
            </div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="bg-white border-l-4 border-yellow-500 rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
        </div>
        {tasks.slice(0, 3).map((t) => (
          <div key={t.id} className="p-2 border rounded-md bg-gray-50 mb-2">
            <span>{t.task}</span> — <span>{t.due_date}</span>
          </div>
        ))}
      </div>

      {/* Inventory */}
      <div className="bg-white border-l-4 border-pink-500 rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-800">Inventory</h3>
        </div>
        {inventory.slice(0, 3).map((i) => (
          <p key={i.id}>
            {i.item}: {i.qty}
          </p>
        ))}
      </div>

      {/* Employees */}
      <div className="bg-white border-l-4 border-blue-500 rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Employees</h3>
        </div>
        {employees.slice(0, 3).map((e) => (
          <p key={e.id}>
            {e.name} — <span className="text-gray-600">{e.role}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
