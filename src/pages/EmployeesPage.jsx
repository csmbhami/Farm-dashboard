export default function EmployeesPage({ employees }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-xl mb-4">Employees</h3>
      <div className="flex flex-col space-y-2">
        {employees.length > 0 ? (
          employees.map((e) => (
            <p key={e.id} className="text-sm font-medium text-gray-800">
              {e.name} <span className="text-xs text-gray-500">— {e.role}</span>
            </p>
          ))
        ) : (
          <p className="text-gray-500">No employees found.</p>
        )}
      </div>
    </div>
  );
}
