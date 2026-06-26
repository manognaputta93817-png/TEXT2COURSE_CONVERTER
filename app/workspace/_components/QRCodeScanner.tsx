"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

type Props = {
  onScanSuccess: (decodedText: string) => void;
};

export default function QRCodeScanner({ onScanSuccess }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      const element = document.getElementById("qr-reader");
      if (!element) return;

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices.length || !isMounted) return;

        await scanner.start(
          devices[0].id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (!isMounted) return;

            onScanSuccess(decodedText);

            if (isRunningRef.current) {
              scanner.stop().catch(() => { });
              isRunningRef.current = false;
            }
          },
          (errorMessage) => {
            // ignore constant scan errors
          }
        );

        isRunningRef.current = true;
      } catch (err: any) {
        console.error("QR Scanner error:", err);

        if (
          err?.name === "NotAllowedError" ||
          err?.message?.toLowerCase().includes("denied")
        ) {
          setPermissionDenied(true);
        }
      }
    };

    // Delay ensures DOM is mounted (important for Next.js)
    const timeout = setTimeout(startScanner, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);

      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => { });
        isRunningRef.current = false;
      }
    };
  }, [onScanSuccess]);

  const retryPermission = () => {
    setPermissionDenied(false);
  };

  return (
    <div className="flex justify-center">
      {permissionDenied ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-red-500">
            Camera access denied.
            <br />
            Please allow camera access in browser settings.
          </p>

          <button
            onClick={retryPermission}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div
          id="qr-reader"
          className="w-[300px] h-[300px] rounded-lg overflow-hidden"
        />
      )}
    </div>
  );
}
