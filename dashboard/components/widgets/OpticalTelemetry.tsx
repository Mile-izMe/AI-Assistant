/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom"; // <-- Thêm import createPortal
import { useHandTracking } from "@/hooks/useHandTracking";

export default function OpticalTelemetry() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handState = useHandTracking(videoRef);

  // Khai báo state để kiểm tra client-side (bắt buộc khi dùng Portal trong Next.js)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <>
      <div className="relative w-full h-full rounded-xl bg-slate-900 border border-cyan-500/20 overflow-hidden flex items-center justify-center shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-80 -scale-x-100"
          style={{ filter: "contrast(1.1) brightness(1.1) grayscale(0.2)" }}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400/40"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400/40"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400/40"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400/40"></div>
        </div>
      </div>

      {/* --- DÙNG PORTAL ĐỂ ĐƯA CON TRỎ RA NGOÀI --- */}
      {mounted &&
        handState.isActive &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[9999] transition-transform duration-75"
            style={{
              left: `${handState.x}px`,
              top: `${handState.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className={`
            flex items-center justify-center rounded-full border-2 
            transition-all duration-150 ease-out shadow-[0_0_15px_rgba(34,211,238,0.5)]
            ${
              handState.isPinching
                ? "w-4 h-4 bg-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] scale-75"
                : "w-8 h-8 bg-cyan-400/20 border-cyan-400"
            }
          `}
            >
              <div
                className={`w-1 h-1 rounded-full ${handState.isPinching ? "bg-white" : "bg-cyan-400"}`}
              ></div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
