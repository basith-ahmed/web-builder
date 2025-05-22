"use client";

import React, { useEffect, useState } from "react";
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

export default function Builder() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");

  const [userPrompt, setUserPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<
    { role: "user" | "model"; parts: { text: string }[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
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
          let finalAnswerRef = currentFileStructure;

          let currentFolder = "";
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              // File
              let file = currentFileStructure.find(
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
              let folder = currentFileStructure.find(
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
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

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
  }, [files, webcontainer]);

  async function fetchData() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt!.trim(),
    });
    setTemplateSet(true);

    const { base, defaultFiles } = response.data;

    setSteps(
      parseXml(defaultFiles[0]).map((x: Step) => ({
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
      ...parseXml(stepsResponse.data.response).map((x) => ({
        ...x,
        status: "pending" as "pending",
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
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSend = async () => {
    if (!userPrompt) return;
    setUserPrompt("");
    const newMessage = {
      role: "user" as "user",
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
      ...parseXml(stepsResponse.data.response).map((x) => ({
        ...x,
        status: "pending" as "pending",
      })),
    ]);
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      <header className="flex justify-between items-center  border-b border-white/20 px-6 py-3">
        {/* <div className="w-[2px] rounded-full bg-white/20 mx-2"></div> */}
        <p className="text-white mt-1 truncate max-w-96 text-xl">
          <span className="mr-1 font-semibold">
            Project:
          </span>
          {prompt}
        </p>
        <h1 className="flex items-center text-xl font-semibold text-gray-100">
          WebBuilder
          <span className="animate-gradient bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-[length:200%_200%] text-transparent bg-clip-text">
            .AI
          </span>
        </h1>
      </header>

      <div className="flex-1 grid grid-cols-4 overflow-hidden">
        <div className="col-span-1 overflow-auto relative border-r border-white/20">
          <StepsList
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
          <div className="flex absolute bottom-0 left-0 right-0 m-4 backdrop-blur-lg ring-1 ring-white/20 rounded-lg overflow-hidden">
            <input
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Add dark mode to it."
              className="p-2 w-full h-12 text-gray-100 focus:ring-0 focus:outline-none"
            />

            <button
              onClick={handleSend}
              className="bg-blue-500 m-1 px-4 rounded-sm hover:bg-blue-600 transition-all duration-300"
            >
              Send
            </button>
          </div>
        </div>

        <div className="col-span-3 grid grid-cols-4 overflow-hidden">
          <div className="col-span-1 overflow-auto border-r border-white/20">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>

          <div className="col-span-3 flex flex-col p-4">
            <TabView
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedFile={selectedFile}
            />
            <div className="flex-1 overflow-hidden rounded-lg">
              {activeTab === "code" ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
