import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function CropsPage({ crops }) {
  const [cropStatuses, setCropStatuses] = useState({});

  // Initialize local state
  useEffect(() => {
    const initialStatuses = {};
    crops.forEach((c) => {
      initialStatuses[c.id] = c.status;
    });
    setCropStatuses(initialStatuses);
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

  const handleStatusChange = async (id, newStatus) => {
    // Optimistic UI update
    setCropStatuses((prev) => ({ ...prev, [id]: newStatus }));

    const { error } = await supabase.from("crops").update({ status: newStatus }).eq("id", id);

    if (error) {
      console.error("Error updating crop status:", error);
      // Revert if failed
      setCropStatuses((prev) => ({
        ...prev,
        [id]: crops.find((c) => c.id === id).status,
      }));
    }
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
              value={cropStatuses[c.id] || ""}
              onChange={(e) => handleStatusChange(c.id, e.target.value)}
              className="border rounded px-2 py-1 text-gray-700 w-full text-center"
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
    </div>
  );
}
