import { CommandHandler } from "./index";
import { colorThemes, ColorTheme } from "@/lib/types/theme";

export const themeCommand: CommandHandler = {
  name: "theme",
  aliases: ["color"],
  description: "Change color theme",
  usage: "/theme [name] | /theme list",
  handler: async (args, flags, context) => {
    const themes = context.colorThemes || colorThemes;
    
    if (args.length === 0 || args[0] === "list") {
      // List all themes
      const lines: string[] = [
        "Available Themes:",
        "",
      ];
      
      for (const theme of themes) {
        lines.push(`  • ${theme.name}`);
      }
      
      lines.push("");
      lines.push("Usage: /theme <name>");
      
      return lines;
    } else {
      const themeName = args.join(" ");
      const theme = themes.find(t => 
        t.name.toLowerCase() === themeName.toLowerCase()
      );
      
      if (!theme) {
        return [`Theme '${themeName}' not found. Type '/theme list' to see available themes.`];
      }
      
      // Change theme if setColorTheme is available in context
      if (context.setColorTheme) {
        context.setColorTheme(theme);
        return [`Theme changed to: ${theme.name}`];
      }
      
      return [
        `Theme '${theme.name}' selected.`,
        "Note: Theme changes require GUI mode. Use '/exit' to return to GUI and apply theme changes.",
      ];
    }
  },
};

