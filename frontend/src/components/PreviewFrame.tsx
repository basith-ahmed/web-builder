import { WebContainer } from "@webcontainer/api";
import { Link2, LoaderIcon } from "lucide-react";
import React from "react";

interface PreviewFrameProps {
  webContainer: WebContainer | null;
  url: string;
  isInstalling: boolean;
}

export function PreviewFrame({ webContainer, url, isInstalling }: PreviewFrameProps) {
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
