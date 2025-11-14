import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QRGeneratorProps {
  data: string;
  scale?: number;
  className?: string;
  color?: string;
}

const QRGenerator = ({ data, scale = 8, className = "", color = "#297A20" }: QRGeneratorProps) => {
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
            light: "#FFFFFF"
          }
        });
      } catch (err) {
        console.error("Error generating QR code:", err);
        setError(err instanceof Error ? err.message : "Failed to generate QR code");
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

export default QRGenerator;
