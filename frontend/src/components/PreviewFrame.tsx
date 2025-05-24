import { useWebContainer } from "@/hooks/useWebContainer";
import { WebContainer } from "@webcontainer/api";
import { Link2, LoaderIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface PreviewFrameProps {
  webContainer: WebContainer | null;
}

export function PreviewFrame({ webContainer }: PreviewFrameProps) {
  const { setTerminalLogs } = useWebContainer();
  const [url, setUrl] = useState("");

  const main = useCallback( async () => {
    if (!webContainer) {
      console.error("WebContainer is not initialized");
      return;
    }
    const installProcess = await webContainer.spawn("npm", ["install"]);

    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
          setTerminalLogs((prev) => [...prev, data]);
        },
      })
    );

    await webContainer.spawn("npm", ["run", "dev"]);

    // Wait for the`server-ready` event
    webContainer.on("server-ready", (port, url) => {
      console.log({ url: url, port: port });
      setUrl(url);
    });
  }, [webContainer, setTerminalLogs]);

  useEffect(() => {
    if (webContainer) main();
  }, [main, webContainer]);

  return (
    <div className="h-full flex flex-col items-center justify-center text-white/50">
      {!url && (
        <p className="mb-2 flex flex-col items-center gap-0.5">
        <LoaderIcon className="animate-spin w-6 h-6" />
          Loading Preview
        </p>
      )}
      {url && (
        <>
          <div className="w-full p-2">
            <span className="text-sm text-white flex items-center space-x-1 px-2 py-1 w-full bg-white/10 rounded-md">
              <Link2 className="w-4 h-4" />

              <p className="flex items-center">
                :{" "}
                {webContainer?.path?.replace(
                  webContainer.path.substring(
                    1,
                    "/bin:/usr/bin:/usr/local/bin".length
                  ),
                  ""
                )}
              </p>
            </span>
          </div>
          <iframe width={"100%"} height={"100%"} src={url} />
        </>
      )}
    </div>
  );
}
