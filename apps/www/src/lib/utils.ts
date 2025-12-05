import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the avatar URL if provided, otherwise returns the default avatar image.
 * @param avatarUrl - The user's avatar URL (can be null, undefined, or empty string)
 * @param isDark - Optional: whether dark mode is active. If not provided, will default to light mode.
 * @returns The avatar URL or the default avatar path
 */
export function getAvatarUrl(avatarUrl?: string | null, isDark?: boolean): string {
  if (avatarUrl && avatarUrl.trim() !== "") {
    return avatarUrl;
  }
  // Use theme-aware default avatar
  return isDark ? "/noAvatarDark.png" : "/noAvatar.png";
}
