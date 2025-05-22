import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);

  useEffect(() => {
    async function boot() {
      if (!webcontainerInstance) {
        webcontainerInstance = await WebContainer.boot();
      }
      setWebcontainer(webcontainerInstance);
    }
    boot();

    return () => {
      if (webcontainerInstance) {
        webcontainerInstance.teardown();
        webcontainerInstance = null;
      }
    };
  }, []);

  return webcontainer;
}
