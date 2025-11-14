import { useState, useEffect } from 'react';
import { useRoomContext } from '../../contexts/RoomContext';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import RoomList from '../../components/rooms/RoomList';
import RoomForm from '../../components/rooms/RoomForm';

export default function RoomsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    building: '',
    status: '' as '' | 'available' | 'occupied' | 'maintenance'
  });
  const { rooms, loading, error, fetchRooms } = useRoomContext();

  // Initial fetch
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Fetch when filters change
  useEffect(() => {
    fetchRooms(filters.building || filters.status ? filters : undefined);
  }, [fetchRooms, filters]);

  const buildings = Array.from(new Set((rooms || []).map(room => room.building))).sort();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Room Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all rooms including their name, building, capacity, and current status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Room
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 sm:flex sm:items-center sm:space-x-4">
        <div className="relative mt-2 rounded-md shadow-sm">
          <select
            value={filters.building}
            onChange={(e) => setFilters(prev => ({ ...prev, building: e.target.value }))}
            className="h-full rounded-md border-0 bg-transparent py-2 pl-3 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
          >
            <option value="">All Buildings</option>
            {buildings.map((building) => (
              <option key={building} value={building}>
                {building}
              </option>
            ))}
          </select>
        </div>

        <div className="relative mt-2 rounded-md shadow-sm">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="h-full rounded-md border-0 bg-transparent py-2 pl-3 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setFilters({ building: '', status: '' })}
          className="mt-2 inline-flex items-center text-sm text-gray-500 hover:text-primary"
        >
          <FunnelIcon className="mr-1.5 h-4 w-4" />
          Clear filters
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Room List */}
      <div className="mt-8 flex flex-col">
        <RoomList rooms={rooms} loading={loading} />
      </div>

      {/* Create/Edit Room Modal */}
      <RoomForm
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}