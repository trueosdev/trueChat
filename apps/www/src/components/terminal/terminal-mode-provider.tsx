"use client";

import { useEffect } from "react";
import { useTerminal } from "@/hooks/useTerminal";

export function TerminalModeProvider({ children }: { children: React.ReactNode }) {
  const { isTerminalMode } = useTerminal();

  useEffect(() => {
    if (isTerminalMode) {
      document.documentElement.classList.add("terminal-mode");
    } else {
      document.documentElement.classList.remove("terminal-mode");
    }
  }, [isTerminalMode]);

  return <>{children}</>;
}

