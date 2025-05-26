import React, { createContext, useContext, useState, useCallback } from 'react';

interface TerminalContextType {
  logs: string[];
  appendLog: (log: string) => void;
  clearLogs: () => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = useCallback((log: string) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setLogs(prev => [...prev, `${time} ${log}`]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <TerminalContext.Provider value={{ logs, appendLog, clearLogs }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
} 