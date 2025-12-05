import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the avatar URL if provided, otherwise returns the default avatar image.
 * @param avatarUrl - The user's avatar URL (can be null, undefined, or empty string)
 * @returns The avatar URL or the default avatar path
 */
export function getAvatarUrl(avatarUrl?: string | null): string {
  return avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : "/noAvatar.jpg";
}
