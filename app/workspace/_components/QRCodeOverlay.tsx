"use client";

import { useUI } from "./ui-context";
import QRCodeScanner from "./QRCodeScanner";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function QRCodeOverlay() {
    const { mode, setMode, setScannedInput } = useUI();
    const router = useRouter();
    const pathname = usePathname();

    if (mode !== "scan-qr") return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4 text-center">Scan QR Code</h2>
                <QRCodeScanner
                    onScanSuccess={(result) => {
                        // Set the scanned input globally
                        setScannedInput(result);
                        // End scanning mode
                        setMode("idle");

                        // Navigate to chat if not already there
                        if (!pathname.includes("/workspace/chat")) {
                            router.push("/workspace/chat");
                        }
                    }}
                />
                <button
                    onClick={() => setMode("idle")}
                    className="mt-6 px-4 py-2 border rounded-full hover:bg-gray-100 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
