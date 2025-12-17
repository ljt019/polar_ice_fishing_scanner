import { useState, useEffect } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export interface Fish {
  id: number;
  name: string;
  average_size: string;
  average_weight: string;
  average_lifespan: string;
  habitat: string;
  diet: string;
  endangered_status: string;
  blurb: string;
  image_path: string;
  fun_fact: string;
}

interface UseFishScannerOptions {
  displayDurationSeconds?: number;
  debugKey?: string;
}

export function useFishScanner({
  displayDurationSeconds = 3,
  debugKey,
}: UseFishScannerOptions = {}) {
  const [fish, setFish] = useState<Fish | null>(null);

  // Debug key listener
  useEffect(() => {
    if (!debugKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === debugKey.toLowerCase()) {
        invoke("debug_scan_random_fish");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [debugKey]);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    const setupListener = async () => {
      unlisten = await listen<Fish>("fishData", (event) => {
        setFish(event.payload);
      });
    };

    setupListener();
    return () => {
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    if (!fish) return;

    const timeout = setTimeout(() => {
      setFish(null);
    }, displayDurationSeconds * 1000);

    return () => clearTimeout(timeout);
  }, [fish, displayDurationSeconds]);

  return { fish };
}
