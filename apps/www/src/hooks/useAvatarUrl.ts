"use client";

import { useTheme } from "next-themes";
import { getAvatarUrl as getAvatarUrlUtil } from "@/lib/utils";

/**
 * Hook that returns a theme-aware avatar URL.
 * @param avatarUrl - The user's avatar URL (can be null, undefined, or empty string)
 * @returns The avatar URL or the theme-appropriate default avatar path
 */
export function useAvatarUrl(avatarUrl?: string | null): string {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return getAvatarUrlUtil(avatarUrl, isDark);
}

