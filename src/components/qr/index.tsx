import { useEffect, useRef, useState } from 'react';
import * as QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
import { toast } from 'react-hot-toast';

interface QRGeneratorProps {
  data: string;
  scale?: number;
  className?: string;
  color?: string;
}

export const QRGenerator = ({ data, scale = 8, className = '', color = '#297A20' }: QRGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const generateQR = async () => {
      try {
        await QRCode.toCanvas(canvasRef.current, data, {
          width: scale * 32,
          margin: 2,
          color: {
            dark: color,
            light: '#FFFFFF'
          }
        });
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      }
    };

    generateQR();
  }, [data, scale, color]);

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Failed to generate QR code: {error}
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
};

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const QRScanner = ({ onScan, onError, className = '' }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const startScanner = async () => {
      if (!videoRef.current) return;

      try {
        // Create QR Scanner instance
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR code found:', result.data);
            toast.success('QR Code scanned!');
            onScan(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        // Start scanning
        await qrScannerRef.current.start();
        setIsScanning(true);
        setError(null);

        // Log available cameras
        const cameras = await QrScanner.listCameras();
        console.log('Available cameras:', cameras);

      } catch (err) {
        console.error('Scanner error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to start scanner';
        setError(errorMessage);
        if (onError) onError(new Error(errorMessage));
      }
    };

    startScanner();

    // Cleanup
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [onScan, onError]);

  const handleRetry = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setError(null);
    setIsScanning(false);
    window.location.reload();
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Retry Camera Access
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full max-w-md mx-auto rounded-lg shadow-lg"
      />
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-primary animate-pulse rounded-lg" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary-light rounded-lg" />
        </div>
      )}
    </div>
  );
};