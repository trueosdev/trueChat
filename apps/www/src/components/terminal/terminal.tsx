"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTerminal } from "@/hooks/useTerminal";
import { parseCommand } from "@/lib/terminal/command-parser";
import { createCommandRegistry, getCommand, getAllCommandNames } from "@/lib/terminal/command-registry";
import { useAuth } from "@/hooks/useAuth";
import useChatStore from "@/hooks/useChatStore";
import { useColorTheme } from "@/hooks/useColorTheme";
import { formatError } from "@/lib/terminal/output-formatter";
import { getUsers } from "@/lib/services/users";
import type { User } from "@/app/data";
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
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const commandRegistry = useRef(createCommandRegistry());
  const autocompleteMatchesRef = useRef<string[]>([]);
  const autocompletePrefixRef = useRef<string>("");
  const welcomeShownRef = useRef<boolean>(false);
  const usersCacheRef = useRef<User[]>([]);
  const isUsernameAutocompleteRef = useRef<boolean>(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Load users cache on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await getUsers();
        usersCacheRef.current = users;
      } catch (error) {
        console.error("Failed to load users for autocomplete:", error);
      }
    };
    loadUsers();
  }, []);

  // Focus input on mount and show welcome message if output is empty
  useEffect(() => {
    inputRef.current?.focus();
    
    // Show welcome message if terminal just started (output is empty) and not already shown
    if (output.length === 0 && !welcomeShownRef.current) {
      welcomeShownRef.current = true;
      addOutput([
        "                                                                                    ##                                                               ",
        " #######                                                                       ############     ####                                                 ",
        " ###########                ###                                              ######     #####   ####                             ###                 ",
        " ###############            ###                                             ####          ####  ####                             ###                 ",
        " ###################      ######## ### #### ###       ###     #########    ####            #### ############      ##########  #########  #########   ",
        " #####################    ######## ######## ###       ###    ##### ######  ####                 ####### #####    ####   #####  ####### #####   ####  ",
        "    ##################      ###    ####     ###       ###   ###       ###  ####                 ####      ####  ####      ###    ###   ###      #### ",
        "    ##################      ###    ###      ###       ###  ####       #### ####                 ####       ###         ######    ###   #######       ",
        "   ######## ##########      ###    ###      ###       ###  ############### ####            #### ####       ###   ############    ###     ##########  ",
        "  #######     ########      ###    ###      ###       ###  ###              ####           #### ####       ###  ####      ###    ###          ###### ",
        "  ####        #######       ###    ###      ###      ####  ####       ###   #####         ####  ####       ### ####       ###    ###  ####       ### ",
        "            ########        ###### ###      ##### #######   #####   #####    ################   ####       ###  ####   #######   ##### ####    ##### ",
        "           ######            ##### ###       ######## ###     #########         ##########      ####       ###   ########  ####  ###### ##########   ",
        "                                                                                                                                                     ",
        "",
        "Type 'help' to see available commands.",
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
        addOutput(formatError(`Command '${parsed.command}' not found. Type 'help' for available commands.`));
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

  const handleAutocomplete = useCallback(() => {
    const trimmed = input.trim();
    
    // Remove leading slash if present
    const withoutSlash = trimmed.startsWith("/") ? trimmed.slice(1).trim() : trimmed;
    
    // Parse the input to get command and arguments
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    
    for (let i = 0; i < withoutSlash.length; i++) {
      const char = withoutSlash[i];
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
      } else if (char === " " && !inQuotes) {
        if (current) {
          parts.push(current);
          current = "";
        }
      } else {
        current += char;
      }
    }
    
    // If we're in the middle of typing (cursor at end), the last part is what we're typing
    const isTypingLastPart = trimmed.endsWith(" ") === false && current.length > 0;
    const commandName = parts.length > 0 ? parts[0].toLowerCase() : (current || "").toLowerCase();
    // If we have parts and we're still typing, we're on the next argument
    // If we have parts and we finished typing (space at end), we're past the last argument
    const argIndex = isTypingLastPart ? parts.length : parts.length - 1; // Which argument we're on (0 = first arg, -1 = typing command)
    const currentArgPrefix = isTypingLastPart ? current : (parts.length > 0 ? parts[parts.length - 1] : current);
    
    // Commands that accept usernames as arguments
    const usernameCommands = ["chat", "c", "open", "send", "s", "msg"];
    const isUsernameCommand = usernameCommands.includes(commandName);
    const isTypingUsername = isUsernameCommand && argIndex >= 0 && !inQuotes;
    
    let matches: string[];
    let isUsernameAutocomplete = false;
    
    // Check if we're continuing to cycle through the same matches
    const isContinuingCycle = autocompleteIndex !== -1 && 
                               autocompleteMatchesRef.current.length > 0 &&
                               isUsernameAutocompleteRef.current === isUsernameAutocomplete;
    
    if (isTypingUsername && currentArgPrefix) {
      // Username autocomplete
      isUsernameAutocomplete = true;
      isUsernameAutocompleteRef.current = true;
      
      if (isContinuingCycle && autocompleteMatchesRef.current.length > 0) {
        matches = autocompleteMatchesRef.current;
      } else {
        // Search for matching usernames
        const prefix = currentArgPrefix.toLowerCase();
        matches = usersCacheRef.current
          .filter(u => {
            const username = u.username?.toLowerCase() || "";
            const email = u.email?.toLowerCase() || "";
            return username.startsWith(prefix) || email.startsWith(prefix);
          })
          .map(u => u.username || u.email || "")
          .filter(Boolean);
        
        autocompleteMatchesRef.current = matches;
        autocompletePrefixRef.current = currentArgPrefix;
      }
    } else if (argIndex < 0) {
      // Command autocomplete
      isUsernameAutocomplete = false;
      isUsernameAutocompleteRef.current = false;
      
      const commandPrefix = commandName;
      
      if (isContinuingCycle && autocompleteMatchesRef.current.length > 0 && !isUsernameAutocompleteRef.current) {
        matches = autocompleteMatchesRef.current;
      } else {
        const allCommands = getAllCommandNames(commandRegistry.current);
        matches = commandPrefix === "" 
          ? allCommands 
          : allCommands.filter(cmd => 
              cmd.toLowerCase().startsWith(commandPrefix.toLowerCase())
            );
        
        autocompleteMatchesRef.current = matches;
        autocompletePrefixRef.current = commandPrefix;
      }
    } else {
      // No autocomplete for other arguments
      return;
    }
    
    if (matches.length === 0) {
      autocompleteMatchesRef.current = [];
      autocompletePrefixRef.current = "";
      setAutocompleteIndex(-1);
      return;
    }
    
    // Build the new input
    let newInput: string;
    
    if (isTypingUsername) {
      // Username autocomplete - replace only the current argument being typed
      let selectedIndex: number;
      if (!isContinuingCycle || autocompleteIndex === -1) {
        selectedIndex = 0;
        setAutocompleteIndex(0);
        if (matches.length > 1) {
          const matchList = matches.map(u => `  ${u}`).join("\n");
          addOutput([
            `Possible usernames:`,
            matchList,
            `Press Tab again to cycle through matches.`,
            "",
          ]);
        }
      } else {
        selectedIndex = (autocompleteIndex + 1) % matches.length;
        setAutocompleteIndex(selectedIndex);
      }
      
      const completedUsername = matches[selectedIndex];
      
      // Reconstruct input: keep command and completed args, replace only current arg
      if (isTypingLastPart) {
        // Build: command + completed args + completed username
        const commandPart = parts.length > 0 ? parts[0] : "";
        const completedArgs = parts.slice(1);
        const allParts = [...completedArgs, completedUsername];
        const newCommand = allParts.length > 0 
          ? `${commandPart} ${allParts.join(" ")}`
          : commandPart;
        newInput = trimmed.startsWith("/") ? `/${newCommand}` : newCommand;
      } else {
        // Shouldn't happen for username autocomplete when typing, but handle it
        const commandPart = parts.length > 0 ? parts[0] : "";
        const newArgs = [...parts.slice(1), completedUsername].join(" ");
        newInput = trimmed.startsWith("/") 
          ? `/${commandPart} ${newArgs}` 
          : `${commandPart} ${newArgs}`;
      }
    } else {
      // Command autocomplete
      let selectedIndex: number;
      if (!isContinuingCycle || autocompleteIndex === -1) {
        selectedIndex = 0;
        setAutocompleteIndex(0);
        if (matches.length > 1) {
          const matchList = matches.map(cmd => `  ${cmd}`).join("\n");
          addOutput([
            `Possible completions:`,
            matchList,
            `Press Tab again to cycle through matches.`,
            "",
          ]);
        }
      } else {
        selectedIndex = (autocompleteIndex + 1) % matches.length;
        setAutocompleteIndex(selectedIndex);
      }
      
      const completedCommand = matches[selectedIndex];
      const restOfInput = withoutSlash.slice(commandName.length).trim();
      newInput = trimmed.startsWith("/") 
        ? `/${completedCommand}${restOfInput ? " " + restOfInput : ""}` 
        : `${completedCommand}${restOfInput ? " " + restOfInput : ""}`;
    }
    
    setInput(newInput);
    
    if (matches.length === 1) {
      // Single match - reset for next autocomplete
      setAutocompleteIndex(-1);
      autocompleteMatchesRef.current = [];
      autocompletePrefixRef.current = "";
      isUsernameAutocompleteRef.current = false;
    }
  }, [input, autocompleteIndex, addOutput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Reset autocomplete index when user types (but not Tab)
    if (e.key !== "Tab" && autocompleteIndex !== -1) {
      setAutocompleteIndex(-1);
      autocompleteMatchesRef.current = [];
      autocompletePrefixRef.current = "";
      isUsernameAutocompleteRef.current = false;
    }
    
    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand(input);
      setInput("");
      setHistoryIndex(-1);
      setAutocompleteIndex(-1);
      autocompleteMatchesRef.current = [];
      autocompletePrefixRef.current = "";
      isUsernameAutocompleteRef.current = false;
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
      handleAutocomplete();
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
          placeholder="Type 'help' for commands"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}

