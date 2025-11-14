import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { toast } from "react-hot-toast";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const QRScanner = ({ onScan, onError, className = "" }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const startScanner = async () => {
      if (!videoRef.current) return;

      try {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result: QrScanner.ScanResult) => {
            console.log("QR code found:", result.data);
            onScan(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        await qrScannerRef.current.start();
        setIsScanning(true);
        setError(null);

        const cameras = await QrScanner.listCameras();
        console.log("Available cameras:", cameras);
      } catch (error: unknown) {
        console.error("Scanner error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to start scanner";
        setError(errorMessage);
        if (onError) onError(new Error(errorMessage));
      }
    };

    startScanner();

    return () => {
      console.log('Cleaning up QR scanner');
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop();
          qrScannerRef.current.destroy();
          qrScannerRef.current = null;
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
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

export default QRScanner;
