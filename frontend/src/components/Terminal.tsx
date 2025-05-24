import React, { useState, useRef, useEffect } from "react";
import { useTerminal } from "@/context/TerminalContext";
import { PanelBottomClose, PanelBottomOpen, TerminalIcon } from "lucide-react";

export function Terminal() {
  const { logs, clearLogs } = useTerminal();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
    }
  }, [logs, isCollapsed]);

  return (
    <div className="border-t border-white/10 flex flex-col items-center overflow-hidden">
      <div
        className={`w-full flex justify-between items-center cursor-pointer p-2 px-4 ${
          isCollapsed ? "pb-3.5" : ""
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="font-medium flex items-center gap-x-1">
          <TerminalIcon className="w-4 h-4" />
          Console
        </span>
        <div className="flex items-center gap-2">
          {!isCollapsed && logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearLogs();
              }}
              className="text-xs duration-300 text-white/50 hover:text-red-400 cursor-pointer"
            >
              Clear
            </button>
          )}
          <span className="">
            {isCollapsed ? (
              <PanelBottomOpen className="w-4 h-4" />
            ) : (
              <PanelBottomClose className="w-4 h-4" />
            )}
          </span>
        </div>
      </div>
      {!isCollapsed && (
        <div className="w-full p-4 text-sm bg-black text-white/80 font-mono h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`mb-1 whitespace-pre-wrap break-all ${
                log.includes("error") || log.includes("Error")
                  ? "text-red-400"
                  : log.includes("warning") || log.includes("Warning")
                  ? "text-yellow-400"
                  : log.includes("success") || log.includes("Success")
                  ? "text-green-400"
                  : ""
              }`}
            >
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
