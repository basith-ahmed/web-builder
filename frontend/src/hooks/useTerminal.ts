import { useRef, useState } from "react";

export function useTerminal() {
  const logsRef = useRef<string[]>([]);
  const [version, setVersion] = useState(0);
  const [logs, setLogs] = useState<String[]>([]);

  const appendLog = (log: string) => {
    logsRef.current.push(log);
    setVersion((v) => v + 1);
  };

  const clearLogs = () => {
    logsRef.current = [];
    setVersion((v) => v + 1);
  };

  return {
    terminalLogs: logsRef.current,
    appendLog,
    clearLogs,
    logs,
    setLogs
  };
}
