"use client";

import { useState, useEffect } from "react";

const TERMINAL_MODE_KEY = "terminal-mode";

export function useTerminal() {
  const [isTerminalMode, setIsTerminalMode] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(TERMINAL_MODE_KEY);
    if (saved === "true") {
      setIsTerminalMode(true);
    }
  }, []);

  const toggleTerminalMode = () => {
    const newMode = !isTerminalMode;
    setIsTerminalMode(newMode);
    localStorage.setItem(TERMINAL_MODE_KEY, String(newMode));
    
    // Refresh the page to apply terminal mode changes
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const addToHistory = (command: string) => {
    if (command.trim()) {
      setCommandHistory((prev) => [...prev, command]);
      setHistoryIndex(-1);
    }
  };

  const getHistoryCommand = (direction: "up" | "down"): string | null => {
    if (commandHistory.length === 0) return null;

    let newIndex = historyIndex;
    if (direction === "up") {
      newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 ? -1 : Math.min(commandHistory.length - 1, historyIndex + 1);
    }

    setHistoryIndex(newIndex);
    return newIndex >= 0 ? commandHistory[newIndex] : null;
  };

  const addOutput = (lines: string | string[]) => {
    const linesArray = Array.isArray(lines) ? lines : [lines];
    setOutput((prev) => [...prev, ...linesArray]);
  };

  const clearOutput = () => {
    setOutput([]);
  };

  return {
    isTerminalMode,
    toggleTerminalMode,
    commandHistory,
    addToHistory,
    getHistoryCommand,
    currentConversationId,
    setCurrentConversationId,
    output,
    addOutput,
    clearOutput,
  };
}

