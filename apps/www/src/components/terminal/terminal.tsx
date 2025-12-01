"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTerminal } from "@/hooks/useTerminal";
import { parseCommand } from "@/lib/terminal/command-parser";
import { createCommandRegistry, getCommand } from "@/lib/terminal/command-registry";
import { useAuth } from "@/hooks/useAuth";
import useChatStore from "@/hooks/useChatStore";
import { useColorTheme } from "@/hooks/useColorTheme";
import { formatError } from "@/lib/terminal/output-formatter";
import "@/app/terminal.css";

export function Terminal() {
  const {
    output,
    addOutput,
    clearOutput,
    addToHistory,
    getHistoryCommand,
    currentConversationId,
    setCurrentConversationId,
    toggleTerminalMode,
  } = useTerminal();

  const { user } = useAuth();
  const store = useChatStore();
  const { setColorTheme, colorThemes } = useColorTheme();
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const commandRegistry = useRef(createCommandRegistry());

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on mount and show welcome message if output is empty
  useEffect(() => {
    inputRef.current?.focus();
    
    // Show welcome message if terminal just started (output is empty)
    if (output.length === 0) {
      addOutput([
        "╔════════════════════════════════════════════════════════════╗",
        "║                  trueChat Terminal Mode                    ║",
        "╚════════════════════════════════════════════════════════════╝",
        "",
        "Welcome to trueChat Terminal Mode!",
        "Type '/help' to see available commands.",
        "",
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeCommand = useCallback(async (commandInput: string) => {
    if (!commandInput.trim()) {
      return;
    }

    // Add command to output
    addOutput(`$> ${commandInput}`);

    // Add to history
    addToHistory(commandInput);
    setHistoryIndex(-1);

    try {
      // Parse command
      const parsed = parseCommand(commandInput);
      const command = getCommand(parsed.command, commandRegistry.current);

      if (!command) {
        addOutput(formatError(`Command '/${parsed.command}' not found. Type '/help' for available commands.`));
        return;
      }

      // Create command context
      const context = {
        user,
        store,
        addOutput,
        setCurrentConversationId,
        currentConversationId,
        setColorTheme,
        colorThemes,
      };

      // Execute command
      const result = await command.handler(parsed.args, parsed.flags, context);
      const outputLines = Array.isArray(result) ? result : [result];
      addOutput(outputLines);

      // Handle special commands
      if (parsed.command === "clear" || parsed.command === "cls") {
        clearOutput();
      } else if (parsed.command === "exit" || parsed.command === "gui" || parsed.command === "quit") {
        setTimeout(() => {
          toggleTerminalMode();
        }, 500);
      } else if (parsed.command === "theme" && parsed.args.length > 0 && parsed.args[0] !== "list") {
        // Theme change is handled by the command, but we might need to refresh
        // The useColorTheme hook will handle the actual theme change
      }
    } catch (error) {
      addOutput(formatError(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
  }, [user, store, addOutput, setCurrentConversationId, currentConversationId, clearOutput, toggleTerminalMode, addToHistory, setColorTheme, colorThemes]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand(input);
      setInput("");
      setHistoryIndex(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const historyCmd = getHistoryCommand("up");
      if (historyCmd !== null) {
        setInput(historyCmd);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const historyCmd = getHistoryCommand("down");
      if (historyCmd !== null) {
        setInput(historyCmd || "");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // TODO: Implement autocomplete
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-output" ref={outputRef}>
        {output.map((line, index) => (
          <div key={index} className="terminal-line">
            {line}
          </div>
        ))}
      </div>
      <div className="terminal-input-container">
        <span className="terminal-prompt">trueChat&gt;</span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type '/help' for commands"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}

