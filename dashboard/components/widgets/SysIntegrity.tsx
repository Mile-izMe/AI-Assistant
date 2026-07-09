"use client";
import React from "react";
import { playCyberBeep } from "@/utils/audio";

interface SysIntegrityProps {
  cpu: number;
  ram: number;
  temp: number;
  ollamaConnected: boolean;
  toggleOllama: () => void;
  isSystemWorking: boolean;
  optimizingLabel: string;
  triggerQuickCommand: (cmd: string) => void;
  setCpu: (val: number) => void;
  setTemp: (val: number) => void;
  setIsSystemWorking: (val: boolean) => void;
  setOptimizingLabel: (val: string) => void;
}

export default function SysIntegrity({
  cpu,
  ram,
  temp,
  ollamaConnected,
  toggleOllama,
  isSystemWorking,
  optimizingLabel,
  triggerQuickCommand,
  setCpu,
  setTemp,
  setIsSystemWorking,
  setOptimizingLabel,
}: SysIntegrityProps) {
  return (
    <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
      <div className="flex items-center justify-between gap-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="38"
              className="stroke-white/10"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r="38"
              className="stroke-cyan-400 transition-all duration-300"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={
                2 * Math.PI * 38 - (cpu / 100) * (2 * Math.PI * 38)
              }
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.5))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className="text-xl font-bold text-white tracking-tighter">
              {cpu}%
            </span>
            <span className="text-[7px] text-slate-400 uppercase tracking-widest font-semibold">
              CPU LOAD
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2.5 font-mono text-xs">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400 tracking-wide">CORE TEMP:</span>
            <span
              className={`font-bold ${temp > 60 ? "text-red-400 animate-pulse" : "text-green-400"}`}
            >
              {temp}°C
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              style={{ width: `${(temp / 100) * 100}%` }}
              className={`h-full transition-all duration-300 ${temp > 60 ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" : "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"}`}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] mt-1">
            <span className="text-slate-400 tracking-wide">
              OLLAMA CLUSTER:
            </span>
            <button
              onClick={toggleOllama}
              className={`flex items-center gap-1.5 font-bold transition hover:opacity-80 ${ollamaConnected ? "text-cyan-400" : "text-slate-500"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${ollamaConnected ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" : "bg-slate-600"}`}
              />
              {ollamaConnected ? "CONNECTED" : "OFFLINE"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 font-mono text-xs mt-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-400 tracking-wide">
            ALLOCATED MEMORY (RAM):
          </span>
          <span className="text-slate-200 font-semibold">
            {ram} GB / 16.0 GB
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden relative">
          <div
            style={{ width: `${(ram / 16.0) * 100}%` }}
            className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300"
          />
        </div>
      </div>

      <div className="bg-slate-950/30 border border-white/10 rounded-xl p-3 font-mono text-[9px] text-slate-300 flex flex-col gap-1.5">
        <div className="flex justify-between border-b border-white/10 pb-1.5 text-[8px] text-slate-400 font-semibold tracking-wider">
          <span>SUBSYSTEM LINK</span>
          <span>STATUS</span>
        </div>
        <div className="flex justify-between items-center">
          <span>mistral-7b (AI Engine)</span>
          <span className="text-green-400 font-bold bg-green-500/10 px-1 py-0.2 rounded text-[8px]">
            READY
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>llama3:standby</span>
          <span className="text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded text-[8px]">
            SLEEP
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>spatial-depth-camera</span>
          <span className="text-cyan-400 font-semibold bg-cyan-500/10 px-1 py-0.2 rounded text-[8px]">
            SYNCED
          </span>
        </div>
        {optimizingLabel && (
          <div className="text-cyan-400 animate-pulse font-bold mt-1 text-[8px] tracking-wider">
            &gt;&gt; {optimizingLabel}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-0.5">
        <button
          disabled={isSystemWorking}
          onClick={() => triggerQuickCommand("Optimize system cores")}
          className="py-2 px-2 text-[10px] font-mono tracking-widest uppercase rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/15 hover:border-cyan-400/40 text-cyan-400 font-semibold transition duration-150 disabled:opacity-50"
        >
          OPTIMIZE RAM
        </button>
        <button
          disabled={isSystemWorking}
          onClick={() => {
            playCyberBeep("warning");
            setIsSystemWorking(true);
            setOptimizingLabel("Overclocking system bus frequency...");
            setCpu(94.5);
            setTemp(82);
            setTimeout(() => {
              setCpu(14.2);
              setTemp(52);
              setIsSystemWorking(false);
              setOptimizingLabel("");
              playCyberBeep("success");
            }, 2500);
          }}
          className="py-2 px-2 text-[10px] font-mono tracking-widest uppercase rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-400/40 text-purple-400 font-semibold transition duration-150 disabled:opacity-50"
        >
          OVERCLOCK CORE
        </button>
      </div>
    </div>
  );
}
