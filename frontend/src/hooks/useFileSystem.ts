import { useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { FileItem } from '@/types';
import { createMountStructure } from '@/lib/webcontainer';

export function useFileSystem(webContainer: WebContainer | null, files: FileItem[]) {
  useEffect(() => {
    if (!webContainer) return;

    const mountStructure = createMountStructure(files);
    webContainer.mount(mountStructure);
  }, [files, webContainer]);
} 