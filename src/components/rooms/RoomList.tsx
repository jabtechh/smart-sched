import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import type { Room } from '../../types/room';
import { useRoomContext } from '../../contexts/RoomContext';

interface RoomListProps {
  rooms: Room[];
  loading: boolean;
}

export default function RoomList({ rooms, loading }: RoomListProps) {
  const { deleteRoom } = useRoomContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      setDeletingId(id);
      await deleteRoom(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No rooms found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Room Name
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Building
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Floor
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Capacity
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rooms.map((room) => (
            <tr key={room.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {room.name}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{room.building}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{room.floor}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{room.capacity}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    room.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : room.status === 'occupied'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {room.status}
                </span>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <div className="flex justify-end items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/admin/rooms/${room.id}/qr`}
                      className="group p-2 hover:bg-gray-100 rounded-full"
                      title="Generate QR Code"
                    >
                      <QrCodeIcon 
                        className="h-5 w-5 text-gray-500 group-hover:text-primary" 
                        aria-hidden="true" 
                      />
                    </Link>
                    <Link
                      to={`/admin/rooms/${room.id}/edit`}
                      className="group p-2 hover:bg-gray-100 rounded-full"
                      title="Edit room"
                    >
                      <PencilIcon 
                        className="h-5 w-5 text-gray-500 group-hover:text-primary" 
                        aria-hidden="true" 
                      />
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === room.id}
                      className="group p-2 hover:bg-red-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDelete(room.id)}
                      title="Delete room"
                    >
                      <TrashIcon 
                        className="h-5 w-5 text-gray-500 group-hover:text-red-600" 
                        aria-hidden="true" 
                      />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}