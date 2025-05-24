import React, { useState } from "react";
import { useTerminal } from "@/hooks/useTerminal";

export function Terminal() {
  const { terminalLogs, clearLogs, logs } = useTerminal();
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="border-t border-white/10 flex flex-col items-center overflow-hidden">
      <div
        className="w-full flex justify-between items-center cursor-pointer p-2 pt-1 px-4"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="font-medium">Console</span>
        <span className="text-gray-500">{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && (
        <div className="w-full p-4 bg-black text-white/80 font-mono h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1 bg-red-300">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
