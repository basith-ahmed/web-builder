import React, { useState } from 'react';
import { FolderTree, File, ChevronRight, ChevronDown } from 'lucide-react';
import { FileItem } from '@/types';

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
}

interface FileNodeProps {
  item: FileItem;
  depth: number;
  onFileClick: (file: FileItem) => void;
}

function FileNode({ item, depth, onFileClick }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
    }
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 hover:bg-white/10 rounded-md cursor-pointer text-white/80 transition-all duration-200 py-1.5 px-2 group"
        style={{ paddingLeft: `${depth * 1 + 0.5}rem` }}
        onClick={handleClick}
      >
        {item.type === "folder" && (
          <span className="text-white/50 group-hover:text-white/70 transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        <span className="text-[#bdbdbd] group-hover:text-white/70 transition-colors">
          {item.type === "folder" ? (
            <FolderTree className="w-4 h-4" />
          ) : (
            <File className="w-4 h-4" />
          )}
        </span>
        <span className="text-white/90 group-hover:text-white transition-colors">
          {item.name}
        </span>
      </div>
      {item.type === "folder" && isExpanded && item.children && (
        <div className="border-l border-white/10 ml-2">
          {item.children.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, onFileSelect }: FileExplorerProps) {
  return (
    <div className="rounded-lg p-4 h-full overflow-auto bg-[#0a0a0a]">
      {/* <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white/90 px-2">
        <FolderTree className="w-5 h-5" />
        File Explorer
      </h2> */}
      <div className="space-y-0.5">
        {files.slice().reverse().map((file, index) => (
          <FileNode
            key={`${file.path}-${index}`}
            item={file}
            depth={0}
            onFileClick={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}