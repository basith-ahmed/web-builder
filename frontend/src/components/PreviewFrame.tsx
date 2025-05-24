import { WebContainer } from "@webcontainer/api";
import { Link2, LoaderIcon } from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useTerminal } from "@/context/TerminalContext";

interface PreviewFrameProps {
  webContainer: WebContainer | null;
}

export function PreviewFrame({ webContainer }: PreviewFrameProps) {
  const { appendLog } = useTerminal();
  const [url, setUrl] = useState("");
  const appendLogRef = useRef(appendLog);

  useEffect(() => {
    appendLogRef.current = appendLog;
  }, [appendLog]);

  const formatLog = (data: string) => {
    let cleaned = data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
    cleaned = cleaned.replace(/\\/g, '').trim();
    if (cleaned) {
      appendLogRef.current(cleaned);
    }
  };

  const main = useCallback(async () => {
    if (!webContainer) {
      console.error("WebContainer is not initialized");
      return;
    }

    appendLogRef.current("Installing dependencies...");
    appendLogRef.current("Running: npm install");
    const installProcess = await webContainer.spawn("npm", ["install"]);

    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          const logMessage = typeof data === "string" ? data : new TextDecoder().decode(data);
          console.log('Raw log:', logMessage);
          formatLog(logMessage);
        },
      })
    );

    appendLogRef.current("Starting development server...");
    appendLogRef.current("Running: npm run dev");
    await webContainer.spawn("npm", ["run", "dev"]);

    // Wait for the`server-ready` event
    webContainer.on("server-ready", (port, url) => {
      console.log({ url: url, port: port });
      setUrl(url);
    });
  }, [webContainer]);

  useEffect(() => {
    if (webContainer) main();
  }, [main, webContainer]);

  return (
    <div className="h-full flex flex-col items-center justify-center text-white/50">
      <div className="w-full p-2 flex items-center justify-center">
        <Link2 className="w-4 h-4 text-white/80 mr-2" />
        <span className="text-sm text-white flex items-center space-x-1 px-2 py-1 w-full bg-white/10 rounded-md">
          <p className="flex items-center">
            {" /"}
            {webContainer?.path?.replace(
              webContainer.path.substring(
                0,
                "/bin:/usr/bin:/usr/local/bin".length
              ),
              ""
            )}
          </p>
        </span>
      </div>
      {!url && (
        <p className="w-full h-full flex flex-col items-center justify-center gap-0.5">
          <LoaderIcon className="animate-spin w-6 h-6" />
          Loading Preview
        </p>
      )}
      {url && <iframe width={"100%"} height={"100%"} src={url} />}
    </div>
  );
}
