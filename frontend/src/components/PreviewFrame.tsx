import { WebContainer } from "@webcontainer/api";
import { Link2, LoaderIcon } from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useTerminal } from "@/context/TerminalContext";
import { installDependencies, startDevServer } from "@/lib/webcontainer";

interface PreviewFrameProps {
  webContainer: WebContainer | null;
}

export function PreviewFrame({ webContainer }: PreviewFrameProps) {
  const { appendLog } = useTerminal();
  const [url, setUrl] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const appendLogRef = useRef(appendLog);

  useEffect(() => {
    appendLogRef.current = appendLog;
  }, [appendLog]);

  const handleInstall = useCallback(async () => {
    if (!webContainer || isInstalling) return;

    try {
      setIsInstalling(true);
      await installDependencies(webContainer, appendLogRef.current);
      setIsInstalling(false);
      await startDevServer(webContainer, appendLogRef.current);
      setIsServerRunning(true);
    } catch (error) {
      console.error("Failed to setup environment:", error);
      appendLogRef.current(`Error: ${error}`);
      setIsInstalling(false);
    }
  }, [webContainer, isInstalling]);

  useEffect(() => {
    if (webContainer && !isInstalling && !isServerRunning) {
      handleInstall();
    }
  }, [webContainer, isInstalling, isServerRunning, handleInstall]);

  useEffect(() => {
    if (!webContainer) return;

    webContainer.on("server-ready", (port: number, url: string) => {
      console.log({ url, port });
      setUrl(url);
    });
  }, [webContainer]);

  return (
    <div className="h-full flex flex-col items-center justify-center text-white/50">
      <div className="w-full p-2 flex items-center justify-center">
        <Link2 className="w-5 h-5 text-white/80 ml-1 mr-3" />
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
      {(!url || isInstalling) && (
        <p className="w-full h-full flex flex-col items-center justify-center gap-0.5">
          <LoaderIcon className="animate-spin w-6 h-6" />
          {isInstalling ? "Installing Dependencies..." : "Loading Preview"}
        </p>
      )}
      {url && !isInstalling && <iframe width={"100%"} height={"100%"} src={url} />}
    </div>
  );
}
