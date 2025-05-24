"use client";

import { DotPattern } from "@/components/ui/Dots";
import { cn } from "@/lib/utils";
import { Slash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      router.push(`/builder?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
      <header className="flex w-full justify-between items-center border-white/10 px-4 py-1.5">
        <p className="mt-1 truncate max-w-96 text-md flex items-center">
          <a href="" className="font-semibold">
            <span className="font-semibold">Home</span>
          </a>
          <Slash className="w-4 h-4 -rotate-20 mx-[2px] font-semibold text-white/50" />
        </p>
        <h1 className="flex items-center text-xl font-semibold text-white/70">
          WebBuilder
          <span className="animate-gradient bg-gradient-to-r from-white/60 via-white to-white/60 bg-[length:200%_200%] text-transparent bg-clip-text">
            .AI
          </span>
        </h1>
      </header>
      <div className="h-full w-full p-2 pb-0 pt-0 flex items-center justify-center relative">
        <DotPattern
          glow={true}
          className={cn(
            "[mask-image:radial-gradient(600px_250px_at_center,white,transparent)]"
          )}
        />
        <div className="space-y-4 w-full h-full bg-[#0f0f10] border border-white/10 rounded-lg flex flex-col items-center justify-center">
          <h1 className="font-bold text-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 z-20">
            What can I help to Build?
          </h1>
          <form
            onSubmit={handleSubmit}
            className="bg-[#141414] w-[40rem] p-2 flex flex-col justify-between ring-1 ring-white/10 rounded-2xl z-20"
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Make a To-Do List App..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as React.FormEvent);
                }
              }}
              className="resize-none py-3 px-4 w-full text-gray-100 bg-transparent focus:ring-0 focus:outline-none"
            />
            <button
              type="submit"
              className={`m-2 p-1 w-24 ml-auto rounded-lg transition-all duration-300 border border-white/10 ${
                prompt
                  ? "bg-white hover:bg-white/90 text-black cursor-pointer"
                  : "bg-[#1f1f22] text-white/50"
              }`}
            >
              Generate
            </button>
          </form>
        </div>
      </div>
      <div className="text-center text-[12px] my-1.5 opacity-55">
        View WebBuilder on{" "}
        <a
          href="https://github.com/basith-ahmed/web-builder"
          className="text-white font-semibold hover:underline"
        >
          GitHub
        </a>
        .
      </div>
    </div>
  );
}
