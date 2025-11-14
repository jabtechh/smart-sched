import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomContext } from '../../contexts/RoomContext';
import type { Room } from '../../types/room';
import RoomForm from '../../components/rooms/RoomForm';

export default function AdminRoomEditPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { getRoom } = useRoomContext();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) {
        setError('Room ID is required');
        return;
      }

      try {
        const roomData = await getRoom(roomId);
        setRoom(roomData);
      } catch (err) {
        console.error('Error loading room:', err);
        setError(err instanceof Error ? err.message : 'Failed to load room');
      }
    };

    loadRoom();
  }, [roomId, getRoom]);

  const handleClose = () => {
    navigate('/admin/rooms');
  };

  if (error) {
    return (
      <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
        {error}
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <RoomForm open={true} onClose={handleClose} room={room} />;
}