import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const appWindow = getCurrentWebviewWindow();

export function useFullscreenOnMount({ enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return;

    const maximizeAndFullscreen = async () => {
      try {
        await appWindow.maximize();
        setTimeout(() => appWindow.setFullscreen(true), 500);
      } catch (err) {
        console.error("Error during window manipulation:", err);
      }
    };

    maximizeAndFullscreen();
  }, [enabled]);
}
