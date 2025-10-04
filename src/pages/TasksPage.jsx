export default function TasksPage({ tasks }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-xl mb-4">Tasks</h3>
      <div className="flex flex-col space-y-2">
        {tasks.length > 0 ? (
          tasks.map((t) => (
            <div
              key={t.id}
              className="flex justify-between items-center p-2 border rounded-md bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-800">{t.task}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                {t.due_date}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No tasks found.</p>
        )}
      </div>
    </div>
  );
}
