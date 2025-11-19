import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAccount } from "../context/AccountContext";
import { Plus, Trash2, Edit2, X, Save } from "lucide-react";

export default function EmployeesPage({ employees }) {
  const { accountId } = useAccount();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [updating, setUpdating] = useState({});
  const [hiddenEmployees, setHiddenEmployees] = useState(new Set());
  const [editForm, setEditForm] = useState({ name: "", role: "" });
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
  });

  // Filter out hidden (deleted) employees
  const visibleEmployees = employees.filter(emp => !hiddenEmployees.has(emp.id));

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    if (!newEmployee.name.trim()) {
      alert("Please enter an employee name");
      return;
    }

    if (!newEmployee.role.trim()) {
      alert("Please enter a role");
      return;
    }

    setIsAdding(true);

    const { error } = await supabase.from("employees").insert([
      {
        name: newEmployee.name.trim(),
        role: newEmployee.role.trim(),
        account_id: accountId,
      },
    ]);

    setIsAdding(false);

    if (error) {
      console.error("Error adding employee:", error);
      alert("Failed to add employee. Please try again.");
      return;
    }

    setNewEmployee({ name: "", role: "" });
    setShowAddModal(false);
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    // Optimistic delete - hide immediately
    setHiddenEmployees((prev) => new Set([...prev, id]));
    setDeleting((prev) => ({ ...prev, [id]: true }));

    console.log('[Delete] Attempting to delete employee:', id);
    const { data, error } = await supabase.from("employees").delete().eq("id", id);

    console.log('[Delete] Result:', { data, error });

    if (error) {
      console.error("Error deleting employee:", error);
      // Revert on error - show the employee again
      setHiddenEmployees((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setDeleting((prev) => ({ ...prev, [id]: false }));
      alert(`Failed to delete employee: ${error.message}`);
    } else {
      console.log('[Delete] Success!');
      setDeleting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const startEditing = (employee) => {
    setEditingId(employee.id);
    setEditForm({ name: employee.name, role: employee.role });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: "", role: "" });
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.name.trim() || !editForm.role.trim()) {
      alert("Name and role cannot be empty");
      return;
    }

    setUpdating((prev) => ({ ...prev, [id]: true }));

    console.log('[Update] Attempting to update employee:', id);
    const { data, error } = await supabase
      .from("employees")
      .update({
        name: editForm.name.trim(),
        role: editForm.role.trim(),
      })
      .eq("id", id);

    console.log('[Update] Result:', { data, error });

    setUpdating((prev) => ({ ...prev, [id]: false }));

    if (error) {
      console.error("Error updating employee:", error);
      alert(`Failed to update employee: ${error.message}`);
    } else {
      console.log('[Update] Success!');
      setEditingId(null);
      setEditForm({ name: "", role: "" });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-xl">Employees</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-lg mb-2">No employees yet</p>
          <p className="text-sm">Add your first employee to get started!</p>
        </div>
      ) : visibleEmployees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-lg mb-2">All employees removed</p>
          <p className="text-sm">Add new employees to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleEmployees.map((emp) => {
            const isEditing = editingId === emp.id;

            return (
              <div
                key={emp.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  deleting[emp.id] ? "opacity-50 bg-gray-50" : "bg-gray-50 border-gray-200"
                }`}
              >
                {isEditing ? (
                  // Edit mode
                  <>
                    <div className="flex-1 flex gap-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="flex-1 border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Name"
                        disabled={updating[emp.id]}
                      />
                      <input
                        type="text"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="flex-1 border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Role"
                        disabled={updating[emp.id]}
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => handleSaveEdit(emp.id)}
                        disabled={updating[emp.id]}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={updating[emp.id]}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  // View mode
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(emp)}
                        disabled={deleting[emp.id]}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                        title="Edit employee"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        disabled={deleting[emp.id]}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Employee</h3>
            <form onSubmit={handleAddEmployee}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., John Smith"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <input
                  type="text"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Farm Manager, Field Worker"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmployee({ name: "", role: "" });
                  }}
                  disabled={isAdding}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isAdding ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}