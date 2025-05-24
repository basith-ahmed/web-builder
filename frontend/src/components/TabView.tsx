import React from "react";
import { Code2, Eye, ScreenShare } from "lucide-react";
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
    <div className="flex items-center justify-between p-2">
      <div className="flex h-8 space-x-2 w-fit">
        <button
          onClick={() => onTabChange("code")}
          className={`cursor-pointer flex items-center gap-2 p-2 rounded-md transition-colors ${
            activeTab === "code"
              ? "bg-white/10 text-gray-100"
              : "text-white/80 hover:text-gray-200 hover:bg-white/10"
          }`}
        >
          <Code2 className="w-4 h-4" />
          Code
        </button>
        <button
          onClick={() => onTabChange("preview")}
          className={`cursor-pointer flex items-center gap-2 p-2 rounded-md transition-colors ${
            activeTab === "preview"
              ? "bg-white/10 text-gray-100"
              : "text-white/80 hover:text-gray-200 hover:bg-white/10"
          }`}
        >
          <ScreenShare className="w-4 h-4" />
          Preview
        </button>
      </div>
      {selectedFile && activeTab === "code" && (
        <span className="text-md text-white flex items-center space-x-1 pr-4">
          {/* <File size={14} /> */}
          <Eye className="w-4 h-4" />
          <p>{selectedFile.name}</p>
        </span>
      )}
    </div>
  );
}
