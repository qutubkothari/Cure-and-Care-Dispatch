import { X, Filter as FilterIcon } from 'lucide-react';

interface FilterModalProps {
  filters: {
    status: string;
    driverId: string;
    dateFrom: string;
    dateTo: string;
    priority: string;
  };
  drivers: { id: string; name: string }[];
  onClose: () => void;
  onApply: (filters: any) => void;
  onClear: () => void;
}

function FilterModal({ filters, drivers, onClose, onApply, onClear }: FilterModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFilters = {
      status: formData.get('status') as string,
      driverId: formData.get('driverId') as string,
      dateFrom: formData.get('dateFrom') as string,
      dateTo: formData.get('dateTo') as string,
      priority: formData.get('priority') as string
    };
    onApply(newFilters);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FilterIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Filter Deliveries</h2>
              {activeFilterCount > 0 && (
                <p className="text-sm text-primary-600">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Status
            </label>
            <select
              name="status"
              defaultValue={filters.status}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Driver Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Driver
            </label>
            <select
              name="driverId"
              defaultValue={filters.driverId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Drivers</option>
              <option value="unassigned">Unassigned</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              name="priority"
              defaultValue={filters.priority}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                name="dateFrom"
                defaultValue={filters.dateFrom}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                name="dateTo"
                defaultValue={filters.dateTo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Clear All
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FilterModal;
