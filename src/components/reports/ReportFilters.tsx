import { useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { format, subDays } from 'date-fns';

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  selectedRooms: string[];
}

interface ReportFiltersProps {
  rooms: Array<{ id: string; name: string }>;
  onFilterChange: (filters: ReportFilters) => void;
}

export default function ReportFilters({ rooms, onFilterChange }: ReportFiltersProps) {
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: thirtyDaysAgo,
    endDate: today,
    selectedRooms: []
  });

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = new Date(value);
    const newFilters = { ...filters, [field]: date };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRoomToggle = (roomId: string) => {
    const newRooms = filters.selectedRooms.includes(roomId)
      ? filters.selectedRooms.filter(id => id !== roomId)
      : [...filters.selectedRooms, roomId];
    const newFilters = { ...filters, selectedRooms: newRooms };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePreset = (preset: 'today' | 'week' | 'month') => {
    let startDate = today;
    switch (preset) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subDays(today, 30);
        break;
    }
    const newFilters = { ...filters, startDate, endDate: today };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FunnelIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={format(filters.startDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            value={format(filters.endDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => handlePreset('today')}
          className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          Today
        </button>
        <button
          onClick={() => handlePreset('week')}
          className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          Last 7 Days
        </button>
        <button
          onClick={() => handlePreset('month')}
          className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
        >
          Last 30 Days
        </button>
      </div>

      {/* Room Selection */}
      {rooms.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Rooms</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {rooms.map(room => (
              <label key={room.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.selectedRooms.includes(room.id)}
                  onChange={() => handleRoomToggle(room.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{room.name}</span>
              </label>
            ))}
          </div>
          {filters.selectedRooms.length > 0 && (
            <button
              onClick={() => {
                const newFilters = { ...filters, selectedRooms: [] };
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear room selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
