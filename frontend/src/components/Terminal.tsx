import React, { useState } from "react";
import { useTerminal } from "@/context/TerminalContext";

export function Terminal() {
  const { logs, clearLogs } = useTerminal();
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="border-t border-white/10 flex flex-col items-center overflow-hidden">
      <div
        className="w-full flex justify-between items-center cursor-pointer p-2 pt-1 px-4"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="font-medium">Console</span>
        <div className="flex items-center gap-2">
          {!isCollapsed && logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearLogs();
              }}
              className="text-xs text-white/50 hover:text-white"
            >
              Clear
            </button>
          )}
          <span className="text-gray-500">{isCollapsed ? "▼" : "▲"}</span>
        </div>
      </div>
      {!isCollapsed && (
        <div className="w-full p-4 bg-black text-white/80 font-mono h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1 whitespace-pre-wrap break-all">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
