import { WebContainer } from "@webcontainer/api";
import { FileSystemTree } from "@webcontainer/api";
import { FileItem } from "@/types";

export async function bootWebContainer(): Promise<WebContainer> {
  return await WebContainer.boot();
}

export function createMountStructure(files: FileItem[]): FileSystemTree {
  const mountStructure: FileSystemTree = {};

  const processFile = (file: FileItem, isRootFolder: boolean) => {
    if (file.type === "folder") {
      mountStructure[file.name] = {
        directory: file.children
          ? Object.fromEntries(
              file.children.map((child: FileItem) => [
                child.name,
                processFile(child, false),
              ])
            )
          : {},
      };
    } else if (file.type === "file") {
      if (isRootFolder) {
        mountStructure[file.name] = {
          file: {
            contents: file.content || "",
          },
        };
      } else {
        return {
          file: {
            contents: file.content || "",
          },
        };
      }
    }

    return mountStructure[file.name];
  };

  files.forEach((file) => processFile(file, true));
  return mountStructure;
}

export async function installDependencies(
  webContainer: WebContainer,
  onLog: (message: string) => void
): Promise<void> {
  onLog("Installing dependencies...");
  onLog("Running: npm install");

  const installProcess = await webContainer.spawn("npm", ["install"]);

  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        const logMessage =
          typeof data === "string" ? data : new TextDecoder().decode(data);
        const cleaned = formatLog(logMessage);
        if (cleaned) onLog(cleaned);
      },
    })
  );

  await installProcess.exit;
}

export async function startDevServer(
  webContainer: WebContainer,
  onLog: (message: string) => void
): Promise<void> {
  onLog("Starting development server...");
  onLog("Running: npm run dev");
  await webContainer.spawn("npm", ["run", "dev"]);
}

export function formatLog(data: string): string {
  let cleaned = data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
  cleaned = cleaned.replace(/\\/g, "").trim();
  return cleaned ? cleaned : "";
}
