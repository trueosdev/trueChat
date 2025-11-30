"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useColorTheme } from "@/hooks/useColorTheme";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeColorInitializer>{children}</ThemeColorInitializer>
    </NextThemesProvider>
  );
}

function ThemeColorInitializer({ children }: { children: React.ReactNode }) {
  useColorTheme(); // This will apply the colors
  return <>{children}</>;
}
