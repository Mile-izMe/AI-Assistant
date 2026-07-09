"use client";
import DraggableCard from "@/components/DraggableCard";
import IntelVector from "@/components/widgets/IntelVector";
import NeuralTelemetry from "@/components/widgets/NeuralTelemetry";
import OpticalTelemetry from "@/components/widgets/OpticalTelemetry";
import SysIntegrity from "@/components/widgets/SysIntegrity";
import { Dialogue, NewsArticle, Position } from "@/types/jarvis";
import { playCyberBeep } from "@/utils/audio";
import { Grid, RotateCcw, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_NEWS: NewsArticle[] = [
  {
    id: "1",
    category: "NEURAL NET",
    time: "12:04:15",
    title: "Ollama v4.2 released with native spatial video model.",
    content:
      "The local inference model enables real-time high-efficiency scene descriptions with under 15ms response latency on edge consumer chips.",
  },
  {
    id: "2",
    category: "SYS OPTIM",
    time: "11:42:01",
    title: "Quantum Encryption Standard verified in satellite lasers.",
    content:
      "The security protocol enforces orbital entropic-key generation, rendering local quantum-decoherence decrypts obsolete.",
  },
  {
    id: "3",
    category: "DIAGNOSTIC",
    time: "09:12:45",
    title: "AI system temperature drops 5°C post coolant purge.",
    content:
      "Cognitive system core successfully completed mechanical cooling. Processing stability index increased by 4.2% overall.",
  },
  {
    id: "4",
    category: "SPACE TELEMETRY",
    time: "08:01:20",
    title: "Lunar relay achieves record 99.9% optical link uptime.",
    content:
      "The ground-to-orbital mesh completed packet transfers successfully under heavy deep-space RF interference.",
  },
];

export default function DashboardPage() {
  const [positions, setPositions] = useState<Record<string, Position>>({
    camera: { x: 40, y: 100 },
    status: { x: 800, y: 100 },
    news: { x: 40, y: 440 },
    voice: { x: 380, y: 640 },
  });
  const [zIndices, setZIndices] = useState<Record<string, number>>({
    camera: 10,
    status: 10,
    news: 10,
    voice: 20,
  });
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [gridSnap, setGridSnap] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const [cpu, setCpu] = useState(14);
  const [ram, setRam] = useState(5.4);
  const [temp, setTemp] = useState(51);
  const [ollamaConnected, setOllamaConnected] = useState(true);
  const [isSystemWorking, setIsSystemWorking] = useState(false);
  const [optimizingLabel, setOptimizingLabel] = useState("");

  const [dialogues, setDialogues] = useState<Dialogue[]>([
    {
      sender: "jarvis",
      text: "Systems online. Welcome back, sir. Listening for voice telemetry commands.",
      timestamp: "05:44:03",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isJarvisTalking, setIsJarvisTalking] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  const [uptime, setUptime] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("05:44:03");

  const voiceCanvasRef = useRef<HTMLCanvasElement>(null);

  const selectCard = (id: string) => {
    setActiveCardId(id);
    setZIndices((prev) => {
      const maxZ = Math.max(...(Object.values(prev) as number[]));
      return { ...prev, [id]: maxZ + 1 };
    });
  };

  const handleDrag = (id: string, newX: number, newY: number) => {
    setPositions((prev) => ({ ...prev, [id]: { x: newX, y: newY } }));
  };

  const resetLayout = () => {
    playCyberBeep("success");
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w < 768) {
      setPositions({
        camera: { x: 10, y: 70 },
        status: { x: 10, y: 340 },
        news: { x: 10, y: 640 },
        voice: { x: 10, y: 920 },
      });
    } else {
      setPositions({
        camera: {
          x: Math.max(20, Math.floor(w * 0.05)),
          y: Math.floor(h * 0.12),
        },
        status: {
          x: Math.min(w - 380, Math.floor(w * 0.68)),
          y: Math.floor(h * 0.12),
        },
        news: { x: Math.max(20, Math.floor(w * 0.05)), y: Math.floor(h * 0.5) },
        voice: { x: Math.floor((w - 560) / 2), y: Math.floor(h - 250) },
      });
    }
  };

  useEffect(() => {
    playCyberBeep("startup");

    const timeoutId = setTimeout(() => {
      resetLayout();
    }, 0);

    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
      setCurrentTimeStr(new Date().toTimeString().split(" ")[0]);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const metricsTimer = setInterval(() => {
      if (isSystemWorking) return;
      setCpu((prev) =>
        parseFloat(
          Math.max(10, Math.min(18, prev + (Math.random() - 0.5) * 3)).toFixed(
            1,
          ),
        ),
      );
      setTemp((prev) =>
        parseFloat(
          Math.max(
            49,
            Math.min(53, prev + (Math.random() - 0.5) * 1.2),
          ).toFixed(1),
        ),
      );
      setRam((prev) =>
        parseFloat(
          Math.max(
            5.2,
            Math.min(5.6, prev + (Math.random() - 0.5) * 0.04),
          ).toFixed(2),
        ),
      );
    }, 1500);
    return () => clearInterval(metricsTimer);
  }, [isSystemWorking]);

  const speakJarvis = (text: string) => {
    if (!speechEnabled) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.toLowerCase().includes("google") ||
            v.name.toLowerCase().includes("daniel")),
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.onstart = () => setIsJarvisTalking(true);
      utterance.onend = () => setIsJarvisTalking(false);
      utterance.onerror = () => setIsJarvisTalking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const processCommand = (cmd: string) => {
    const normalized = cmd.toLowerCase().trim();
    if (!normalized) return;

    playCyberBeep("click");
    const timeStr = new Date().toTimeString().split(" ")[0];
    setDialogues((prev) =>
      [
        ...prev,
        { sender: "user" as const, text: cmd, timestamp: timeStr },
      ].slice(-10),
    );
    setInputText("");
    setIsListening(true);

    setTimeout(() => {
      setIsListening(false);
      let reply = "";

      if (normalized.includes("optimize") || normalized.includes("purge")) {
        setIsSystemWorking(true);
        setOptimizingLabel("Purging memory caches...");
        playCyberBeep("warning");
        setCpu(88);
        setTemp(62);
        setTimeout(() => {
          setCpu(3.1);
          setRam(2.21);
          setTemp(45.5);
          setIsSystemWorking(false);
          setOptimizingLabel("");
          playCyberBeep("success");
          const rText = "Core optimize sequence completed successfully, sir.";
          setDialogues((prev) =>
            [
              ...prev,
              { sender: "jarvis" as const, text: rText, timestamp: timeStr },
            ].slice(-10),
          );
          speakJarvis(rText);
        }, 2200);
        return;
      } else if (normalized.includes("status")) {
        reply = `System optimal. Temperature is ${temp}°C.`;
      } else if (normalized.includes("news")) {
        reply = "Loading regional headlines, sir.";
        selectCard("news");
      } else if (normalized.includes("clear")) {
        setDialogues([]);
        return;
      } else {
        reply = "Query processed locally. Standby for feedback loop.";
      }

      setDialogues((prev) =>
        [
          ...prev,
          { sender: "jarvis" as const, text: reply, timestamp: timeStr },
        ].slice(-10),
      );
      speakJarvis(reply);
    }, 600);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden relative font-sans text-slate-100 select-none">
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      {scanlines && (
        <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-45"></div>
      )}

      <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between px-8 z-40">
        <div className="flex items-center gap-4">
          <h1 className="font-display font-bold text-[10px] tracking-[0.3em] text-slate-300 uppercase">
            JARVIS CORE
          </h1>
          <div className="hidden md:block font-mono text-[9px] text-cyan-400/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
            UPTIME: {uptime}s
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGridSnap(!gridSnap)}
            className={`px-3 py-1.5 rounded-lg text-xs border ${gridSnap ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-slate-300"}`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScanlines(!scanlines)}
            className={`px-3 py-1.5 rounded-lg text-xs border ${scanlines ? "bg-purple-500/10 text-purple-400" : "bg-white/5 text-slate-300"}`}
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetLayout}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          2026-07-06{" "}
          <span className="text-slate-300 font-semibold">{currentTimeStr}</span>
        </div>
      </header>

      <div
        id="dashboard-container"
        className="w-full h-full pt-14 pb-2 relative overflow-hidden"
      >
        <DraggableCard
          id="camera"
          title="OPTICAL TELEMETRY // CAM_01"
          x={positions.camera.x}
          y={positions.camera.y}
          width="w-[360px]"
          height="h-[295px]"
          zIndex={zIndices.camera}
          gridSnap={gridSnap}
          onDrag={handleDrag}
          onSelect={selectCard}
        >
          <OpticalTelemetry />
        </DraggableCard>

        <DraggableCard
          id="status"
          title="SYS INTEGRITY ENGINE"
          x={positions.status.x}
          y={positions.status.y}
          width="w-[360px]"
          height="h-[365px]"
          zIndex={zIndices.status}
          gridSnap={gridSnap}
          onDrag={handleDrag}
          onSelect={selectCard}
        >
          <SysIntegrity
            cpu={cpu}
            ram={ram}
            temp={temp}
            ollamaConnected={ollamaConnected}
            toggleOllama={() => setOllamaConnected(!ollamaConnected)}
            isSystemWorking={isSystemWorking}
            optimizingLabel={optimizingLabel}
            triggerQuickCommand={processCommand}
            setCpu={setCpu}
            setTemp={setTemp}
            setIsSystemWorking={setIsSystemWorking}
            setOptimizingLabel={setOptimizingLabel}
          />
        </DraggableCard>

        <DraggableCard
          id="news"
          title="INTEL VECTOR // NEWS FEED"
          x={positions.news.x}
          y={positions.news.y}
          width="w-[380px]"
          height="h-[285px]"
          zIndex={zIndices.news}
          gridSnap={gridSnap}
          onDrag={handleDrag}
          onSelect={selectCard}
        >
          <IntelVector
            selectedNews={selectedNews}
            setSelectedNews={setSelectedNews}
            defaultNews={DEFAULT_NEWS}
          />
        </DraggableCard>

        <DraggableCard
          id="voice"
          title="NEURAL TELEMETRY LINK"
          x={positions.voice.x}
          y={positions.voice.y}
          width="w-[560px]"
          height="h-[185px]"
          zIndex={zIndices.voice}
          gridSnap={gridSnap}
          onDrag={handleDrag}
          onSelect={selectCard}
        >
          <NeuralTelemetry
            isJarvisTalking={isJarvisTalking}
            isListening={isListening}
            isSystemWorking={isSystemWorking}
            dialogues={dialogues}
            inputText={inputText}
            setInputText={setInputText}
            processCommand={processCommand}
            voiceCanvasRef={voiceCanvasRef}
          />
        </DraggableCard>
      </div>
    </div>
  );
}
