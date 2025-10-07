import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAccount } from "../context/AccountContext";
import { Plus, Trash2 } from "lucide-react";

export default function CropsPage({ crops }) {
  const { accountId } = useAccount();
  const [cropStatuses, setCropStatuses] = useState({});
  const [cropGrowth, setCropGrowth] = useState({});
  const [updating, setUpdating] = useState({});
  const [deleting, setDeleting] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCrop, setNewCrop] = useState({
    name: "",
    status: "Planted",
    growth: 0,
  });

  // Initialize local state
  useEffect(() => {
    const initialStatuses = {};
    const initialGrowth = {};
    crops.forEach((c) => {
      initialStatuses[c.id] = c.status;
      initialGrowth[c.id] = c.growth;
    });
    setCropStatuses(initialStatuses);
    setCropGrowth(initialGrowth);
  }, [crops]);

  const farmStages = [
    "Planted",
    "Germinated",
    "Growing",
    "Flowering",
    "Fruiting",
    "Ready to Harvest",
    "Harvested",
  ];

  // Auto-calculate growth percentage based on stage
  const getGrowthFromStatus = (status) => {
    const growthMap = {
      'Planted': 5,
      'Germinated': 15,
      'Growing': 40,
      'Flowering': 60,
      'Fruiting': 80,
      'Ready to Harvest': 95,
      'Harvested': 100,
    };
    return growthMap[status] || 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planted': 'bg-yellow-100 border-yellow-300',
      'Germinated': 'bg-green-50 border-green-200',
      'Growing': 'bg-green-100 border-green-300',
      'Flowering': 'bg-purple-100 border-purple-300',
      'Fruiting': 'bg-orange-100 border-orange-300',
      'Ready to Harvest': 'bg-blue-100 border-blue-300',
      'Harvested': 'bg-gray-100 border-gray-300',
    };
    return colors[status] || 'bg-green-100 border-green-300';
  };

  const handleStatusChange = async (id, newStatus) => {
    // Calculate new growth percentage
    const newGrowth = getGrowthFromStatus(newStatus);

    // Optimistic UI update - update both status and growth immediately
    setCropStatuses((prev) => ({ ...prev, [id]: newStatus }));
    setCropGrowth((prev) => ({ ...prev, [id]: newGrowth }));
    setUpdating((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabase
      .from("crops")
      .update({ 
        status: newStatus,
        growth: newGrowth 
      })
      .eq("id", id);

    setUpdating((prev) => ({ ...prev, [id]: false }));

    if (error) {
      console.error("Error updating crop status:", error);
      // Revert if failed
      const originalCrop = crops.find((c) => c.id === id);
      setCropStatuses((prev) => ({ ...prev, [id]: originalCrop.status }));
      setCropGrowth((prev) => ({ ...prev, [id]: originalCrop.growth }));
    }
  };

  const handleDeleteCrop = async (id) => {
    if (!confirm("Are you sure you want to delete this crop?")) return;

    setDeleting((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabase.from("crops").delete().eq("id", id);

    if (error) {
      console.error("Error deleting crop:", error);
      setDeleting((prev) => ({ ...prev, [id]: false }));
      alert("Failed to delete crop. Please try again.");
    }
    // Note: The crop will disappear from the UI when App.jsx refetches data
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    
    if (!newCrop.name.trim()) {
      alert("Please enter a crop name");
      return;
    }

    setIsAdding(true);

    // Auto-calculate growth from status
    const calculatedGrowth = getGrowthFromStatus(newCrop.status);

    const { error } = await supabase.from("crops").insert([
      {
        name: newCrop.name.trim(),
        status: newCrop.status,
        growth: calculatedGrowth,
        account_id: accountId,
      },
    ]);

    setIsAdding(false);

    if (error) {
      console.error("Error adding crop:", error);
      alert("Failed to add crop. Please try again.");
      return;
    }

    // Reset form and close modal
    setNewCrop({ name: "", status: "Planted", growth: 0 });
    setShowAddModal(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-xl">Crops</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Crop
        </button>
      </div>

      {crops.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-lg mb-2">No crops yet</p>
          <p className="text-sm">Add your first crop to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {crops.map((c) => (
            <div
              key={c.id}
              className={`${getStatusColor(cropStatuses[c.id])} rounded-lg shadow p-4 flex flex-col justify-between border-2 transition-all ${
                deleting[c.id] ? 'opacity-50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-lg">{c.name}</h4>
                <button
                  onClick={() => handleDeleteCrop(c.id)}
                  disabled={deleting[c.id]}
                  className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                  title="Delete crop"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Growth</span>
                  <span>{cropGrowth[c.id] ?? c.growth}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${cropGrowth[c.id] ?? c.growth}%` }}
                  ></div>
                </div>
              </div>

              <select
                value={cropStatuses[c.id] || ""}
                onChange={(e) => handleStatusChange(c.id, e.target.value)}
                disabled={updating[c.id] || deleting[c.id]}
                className={`border rounded px-2 py-1 text-gray-700 w-full text-center ${
                  updating[c.id] ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {farmStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Add Crop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Crop</h3>
            <form onSubmit={handleAddCrop}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Name *
                </label>
                <input
                  type="text"
                  value={newCrop.name}
                  onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Tomatoes"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Status
                </label>
                <select
                  value={newCrop.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setNewCrop({ 
                      ...newCrop, 
                      status: newStatus,
                      growth: getGrowthFromStatus(newStatus)
                    });
                  }}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {farmStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Growth will be set to {getGrowthFromStatus(newCrop.status)}% automatically
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Growth Preview: {getGrowthFromStatus(newCrop.status)}%
                </label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${getGrowthFromStatus(newCrop.status)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCrop({ name: "", status: "Planted", growth: 0 });
                  }}
                  disabled={isAdding}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isAdding ? 'Adding...' : 'Add Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}