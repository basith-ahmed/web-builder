import React from "react";
import Editor from "@monaco-editor/react";
import { FileItem } from "@/types";
import { Eye } from "lucide-react";

interface CodeEditorProps {
  file: FileItem | null;
}

export function CodeEditor({ file }: CodeEditorProps) {
  if (!file) {
    return (
      <div className="h-full w-full flex items-center justify-center text-white/50">
        Select a file to view its contents.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-2 px-3 flex items-center gap-2">
        <Eye className="w-5 h-5 text-white/80" />
        <span className="text-sm text-white flex items-center space-x-1 px-2 py-1 w-full">
          {file.name}
        </span>
      </div>
      <Editor
        className="bg-black"
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={file.content || ""}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          padding: {
            top: 20,
            bottom: 50,
          },
        }}
      />
    </div>
  );
}
