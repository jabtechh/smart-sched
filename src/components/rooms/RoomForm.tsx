import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRoomContext } from '../../contexts/RoomContext';
import type { Room } from '../../types/room';

interface RoomFormProps {
  open: boolean;
  onClose: () => void;
  room?: Room;
}

const defaultRoom = {
  name: '',
  building: '',
  floor: '',
  capacity: 0,
  facilities: [],
  status: 'available' as const
};

export default function RoomForm({ open, onClose, room }: RoomFormProps) {
  const { createRoom, updateRoom } = useRoomContext();
  const [formData, setFormData] = useState<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>(
    room ? {
      name: room.name,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      facilities: room.facilities,
      status: room.status
    } : defaultRoom
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!room;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.building || !formData.floor) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      if (isEdit && room) {
        await updateRoom(room.id, formData);
      } else {
        await createRoom(formData);
      }
      onClose();
    } catch (err) {
      console.error('Error saving room:', err);
      setError(err instanceof Error ? err.message : 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full sm:mt-0">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {isEdit ? 'Edit Room' : 'New Room'}
                    </Dialog.Title>

                    {error && (
                      <div className="mt-2 rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Room Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="building" className="block text-sm font-medium text-gray-700">
                          Building
                        </label>
                        <input
                          type="text"
                          name="building"
                          id="building"
                          required
                          value={formData.building}
                          onChange={e => setFormData(prev => ({ ...prev, building: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                          Floor
                        </label>
                        <input
                          type="text"
                          name="floor"
                          id="floor"
                          required
                          value={formData.floor}
                          onChange={e => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                          Capacity
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          id="capacity"
                          required
                          min="1"
                          value={formData.capacity}
                          onChange={e => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          required
                          value={formData.status}
                          onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as Room['status'] }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}