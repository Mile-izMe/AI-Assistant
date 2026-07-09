"use client";
import React, { useState, useRef } from "react";

interface DraggableCardProps {
  id: string;
  title: string;
  x: number;
  y: number;
  width?: string;
  height?: string;
  zIndex: number;
  onDrag: (id: string, newX: number, newY: number) => void;
  onSelect: (id: string) => void;
  gridSnap: boolean;
  children: React.ReactNode;
}

export default function DraggableCard({
  id,
  title,
  x,
  y,
  width = "w-96",
  height = "h-auto",
  zIndex,
  onDrag,
  onSelect,
  gridSnap,
  children,
}: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cardStartRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    onSelect(id);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    cardStartRef.current = { x, y };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    let newX = cardStartRef.current.x + deltaX;
    let newY = cardStartRef.current.y + deltaY;

    const container = document.getElementById("dashboard-container");
    if (container && cardRef.current) {
      const parentRect = container.getBoundingClientRect();
      const cardRect = cardRef.current.getBoundingClientRect();
      const maxX = parentRect.width - cardRect.width;
      const maxY = parentRect.height - cardRect.height;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
    }

    if (gridSnap) {
      newX = Math.round(newX / 20) * 20;
      newY = Math.round(newY / 20) * 20;
    }

    onDrag(id, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: "absolute",
        transform: `translate3d(${x}px, ${y}px, 0)`,
        zIndex: zIndex,
      }}
      className={`absolute ${width} ${height} backdrop-blur-xl bg-white/5 border ${
        isDragging
          ? "border-cyan-400/50 bg-slate-950/60 shadow-[0_0_30px_rgba(34,211,238,0.35)] scale-[1.01]"
          : "border-white/10 shadow-2xl shadow-black/50"
      } rounded-2xl overflow-hidden transition-all duration-200 ease-out select-none flex flex-col`}
      onPointerDown={() => onSelect(id)}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 opacity-40">
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
          </div>
          <span className="font-display font-medium text-[10px] tracking-[0.2em] text-slate-300 uppercase">
            {title}
          </span>
        </div>
        <div className="font-mono text-[9px] text-slate-400 opacity-60">
          [{x},{y}]
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col overflow-auto min-h-0">
        {children}
      </div>
    </div>
  );
}
