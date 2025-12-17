import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const APP_WINDOW = getCurrentWebviewWindow();
const FULLSCREEN_DELAY_MS = 500;

export function useFullscreenOnMount({ enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return;

    const enterFullscreen = async () => {
      await APP_WINDOW.maximize();
      setTimeout(() => APP_WINDOW.setFullscreen(true), FULLSCREEN_DELAY_MS);
    };

    enterFullscreen();
  }, [enabled]);
}
