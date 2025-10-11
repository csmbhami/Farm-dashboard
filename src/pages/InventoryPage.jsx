import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAccount } from "../context/AccountContext";
import { Plus, Trash2, Minus, Plus as PlusIcon } from "lucide-react";

export default function InventoryPage({ inventory }) {
  const { accountId } = useAccount();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [updating, setUpdating] = useState({});
  const [newItem, setNewItem] = useState({
    item: "",
    qty: 0,
    unit: "kg",
  });

  const units = ["kg", "g", "litres", "ml", "units"];

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItem.item.trim()) {
      alert("Please enter an item name");
      return;
    }

    if (newItem.qty < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    setIsAdding(true);

    const { error } = await supabase.from("inventory").insert([
      {
        item: newItem.item.trim(),
        qty: newItem.qty,
        unit: newItem.unit,
        account_id: accountId,
      },
    ]);

    setIsAdding(false);

    if (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item. Please try again.");
      return;
    }

    setNewItem({ item: "", qty: 0, unit: "kg" });
    setShowAddModal(false);
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setDeleting((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      console.error("Error deleting item:", error);
      setDeleting((prev) => ({ ...prev, [id]: false }));
      alert("Failed to delete item. Please try again.");
    }
  };

  const handleAdjustQuantity = async (id, currentQty, adjustment) => {
    const newQty = Math.max(0, currentQty + adjustment);

    setUpdating((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabase
      .from("inventory")
      .update({ qty: newQty })
      .eq("id", id);

    setUpdating((prev) => ({ ...prev, [id]: false }));

    if (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity. Please try again.");
    }
  };

  const handleDirectQuantityChange = async (id, newQty) => {
    if (newQty < 0) return;

    setUpdating((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabase
      .from("inventory")
      .update({ qty: newQty })
      .eq("id", id);

    setUpdating((prev) => ({ ...prev, [id]: false }));

    if (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-xl">Inventory</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-lg mb-2">No inventory items</p>
          <p className="text-sm">Add your first item to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inventory.map((i) => {
            const isLow = i.qty < 30;
            return (
              <div
                key={i.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  isLow ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                } ${deleting[i.id] || updating[i.id] ? "opacity-50" : ""}`}
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800">{i.item}</span>
                  {isLow && (
                    <span className="ml-2 text-xs text-red-600 font-semibold">
                      ⚠️ Low Stock!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity adjustment buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustQuantity(i.id, i.qty, -10)}
                      disabled={updating[i.id] || deleting[i.id]}
                      className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Decrease by 10"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <input
                      type="number"
                      value={i.qty}
                      onChange={(e) => handleDirectQuantityChange(i.id, parseFloat(e.target.value) || 0)}
                      disabled={updating[i.id] || deleting[i.id]}
                      className={`w-20 text-center text-sm font-semibold border rounded px-2 py-1 ${
                        isLow ? "text-red-600 border-red-300" : "text-gray-700 border-gray-300"
                      } disabled:opacity-50`}
                    />
                    
                    <span className="text-sm text-gray-600 min-w-[40px]">{i.unit}</span>
                    
                    <button
                      onClick={() => handleAdjustQuantity(i.id, i.qty, 10)}
                      disabled={updating[i.id] || deleting[i.id]}
                      className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Increase by 10"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteItem(i.id)}
                    disabled={deleting[i.id] || updating[i.id]}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Inventory Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.item}
                  onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Fertilizer, Seeds, Water"
                  autoFocus
                />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewItem({ item: "", qty: 0, unit: "kg" });
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
                  {isAdding ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}