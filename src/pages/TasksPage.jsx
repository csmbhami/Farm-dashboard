import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAccount } from "../context/AccountContext";
import { Plus, Trash2, CheckCircle2, Circle, User } from "lucide-react";

export default function TasksPage({ tasks, employees }) {
  const { accountId } = useAccount();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [updating, setUpdating] = useState({});
  const [localCompletedStatus, setLocalCompletedStatus] = useState({});
  const [newTask, setNewTask] = useState({
    task: "",
    due_date: "",
    notes: "",
    assigned_to: null,
    completed: false,
  });

  // Sync local completed status with props
  useEffect(() => {
    const statuses = {};
    tasks.forEach((task) => {
      statuses[task.id] = task.completed || false;
    });
    setLocalCompletedStatus(statuses);
  }, [tasks]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.task.trim()) {
      alert("Please enter a task description");
      return;
    }

    setIsAdding(true);

    const { error } = await supabase.from("tasks").insert([
      {
        task: newTask.task.trim(),
        due_date: newTask.due_date || null,
        notes: newTask.notes.trim() || null,
        assigned_to: newTask.assigned_to || null,
        completed: false,
        account_id: accountId,
      },
    ]);

    setIsAdding(false);

    if (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task. Please try again.");
      return;
    }

    setNewTask({ task: "", due_date: "", notes: "", assigned_to: null, completed: false });
    setShowAddModal(false);
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setDeleting((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      setDeleting((prev) => ({ ...prev, [id]: false }));
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleToggleComplete = async (id, currentStatus) => {
    const newStatus = !currentStatus;

    // Optimistic update
    setLocalCompletedStatus((prev) => ({ ...prev, [id]: newStatus }));
    setUpdating((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabase
      .from("tasks")
      .update({ completed: newStatus })
      .eq("id", id);

    setUpdating((prev) => ({ ...prev, [id]: false }));

    if (error) {
      console.error("Error updating task:", error);
      // Revert on error
      setLocalCompletedStatus((prev) => ({ ...prev, [id]: currentStatus }));
      alert("Failed to update task. Please try again.");
    }
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return "Unassigned";
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.name || "Unknown";
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isToday = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-xl">Tasks</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg mb-2">No tasks yet</p>
          <p className="text-sm">Add your first task to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isCompleted = localCompletedStatus[task.id] || false;
            const overdue = isOverdue(task.due_date);
            const today = isToday(task.due_date);

            return (
              <div
                key={task.id}
                className={`flex items-start gap-4 p-4 border rounded-lg transition-all ${
                  isCompleted
                    ? "bg-green-50 border-green-200"
                    : overdue
                    ? "bg-red-50 border-red-200"
                    : today
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-gray-50 border-gray-200"
                } ${deleting[task.id] ? "opacity-50" : ""}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task.id, isCompleted)}
                  disabled={updating[task.id] || deleting[task.id]}
                  className="mt-1 flex-shrink-0 disabled:opacity-50"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  )}
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          isCompleted ? "line-through text-gray-500" : "text-gray-800"
                        }`}
                      >
                        {task.task}
                      </p>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deleting[task.id]}
                      className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Meta information */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                    {/* Assigned employee */}
                    <div className="flex items-center gap-1 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{getEmployeeName(task.assigned_to)}</span>
                    </div>

                    {/* Due date */}
                    {task.due_date && (
                      <div
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isCompleted
                            ? "bg-gray-200 text-gray-600"
                            : overdue
                            ? "bg-red-200 text-red-800"
                            : today
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {overdue && "⚠️ "}
                        {today && "📅 "}
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Description *
                </label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Water tomato field"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  value={newTask.assigned_to || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, assigned_to: e.target.value || null })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
                  placeholder="Add any additional details..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewTask({ task: "", due_date: "", notes: "", assigned_to: null, completed: false });
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
                  {isAdding ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}