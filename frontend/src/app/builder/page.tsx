"use client";

import React, {
  useCallback,
  useEffect,
  useState,
  Suspense,
  useRef,
} from "react";
import { StepsList } from "@/components/StepsList";
import { FileExplorer } from "@/components/FileExplorer";
import { TabView } from "@/components/TabView";
import { CodeEditor } from "@/components/CodeEditor";
import { PreviewFrame } from "@/components/PreviewFrame";
import { Step, FileItem, StepType } from "@/types";
import axios from "axios";
import { BACKEND_URL } from "@/utils/config";
import { parseJson } from "@/utils/parser";
import { useWebContainer } from "@/hooks/useWebContainer";
import { useSearchParams } from "next/navigation";
import { Terminal } from "@/components/Terminal";
import { TerminalProvider, useTerminal } from "@/context/TerminalContext";
import { useFileSystem } from "@/hooks/useFileSystem";
import { cn } from "@/lib/utils";
import { installDependencies, startDevServer } from "@/lib/webcontainer";
import { Slash, Download } from "lucide-react";
import JSZip from "jszip";

function BuilderContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");

  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<
    { role: "user" | "model"; parts: { text: string }[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const webcontainer = useWebContainer();
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // WebContainer Preview
  const { appendLog } = useTerminal();
  const [url, setUrl] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const appendLogRef = useRef(appendLog);

  useEffect(() => {
    appendLogRef.current = appendLog;
  }, [appendLog]);

  const handleInstall = useCallback(async () => {
    if (!webcontainer || isInstalling) return;

    try {
      setIsInstalling(true);
      await installDependencies(webcontainer, appendLogRef.current);
      setIsInstalling(false);
      await startDevServer(webcontainer, appendLogRef.current);
      setIsServerRunning(true);
    } catch (error) {
      console.error("Failed to setup environment:", error);
      appendLogRef.current(`Error: ${error}`);
      setIsInstalling(false);
    }
  }, [webcontainer, isInstalling]);

  useEffect(() => {
    if (webcontainer && !isInstalling && !isServerRunning) {
      handleInstall();
    }
  }, [webcontainer, isInstalling, isServerRunning, handleInstall]);

  useEffect(() => {
    if (!webcontainer) return;

    webcontainer.on("server-ready", (port: number, url: string) => {
      console.log({ url, port });
      setUrl(url);
    });
  }, [webcontainer]);

  useFileSystem(webcontainer, files);

  // Just for setting the Default file when first mounting
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const findFile = (items: FileItem[]): FileItem | null => {
        for (const item of items) {
          if (
            item.type === "file" &&
            (item.name === "App.tsx" ||
              item.name === "App.jsx" ||
              item.name === "index.ts" ||
              item.name === "index.js")
          ) {
            return item;
          }
          if (item.type === "folder" && item.children) {
            const found = findFile(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const defaultFile = findFile(files);
      if (defaultFile) {
        setSelectedFile(defaultFile);
      }
    }
  }, [files, selectedFile]);

  // Writing the newly fetched data into files on each response
  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps
      .filter(({ status }) => status === "pending")
      .map((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split("/") ?? [];
          let currentFileStructure = [...originalFiles];
          const finalAnswerRef = currentFileStructure;

          let currentFolder = "";
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            const currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              // File
              const file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "file",
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              // Folder
              const folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                // Create Folder
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "folder",
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => {
          return {
            ...s,
            status: "completed",
          };
        })
      );
    }
    console.log(files);
  }, [steps, files]);

  // Fetching the template files on mounting
  const fetchData = useCallback(async () => {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt!.trim(),
    });

    const { base, defaultFiles } = response.data;

    setSteps(
      parseJson(defaultFiles[0]).map((x: Step) => ({
        ...x,
        status: "pending",
      }))
    );

    setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...base, prompt].map((content) => ({
        role: "user",
        parts: [{ text: content }],
      })),
    });

    console.log({ response: stepsResponse.data.response });
    setLoading(false);

    setSteps((s) => [
      ...s,
      ...parseJson(stepsResponse.data.response).map((x) => ({
        ...x,
        status: "pending" as const,
      })),
    ]);

    setLlmMessages(
      [...base, prompt].map((content) => ({
        role: "user",
        parts: [{ text: content }],
      }))
    );

    setLlmMessages((x) => [
      ...x,
      { role: "model", parts: [{ text: stepsResponse.data.response }] },
    ]);
  }, [prompt]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chat
  const handleSend = async () => {
    if (!userPrompt) return;
    setUserPrompt("");
    const newMessage = {
      role: "user" as const,
      parts: [{ text: userPrompt }],
    };

    setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...llmMessages, newMessage],
    });
    setLoading(false);

    setLlmMessages((x) => [...x, newMessage]);
    setLlmMessages((x) => [
      ...x,
      {
        role: "model",
        parts: [{ text: stepsResponse.data.response }],
      },
    ]);

    setSteps((s) => [
      ...s,
      ...parseJson(stepsResponse.data.response).map((x) => ({
        ...x,
        status: "pending" as const,
      })),
    ]);
  };

  const handleDownload = () => {
    // Create a zip file containing all project files
    const zip = new JSZip();

    const addFilesToZip = (items: FileItem[], path = '') => {
      items.forEach(item => {
        const currentPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.type === 'file') {
          zip.file(currentPath, item.content || '');
        } else if (item.type === 'folder' && item.children) {
          addFilesToZip(item.children, currentPath);
        }
      });
    };

    addFilesToZip(files);

    // Generate and download the zip file
    zip.generateAsync({ type: 'blob' })
      .then(content => {
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="h-screen flex flex-col  bg-[#0f0f10]">
      <header className="flex justify-between items-center border-white/10 px-4 py-1.5">
        <p className="mt-1 truncate max-w-96 text-md flex items-center">
          <span className="font-semibold">Builder</span>
          <Slash className="w-4 h-4 -rotate-20 mx-[2px] font-semibold text-white/50" />
          <span className="">{prompt}</span>
        </p>
        <h1 className="flex items-center text-xl font-semibold text-white/70">
          WebBuilder
          <span className="animate-gradient bg-gradient-to-r from-white/60 via-white to-white/60 bg-[length:200%_200%] text-transparent bg-clip-text">
            .AI
          </span>
        </h1>
      </header>

      <div className="flex-1 grid grid-cols-3 overflow-hidden">
        <div className="col-span-1 overflow-auto flex flex-col h-full pb-2">
          <div className="flex-1 overflow-auto relative">
            <StepsList steps={steps} />
          </div>
          <div
            className={`sticky bottom-0 flex flex-col justify-between mx-4 mt-[1px] bg-[#141415] backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 ${
              loading ? "" : "ring-1 ring-white/10"
            }`}
          >
            <span
              className={cn(
                "absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r from-white/30 via-white/60 to-white/30 bg-[length:300%_100%] p-[1.5px] transition-all duration-500",
                {
                  "opacity-100": loading,
                  "opacity-0": !loading,
                }
              )}
              style={{
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "destination-out",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "subtract",
                WebkitClipPath: "padding-box",
              }}
            />
            <textarea
              rows={1}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Add a new feature..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="resize-none py-3 px-4 w-full text-gray-100 bg-transparent focus:ring-0 focus:outline-none z-20"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className={`m-2 p-1 w-24 ml-auto rounded-lg transition-all duration-300 border border-white/10 z-20 ${
                userPrompt
                  ? "bg-white hover:bg-white/90 text-black cursor-pointer"
                  : "bg-[#1f1f22]"
              }`}
            >
              Send
            </button>
          </div>
          <div className="text-center text-[12px] mt-1.5 opacity-55">
            View WebBuilder on{" "}
            <a
              href="https://github.com/basith-ahmed/web-builder"
              className="text-white font-semibold hover:underline"
            >
              GitHub
            </a>
            .
          </div>
        </div>

        <div className="col-span-2 overflow-hidden border border-white/10 rounded-lg m-4 ml-0 mt-0 flex flex-col">
          <TabView
            activeTab={activeTab}
            onTabChange={setActiveTab}
            handleDownload={handleDownload}
          />
          <div className="h-full grid grid-cols-4 overflow-hidden border-t border-white/10">
            <div className="col-span-1 overflow-auto border-r border-white/10">
              <FileExplorer files={files} onFileSelect={setSelectedFile} />
            </div>

            <div className="col-span-3 flex-1 relative">
              {/* {activeTab === "code" ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame
                  webContainer={webcontainer}
                  url={url}
                  isInstalling={isInstalling}
                />
              )} */}
              <PreviewFrame
                webContainer={webcontainer}
                url={url}
                isInstalling={isInstalling}
              />
              {activeTab === "code" && (
                <div className="absolute inset-0 z-20 bg-[#0f0f10]">
                  <CodeEditor file={selectedFile} />
                </div>
              )}
            </div>
          </div>
          <Terminal />
        </div>
      </div>
    </div>
  );
}

export default function Builder() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#0f0f10] text-white">
          Loading...
        </div>
      }
    >
      <TerminalProvider>
        <BuilderContent />
      </TerminalProvider>
    </Suspense>
  );
}
