import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';
import { bootWebContainer } from '@/lib/webcontainer';

let webcontainerInstance: WebContainer | null = null;
let isBooting = false;

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(webcontainerInstance);

  useEffect(() => {
    async function boot() {
      if (!webcontainerInstance && !isBooting) {
        isBooting = true;
        try {
          webcontainerInstance = await bootWebContainer();
          setWebcontainer(webcontainerInstance);
        } catch (error) {
          console.error('Failed to boot WebContainer:', error);
        } finally {
          isBooting = false;
        }
      }
    }
    boot();

    // Only teardown when the "app" is closing
    return () => {
      // BUG: restart at every previewfroame mount and unmount. No teardown operation here, let it persist.
    };
  }, []);

  return webcontainer;
}
