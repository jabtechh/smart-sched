import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomContext } from '@/contexts/RoomContext';
import * as QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Room } from '../../types/room';

export default function RoomQRPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { roomId } = useParams<{ roomId: string }>();
  const { getRoom } = useRoomContext();
  const [room, setRoom] = useState<Room | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const downloadAsPDF = async () => {
    if (!contentRef.current || !room) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      // Calculate dimensions that will fit on the page with margins
      const margin = 20; // 20mm margins
      const maxWidth = pdfWidth - (2 * margin);
      const maxHeight = pdfHeight - (2 * margin);
      
      // Calculate the scaling ratio while preserving aspect ratio
      const scaleRatio = Math.min(
        maxWidth / imgWidth,
        maxHeight / imgHeight,
        0.8 // Maximum scale of 80% to ensure everything fits
      );
      
      // Calculate dimensions of the scaled image
      const scaledWidth = imgWidth * scaleRatio;
      const scaledHeight = imgHeight * scaleRatio;
      
      // Center the image on the page
      const imgX = (pdfWidth - scaledWidth) / 2;
      const imgY = (pdfHeight - scaledHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, scaledWidth, scaledHeight);
      pdf.save(`room-${room.name}-qr.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    }
  };

  useEffect(() => {
    const loadRoomAndGenerateQR = async () => {
      if (!roomId) {
        setError('Room ID is required');
        return;
      }

      try {
        setLoading(true);
        // Load room data
        const roomData = await getRoom(roomId);
        setRoom(roomData);
        
        // Generate QR code as data URL with room- prefix
        const qrDataUrl = await QRCode.toDataURL(`room-${roomId}`, {
          width: 300,
          margin: 2,
          color: {
            dark: '#297A20',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    loadRoomAndGenerateQR();
  }, [roomId, getRoom]);

  if (error) {
    return (
      <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            {/* Content for PDF generation */}
            <div ref={contentRef} className="bg-white p-8 rounded-lg" style={{ width: '400px', margin: '0 auto' }}>
              <div className="flex flex-col items-center space-y-6">
                <h2 className="text-2xl font-bold text-center text-gray-900">
                  Room QR Code
                </h2>
                
                {room && (
                  <div className="text-center">
                    <p className="text-xl font-semibold text-gray-700 mb-1">
                      {room.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {room.building}, Floor {room.floor}
                    </p>
                  </div>
                )}

                <div className="flex flex-col items-center w-full">
                  {qrCodeUrl && (
                    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                      <img
                        src={qrCodeUrl}
                        alt="Room QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                  )}
                  <div className="w-full text-center border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500">
                      Scan this QR code to check in to this room
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download button outside of the content to be captured */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={downloadAsPDF}
                className="inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};