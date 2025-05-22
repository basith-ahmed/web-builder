import React from "react";
import { Code2, Eye, File } from "lucide-react";
import { FileItem } from "@/types";

interface TabViewProps {
  activeTab: "code" | "preview";
  onTabChange: (tab: "code" | "preview") => void;
  selectedFile: FileItem | null;
}

export function TabView({
  activeTab,
  onTabChange,
  selectedFile,
}: TabViewProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex h-8 space-x-1 p-1 border border-white/20 w-fit rounded-lg">
        <button
          onClick={() => onTabChange("code")}
          className={`flex items-center gap-2 p-2 rounded-sm transition-colors ${
            activeTab === "code"
              ? "bg-white/30 text-gray-100"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/20"
          }`}
        >
          <Code2 className="w-4 h-4" />
          Code
        </button>
        <button
          onClick={() => onTabChange("preview")}
          className={`flex items-center gap-2 p-2 rounded-sm transition-colors ${
            activeTab === "preview"
              ? "bg-white/30 text-gray-100"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/20"
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>

      {selectedFile && (
        <span className="text-md text-gray-400 flex items-center space-x-1">
          <File size={14} /> <p>{selectedFile.name}</p>
        </span>
      )}
    </div>
  );
}
