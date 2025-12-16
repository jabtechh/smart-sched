import { useState } from 'react';
import { QRScanner } from '@/components/qr';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '@/contexts/RoomContext';

const CheckInPage = () => {
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { checkInToRoom } = useRoomContext();

  const handleScan = async (result: string) => {
    try {
      const roomId = result;
      await checkInToRoom(roomId);
      navigate('/professor/today');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in');
    }
  };

  const handleError = (error: Error) => {
    setError(`Scanner error: ${error.message}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">
                  Scan Room QR Code
                </h2>
                
                <div className="mb-8 aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg shadow-lg">
                  <QRScanner
                    onScan={handleScan}
                    onError={handleError}
                    className="w-full h-full object-cover"
                  />
                </div>

                {error && (
                  <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    {error}
                  </div>
                )}

                <p className="mt-4 text-center text-sm text-gray-500">
                  Position the QR code within the frame to check in to a room
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;