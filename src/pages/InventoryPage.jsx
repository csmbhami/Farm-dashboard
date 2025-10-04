export default function InventoryPage({ inventory }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-xl mb-4">Inventory</h3>
      <div className="flex flex-col space-y-2">
        {inventory.length > 0 ? (
          inventory.map((i) => {
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
          })
        ) : (
          <p className="text-gray-500">No inventory items found.</p>
        )}
      </div>
    </div>
  );
}
