"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { StepsList } from "@/components/StepsList";
import { FileExplorer } from "@/components/FileExplorer";
import { TabView } from "@/components/TabView";
import { CodeEditor } from "@/components/CodeEditor";
import { PreviewFrame } from "@/components/PreviewFrame";
import { Step, FileItem, StepType } from "@/types";
import axios from "axios";
import { BACKEND_URL } from "@/utils/config";
import { parseXml } from "@/utils/parser";
import { useWebContainer } from "@/hooks/useWebContainer";
import { useSearchParams } from "next/navigation";
import { Terminal } from "@/components/Terminal";
import { FileSystemTree } from "@webcontainer/api";
import { TerminalProvider } from "@/context/TerminalContext";

function BuilderContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");

  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<
    { role: "user" | "model"; parts: { text: string }[] }[]
  >([]);
  // const [loading, setLoading] = useState(false);
  // const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer()

  // const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);

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

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): FileSystemTree => {
      const mountStructure: FileSystemTree = {};

      const processFile = (file: FileItem, isRootFolder: boolean) => {
        if (file.type === "folder") {
          /*
           *  Create a folkder entry
           *  This creates a nested structure for folders
           *  The structure is specifically built for webcontainers
           */
          mountStructure[file.name] = {
            directory: file.children
              ? Object.fromEntries(
                  file.children.map((child) => [
                    child.name,
                    processFile(child, false),
                  ])
                )
              : {},
          };
        } else if (file.type === "file") {
          // Create a file entry
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

      // Process each top-level file/folder
      files.forEach((file) => processFile(file, true));

      return mountStructure;
    };

    const mountStructure = createMountStructure(files);

    console.log(mountStructure);
    webcontainer?.mount(mountStructure);

    // Cleanup function to unmount WebContainer when component unmounts
    // return () => {
    //   if (webcontainer) {
    //     void webcontainer.teardown();
    //   }
    // };
  }, [files, webcontainer]);

  const fetchData = useCallback(async () => {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt!.trim(),
    });
    // setTemplateSet(true);

    const { base, defaultFiles } = response.data;

    setSteps(
      parseXml(defaultFiles[0]).map((x: Step) => ({
        ...x,
        status: "pending",
      }))
    );

    // setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...base, prompt].map((content) => ({
        role: "user",
        parts: [{ text: content }],
      })),
    });

    console.log({ response: stepsResponse.data.response });

    // setLoading(false);

    setSteps((s) => [
      ...s,
      ...parseXml(stepsResponse.data.response).map((x) => ({
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

  const handleSend = async () => {
    if (!userPrompt) return;
    setUserPrompt("");
    const newMessage = {
      role: "user" as const,
      parts: [{ text: userPrompt }],
    };

    // setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...llmMessages, newMessage],
    });
    // setLoading(false);

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
      ...parseXml(stepsResponse.data.response).map((x) => ({
        ...x,
        status: "pending" as const,
      })),
    ]);
  };

  return (
    <div className="h-screen flex flex-col  bg-[#0f0f10]">
      <header className="flex justify-between items-center border-white/10 px-4 py-1.5">
        {/* <div className="w-[2px] rounded-full bg-white/20 mx-2"></div> */}
        <p className="mt-1 truncate max-w-96 text-md">
          <span className="mr-1 font-semibold">Builder /</span>
          <span className="text-white/50">{prompt}</span>
        </p>
        <h1 className="flex items-center text-xl font-semibold text-gray-100">
          WebBuilder
          <span className="animate-gradient bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-[length:200%_200%] text-transparent bg-clip-text">
            .AI
          </span>
        </h1>
      </header>

      <div className="flex-1 grid grid-cols-3 overflow-hidden">
        <div className="col-span-1 overflow-auto flex flex-col h-full pb-2">
          <div className="flex-1 overflow-auto relative">
            <StepsList steps={steps} />
          </div>
          <div className="sticky bottom-0 flex flex-col justify-between mx-4 mt-[1px] bg-[#141415] backdrop-blur-xl ring-1 ring-white/10 rounded-2xl overflow-hidden">
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
              className="resize-none py-3 px-4 w-full text-gray-100 bg-transparent focus:ring-0 focus:outline-none"
            />
            <button
              onClick={handleSend}
              className={`m-2 p-1 w-24 ml-auto rounded-lg transition-all duration-300 border border-white/10 ${
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
            selectedFile={selectedFile}
          />
          <div className="h-full grid grid-cols-4 overflow-hidden border-t border-white/10">
            <div className="col-span-1 overflow-auto border-r border-white/10">
              <FileExplorer files={files} onFileSelect={setSelectedFile} />
            </div>

            <div className="col-span-3 flex-1">
              {activeTab === "code" ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame webContainer={webcontainer} />
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#0f0f10] text-white">Loading...</div>}>
      <TerminalProvider>
        <BuilderContent />
      </TerminalProvider>
    </Suspense>
  );
}
