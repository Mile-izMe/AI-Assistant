"use client";
import React, { useEffect } from "react";
import { Send } from "lucide-react";
import { Dialogue } from "@/types/jarvis";

interface NeuralTelemetryProps {
  isJarvisTalking: boolean;
  isListening: boolean;
  isSystemWorking: boolean;
  dialogues: Dialogue[];
  inputText: string;
  setInputText: (text: string) => void;
  processCommand: (cmd: string) => void;
  voiceCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function NeuralTelemetry({
  isJarvisTalking,
  isListening,
  isSystemWorking,
  dialogues,
  inputText,
  setInputText,
  processCommand,
  voiceCanvasRef,
}: NeuralTelemetryProps) {
  useEffect(() => {
    const canvas = voiceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      let amplitudeMultiplier = 8;
      if (isJarvisTalking) amplitudeMultiplier = 24;
      else if (isListening) amplitudeMultiplier = 35;
      else if (isSystemWorking) amplitudeMultiplier = 16;

      const waveColors = [
        "rgba(6, 182, 212, 0.8)",
        "rgba(99, 102, 241, 0.65)",
        "rgba(168, 85, 247, 0.5)",
      ];

      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = waveColors[i];
        ctx.lineWidth = i === 0 ? 2 : 1;
        const frequency = 0.007 + i * 0.003;
        const currentAmp = amplitudeMultiplier * (1 - i * 0.25);

        for (let x = 0; x < w; x++) {
          const mask = Math.pow(Math.sin((x / w) * Math.PI), 2);
          const y =
            midY +
            Math.sin(x * frequency + phase + i) * currentAmp * mask +
            Math.cos(x * frequency * 0.4 - phase) * (currentAmp * 0.2) * mask;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      phase += 0.15;
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isJarvisTalking, isListening, isSystemWorking, voiceCanvasRef]);

  return (
    <div className="flex-1 flex flex-col justify-between gap-3.5 min-h-0">
      <div className="flex items-center gap-4 min-h-0">
        <div className="w-[180px] h-14 bg-slate-950/50 border border-white/10 rounded-xl overflow-hidden relative shadow-inner">
          <canvas
            ref={voiceCanvasRef}
            width={180}
            height={56}
            className="w-full h-full"
          />
          <div className="absolute top-1 left-2 font-mono text-[6.5px] text-slate-400 tracking-[0.2em] uppercase font-bold">
            {isJarvisTalking
              ? "SPEAKING"
              : isListening
                ? "LISTENING"
                : "AMBIENT FEED"}
          </div>
        </div>

        <div className="flex-1 h-14 bg-slate-950/30 border border-white/10 rounded-xl p-2 font-mono text-[9px] overflow-y-auto flex flex-col gap-1.5 pr-1.5">
          {dialogues.map((log, index) => (
            <div
              key={index}
              className={`flex items-start gap-1.5 leading-relaxed ${log.sender === "jarvis" ? "text-cyan-400" : "text-slate-300"}`}
            >
              <span className="opacity-30">[{log.timestamp}]</span>
              <span className="font-bold tracking-wide uppercase">
                {log.sender === "jarvis" ? "JARVIS:" : "USER:"}
              </span>
              <span className="font-sans text-[10px]">{log.text}</span>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          processCommand(inputText);
        }}
        className="flex items-center gap-2 border border-white/10 rounded-xl overflow-hidden bg-slate-950/40 p-1 backdrop-blur-md"
      >
        <input
          type="text"
          placeholder="Submit neural text query to core system..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-transparent border-0 px-3 py-1.5 font-sans text-xs focus:ring-0 focus:outline-none text-slate-100 placeholder-slate-500"
        />
        <button
          type="submit"
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition duration-150 shadow-[0_0_12px_rgba(79,70,229,0.3)] hover:shadow-[0_0_15px_rgba(79,70,229,0.5)] cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
