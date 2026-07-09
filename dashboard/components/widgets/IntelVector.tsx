"use client";
import React from "react";
import { NewsArticle } from "@/types/jarvis";
import { playCyberBeep } from "@/utils/audio";

interface IntelVectorProps {
  selectedNews: NewsArticle | null;
  setSelectedNews: (news: NewsArticle | null) => void;
  defaultNews: NewsArticle[];
}

export default function IntelVector({
  selectedNews,
  setSelectedNews,
  defaultNews,
}: IntelVectorProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {selectedNews && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 flex flex-col justify-between z-10 font-mono text-xs shadow-2xl animate-fade-in">
          <div className="flex-1 overflow-auto pr-1">
            <div className="flex justify-between items-center text-[8px] text-cyan-400 font-bold mb-1.5 tracking-wider">
              <span>{selectedNews.category.toUpperCase()}</span>
              <span>{selectedNews.time}</span>
            </div>
            <h4 className="text-white font-sans font-medium text-sm mb-3 border-b border-white/10 pb-2 leading-snug">
              {selectedNews.title}
            </h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {selectedNews.content}
            </p>
          </div>
          <button
            onClick={() => {
              playCyberBeep("click");
              setSelectedNews(null);
            }}
            className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 text-[9px] uppercase font-bold tracking-widest text-slate-300 border border-white/10 rounded-lg transition duration-150 text-center"
          >
            Return to News Index
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
        {defaultNews.map((article) => (
          <div
            key={article.id}
            onClick={() => {
              playCyberBeep("click");
              setSelectedNews(article);
            }}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-400/30 cursor-pointer transition duration-150 flex flex-col gap-1.5"
          >
            <div className="flex justify-between items-center font-mono text-[8px]">
              <span className="text-cyan-400 font-bold tracking-widest bg-cyan-500/10 px-1.5 py-0.5 rounded">
                {article.category}
              </span>
              <span className="text-slate-400 opacity-60 font-medium">
                {article.time}
              </span>
            </div>
            <h4 className="font-display font-medium text-xs text-slate-100 tracking-wide line-clamp-1">
              {article.title}
            </h4>
            <p className="font-mono text-[9px] text-slate-400 line-clamp-1">
              {article.content}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center font-mono text-[8px] text-slate-500 pt-2 border-t border-white/10 mt-2">
        <span>SOURCE: REGIONAL TELEMETRY LINK</span>
        <span>ITEMS: 4 LOADED</span>
      </div>
    </div>
  );
}
