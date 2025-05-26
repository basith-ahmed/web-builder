export interface JsonResponse {
  title: string;
  description: string;
  steps: {
    type: "file" | "shell";
    path?: string;
    content?: string;
    process?: "Creating" | "Modifying";
  }[];
}

export enum StepType {
  CreateFile,
  CreateFolder,
  EditFile,
  DeleteFile,
  RunScript,
}

export interface Step {
  id: number;
  title: string;
  description: string;
  type: StepType;
  status: "pending" | "in-progress" | "completed";
  code?: string;
  path?: string;
}

export interface Project {
  prompt: string;
  steps: Step[];
}

export interface FileItem {
  name: string;
  type: "file" | "folder";
  path?: string;
  content?: string;
  children?: FileItem[];
}

export interface FileViewerProps {
  file: FileItem | null;
  onClose: () => void;
}
